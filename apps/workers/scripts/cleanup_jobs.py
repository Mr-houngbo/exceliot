import httpx
import asyncio
from db.supabase import supabase
from datetime import datetime, timezone, timedelta

async def check_url(client, job_id, url):
    try:
        # Use HEAD request for speed
        resp = await client.head(url, follow_redirects=True, timeout=10.0)
        if resp.status_code == 404:
            print(f"Job {job_id}: 404 Dead Link -> Deactivating")
            supabase.table('jobs').update({"is_active": False}).eq("id", job_id).execute()
        elif resp.status_code >= 400:
            print(f"Job {job_id}: Error {resp.status_code} -> Marking as potentially inactive")
            # Maybe keep it but flag it
            pass
    except Exception as e:
        # If it's a timeout or connection error, the site might just be slow
        # We don't deactivate immediately
        pass

async def clean_dead_links():
    print("Checking for dead links...")
    # Only check active jobs that were scraped more than 24h ago
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    
    res = supabase.table('jobs').select('id, url').eq('is_active', True).lt('scraped_at', yesterday).limit(50).execute()
    jobs = res.data
    
    if not jobs:
        print("No old active jobs to check.")
        return

    async with httpx.AsyncClient(verify=False) as client:
        tasks = [check_url(client, j['id'], j['url']) for j in jobs]
        await asyncio.gather(*tasks)

def auto_expire():
    print("Auto-expiring old jobs...")
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    res = supabase.table('jobs').update({"is_active": False}).lt('created_at', thirty_days_ago).eq('is_active', True).execute()
    print(f"Expired {len(res.data) if res.data else 0} jobs.")

if __name__ == "__main__":
    auto_expire()
    asyncio.run(clean_dead_links())
