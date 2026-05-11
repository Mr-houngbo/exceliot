from celery_app import app
from db.supabase import supabase
from datetime import datetime, timezone, timedelta
import httpx
import asyncio

@app.task
def run_cleanup_task():
    print("Starting maintenance: Cleaning up old and dead jobs...")
    
    # 1. Auto-expire jobs older than 30 days
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    res = supabase.table('jobs').update({"is_active": False}).lt('created_at', thirty_days_ago).eq('is_active', True).execute()
    expired_count = len(res.data) if res.data else 0
    print(f"Auto-expired {expired_count} jobs.")
    
    # 2. Check for dead links (Batch of 50)
    # This is better run in a script or with more complex logic, 
    # but we'll do a simple sync check for the task
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    res = supabase.table('jobs').select('id, url').eq('is_active', True).lt('scraped_at', yesterday).limit(50).execute()
    jobs = res.data
    
    if jobs:
        deactivated = 0
        with httpx.Client(verify=False, timeout=10.0) as client:
            for j in jobs:
                try:
                    resp = client.head(j['url'], follow_redirects=True)
                    if resp.status_code == 404:
                        supabase.table('jobs').update({"is_active": False}).eq("id", j['id']).execute()
                        deactivated += 1
                except:
                    continue
        print(f"Deactivated {deactivated} dead links.")

    return {"expired": expired_count, "deactivated": deactivated if 'deactivated' in locals() else 0}
