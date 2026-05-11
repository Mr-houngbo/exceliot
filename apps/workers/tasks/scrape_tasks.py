from celery_app import app
from db.supabase import supabase
from scrapers.adzuna import fetch_adzuna_jobs
from scrapers.generic_html import GenericHTMLScraper
from scrapers.headless import HeadlessScraper
from scrapers.selectors import get_selectors
from pipeline.cleaner import clean_adzuna_job
from pipeline.deduplicator import deduplicate_jobs
from datetime import datetime, timezone
import traceback
import time

# Sources that require headless browser
HEADLESS_SOURCES = ['indeed', 'welcometothejungle', 'linkedin', 'educarriere', 'senjob']

def clean_generic_job(scraped_job: dict, source_id: str) -> dict:
    """
    Maps a generic scraped job to the Supabase `jobs` table schema.
    """
    location = scraped_job.get("location", "")
    url = scraped_job.get("url", "")
    
    # Heuristic for default location if empty
    if not location:
        if ".sn" in url or "senjob" in url:
            location = "Sénégal"
        elif ".ci" in url or "educarriere" in url or "emploi.ci" in url:
            location = "Côte d'Ivoire"
        else:
            location = "Afrique" # Default fallback for regional sources

    return {
        "external_id": str(scraped_job.get("external_id")),
        "source_id": source_id,
        "url": url,
        "title": scraped_job.get("title", ""),
        "company": scraped_job.get("company", ""),
        "location": location,
        "description": scraped_job.get("description", ""),
        "raw_data": scraped_job.get("raw_data", {}),
    }

@app.task
def scrape_source_task(source_id: str):
    """
    Task to scrape a specific source by its ID.
    """
    # 1. Fetch Source details
    source_resp = supabase.table('sources').select('*').eq('id', source_id).execute()
    if not source_resp.data:
        print(f"Error: Source {source_id} not found.")
        return
    source = source_resp.data[0]
    source_name = source['name'].lower()
    base_url = source['base_url']

    print(f"Starting scraper for {source_name} ({base_url})...")

    # 2. Create Scraping Log
    log_data = {
        "source_id": source_id,
        "status": "running"
    }
    log_resp = supabase.table('scraping_logs').insert(log_data).execute()
    log_id = log_resp.data[0]['id']

    try:
        # 3. Fetch Jobs based on source type
        raw_jobs = []
        if source_name == 'adzuna':
            raw_jobs = fetch_adzuna_jobs(keyword="excel", max_pages=5)
            clean_jobs = [clean_adzuna_job(job, source_id) for job in raw_jobs]
        else:
            # Get selectors from registry
            selectors = get_selectors(source_name)
            
            # Normalize name for matching
            match_name = source_name.lower().replace(" ", "")
            
            if any(hs in match_name for hs in HEADLESS_SOURCES):
                scraper = HeadlessScraper(source_name, base_url, selectors)
            else:
                scraper = GenericHTMLScraper(source_name, base_url, selectors)
                
            raw_jobs = scraper.fetch_jobs()
            clean_jobs = [clean_generic_job(job, source_id) for job in raw_jobs]

        print(f"[{source_name}] Fetched {len(raw_jobs)} raw jobs.")

        # 4. Deduplicate
        jobs_to_insert, jobs_to_update, duplicate_count = deduplicate_jobs(clean_jobs)
        print(f"[{source_name}] Found {len(jobs_to_insert)} new jobs, {duplicate_count} duplicates.")

        # 5. Insert New Jobs in batches
        inserted_count = 0
        batch_size = 100
        for i in range(0, len(jobs_to_insert), batch_size):
            batch = jobs_to_insert[i:i+batch_size]
            if batch:
                supabase.table('jobs').insert(batch).execute()
                inserted_count += len(batch)
        
        # 6. Update Source 'last_scraped_at'
        supabase.table('sources').update({"last_scraped_at": datetime.now(timezone.utc).isoformat()}).eq("id", source_id).execute()

        # 7. Close Scraping Log
        supabase.table('scraping_logs').update({
            "status": "success",
            "finished_at": datetime.now(timezone.utc).isoformat(),
            "jobs_found": len(raw_jobs),
            "jobs_new": inserted_count,
            "jobs_duplicate": duplicate_count
        }).eq("id", log_id).execute()

        print(f"[{source_name}] Scraper pipeline completed successfully.")

    except Exception as e:
        error_msg = str(e)
        print(f"[{source_name}] Scraper pipeline failed: {error_msg}")
        traceback.print_exc()
        
        supabase.table('scraping_logs').update({
            "status": "failed",
            "finished_at": datetime.now(timezone.utc).isoformat(),
            "error_message": error_msg
        }).eq("id", log_id).execute()

@app.task
def run_all_scrapers_task():
    """
    Main task to trigger all active scrapers.
    """
    print("Triggering all active scrapers...")
    sources_resp = supabase.table('sources').select('id').eq('is_active', True).execute()
    sources = sources_resp.data
    
    if not sources:
        print("No active sources found.")
        return

    print(f"Found {len(sources)} active sources to scrape.")
    for source in sources:
        # We use delay() to run them in parallel via Celery
        scrape_source_task.delay(source['id'])
        # Add a small delay between tasks to avoid overwhelming the system/network
        time.sleep(1)
