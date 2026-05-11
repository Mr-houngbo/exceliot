import os
import sys
sys.path.append(os.getcwd())
from db.supabase import supabase

def debug_data():
    # 1. Total Jobs
    res = supabase.table('jobs').select('id', count='exact').execute()
    print(f"Total jobs: {res.count}")
    
    # 2. Active Jobs
    res = supabase.table('jobs').select('id', count='exact').eq('is_active', True).execute()
    print(f"Active jobs: {res.count}")
    
    # 3. Regional Jobs (Any)
    res = supabase.table('jobs').select('title, location').execute()
    ci_count = 0
    sn_count = 0
    for j in res.data:
        loc = (j['location'] or '').lower()
        title = (j['title'] or '').lower()
        if 'ivoire' in loc or 'abidjan' in loc or 'ivoire' in title:
            ci_count += 1
        if 'senegal' in loc or 'dakar' in loc or 'senegal' in title:
            sn_count += 1
            
    print(f"CI Jobs found in DB (Raw): {ci_count}")
    print(f"SN Jobs found in DB (Raw): {sn_count}")
    
    # 4. Check API filter (15 days)
    from datetime import datetime, timezone, timedelta
    fifteen_days_ago = (datetime.now(timezone.utc) - timedelta(days=15)).isoformat()
    res = supabase.table('jobs').select('id', count='exact').gt('created_at', fifteen_days_ago).execute()
    print(f"Jobs created in last 15 days: {res.count}")

if __name__ == "__main__":
    debug_data()
