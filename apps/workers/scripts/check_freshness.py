import os
import sys
sys.path.append(os.getcwd())
from db.supabase import supabase

def check_freshness():
    res = supabase.table('jobs').select('created_at').order('created_at', desc=False).limit(1).execute()
    if res.data:
        print(f"Oldest job created at: {res.data[0]['created_at']}")
    
    res = supabase.table('jobs').select('created_at').order('created_at', desc=True).limit(1).execute()
    if res.data:
        print(f"Newest job created at: {res.data[0]['created_at']}")
        
    # Count jobs by relevance tier
    res = supabase.table('jobs').select('relevance_tier').execute()
    tiers = [d['relevance_tier'] for d in res.data]
    from collections import Counter
    print(f"Stats by Tier: {Counter(tiers)}")

if __name__ == "__main__":
    check_freshness()
