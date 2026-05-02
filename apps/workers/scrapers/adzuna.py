import os
import httpx
from typing import List, Dict, Any

ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID")
ADZUNA_API_KEY = os.getenv("ADZUNA_API_KEY")
BASE_URL = "https://api.adzuna.com/v1/api/jobs/fr/search"

def fetch_adzuna_jobs(keyword: str = "excel", max_pages: int = 5) -> List[Dict[str, Any]]:
    """
    Fetches jobs from Adzuna API matching the given keyword.
    Handles pagination up to max_pages.
    """
    if not ADZUNA_APP_ID or not ADZUNA_API_KEY:
        raise ValueError("Missing Adzuna credentials in environment variables")

    all_jobs = []
    
    with httpx.Client() as client:
        for page in range(1, max_pages + 1):
            params = {
                "app_id": ADZUNA_APP_ID,
                "app_key": ADZUNA_API_KEY,
                "results_per_page": 50,
                "what": keyword,
                "content-type": "application/json"
            }
            
            try:
                response = client.get(f"{BASE_URL}/{page}", params=params)
                response.raise_for_status()
                data = response.json()
                
                results = data.get("results", [])
                if not results:
                    break  # No more results
                    
                all_jobs.extend(results)
                
            except Exception as e:
                print(f"Error fetching page {page} from Adzuna: {e}")
                break
                
    return all_jobs
