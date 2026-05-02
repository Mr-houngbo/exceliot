from celery_app import app
from db.supabase import supabase
from scrapers.adzuna import fetch_adzuna_jobs
from pipeline.cleaner import clean_adzuna_job
from pipeline.deduplicator import deduplicate_jobs
from datetime import datetime, timezone
import traceback

@app.task
def run_adzuna_scraper():
    print("Starting Adzuna scraper pipeline...")
    
    # 1. Fetch Adzuna Source ID
    source_resp = supabase.table('sources').select('id').eq('name', 'adzuna').execute()
    if not source_resp.data:
        print("Error: Adzuna source not found in database.")
        return
    source_id = source_resp.data[0]['id']

    # 2. Create Scraping Log
    log_data = {
        "source_id": source_id,
        "status": "running"
    }
    log_resp = supabase.table('scraping_logs').insert(log_data).execute()
    log_id = log_resp.data[0]['id']

    try:
        # 3. Fetch Jobs
        print("Fetching jobs from Adzuna...")
        raw_jobs = fetch_adzuna_jobs(keyword="excel", max_pages=5)
        print(f"Fetched {len(raw_jobs)} raw jobs.")

        # 4. Clean Jobs
        clean_jobs = [clean_adzuna_job(job, source_id) for job in raw_jobs]

        # 5. Deduplicate
        jobs_to_insert, jobs_to_update, duplicate_count = deduplicate_jobs(clean_jobs)
        print(f"Found {len(jobs_to_insert)} new jobs, {duplicate_count} duplicates.")

        # 6. Insert New Jobs in batches
        inserted_count = 0
        batch_size = 100
        for i in range(0, len(jobs_to_insert), batch_size):
            batch = jobs_to_insert[i:i+batch_size]
            if batch:
                supabase.table('jobs').insert(batch).execute()
                inserted_count += len(batch)
        print(f"Inserted {inserted_count} new jobs.")

        # Optional: Update existing jobs if needed, skipping for MVP to keep it simple

        # 7. Update Source 'last_scraped_at'
        supabase.table('sources').update({"last_scraped_at": datetime.now(timezone.utc).isoformat()}).eq("id", source_id).execute()

        # 8. Close Scraping Log
        supabase.table('scraping_logs').update({
            "status": "success",
            "finished_at": datetime.now(timezone.utc).isoformat(),
            "jobs_found": len(raw_jobs),
            "jobs_new": inserted_count,
            "jobs_duplicate": duplicate_count
        }).eq("id", log_id).execute()

        print("Adzuna scraper pipeline completed successfully.")

    except Exception as e:
        error_msg = str(e)
        print(f"Adzuna scraper pipeline failed: {error_msg}")
        traceback.print_exc()
        
        supabase.table('scraping_logs').update({
            "status": "failed",
            "finished_at": datetime.now(timezone.utc).isoformat(),
            "error_message": error_msg
        }).eq("id", log_id).execute()
