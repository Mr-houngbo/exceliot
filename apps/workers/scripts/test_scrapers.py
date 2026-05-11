import os
import sys

# Add current working directory to path to import local modules
sys.path.append(os.getcwd())

from tasks.scrape_tasks import scrape_source_task
from db.supabase import supabase

def test_scrapers():
    print("Starting Scraper Test Suite...")
    
    # Fetch a few interesting sources
    # Try to find Educarriere or Senjob if they were imported
    sources_resp = supabase.table('sources').select('id, name, base_url').neq('name', 'adzuna').limit(3).execute()
    sources = sources_resp.data
    
    if not sources:
        print("No sources found in database (except adzuna).")
        return

    print(f"Found {len(sources)} sources to test.")
    
    for s in sources:
        print(f"\n--- Testing: {s['name']} ({s['base_url']}) ---")
        try:
            # We call the task function directly
            scrape_source_task(s['id'])
        except Exception as e:
            print(f"Critical error testing {s['name']}: {e}")

if __name__ == "__main__":
    test_scrapers()
