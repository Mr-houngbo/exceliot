import hashlib
from typing import List, Dict, Any, Tuple
from db.supabase import supabase

def generate_job_hash(title: str, company: str) -> str:
    """Generates a fallback hash based on title and company."""
    hash_input = f"{str(title).lower().strip()}|{str(company).lower().strip()}"
    return hashlib.md5(hash_input.encode('utf-8')).hexdigest()

def deduplicate_jobs(clean_jobs: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], int]:
    """
    Takes a list of clean jobs and checks them against the database.
    Returns (jobs_to_insert, jobs_to_update, duplicate_count).
    """
    if not clean_jobs:
        return [], [], 0

    urls = [job['url'] for job in clean_jobs if job.get('url')]
    
    # Batch query existing URLs
    existing_jobs_resp = supabase.table('jobs').select('url, external_id').in_('url', urls).execute()
    existing_urls = {row['url']: row for row in existing_jobs_resp.data}
    
    # We could also fetch by fallback hash if needed, but the primary unique constraint is URL.
    # The user mentioned a fallback hash for cross-platform deduplication, which we can compute here 
    # and mark them as duplicate if we want, but for now we'll stick to URL for standard upserts.
    
    jobs_to_insert = []
    jobs_to_update = []
    duplicate_count = 0
    
    for job in clean_jobs:
        job_url = job.get('url')
        
        if job_url in existing_urls:
            # It's an existing job, prepare for update
            jobs_to_update.append(job)
            duplicate_count += 1
        else:
            # It's a new job
            jobs_to_insert.append(job)
            
    return jobs_to_insert, jobs_to_update, duplicate_count
