import os
import sys
sys.path.append(os.getcwd())
from db.supabase import supabase
import re

def is_valid_url(url):
    return re.match(r'^https?://', url) is not None

def fix_urls():
    print("Repairing source URLs in database...")
    res = supabase.table('sources').select('id, name, base_url').execute()
    sources = res.data
    
    updated_count = 0
    for s in sources:
        url = s['base_url']
        original_url = url
        
        # 1. Handle missing protocol
        if not url.startswith('http'):
            # If it looks like a domain (has a dot)
            if '.' in url:
                url = f"https://{url}"
            else:
                # It's just a name, try to make it a .com or similar? 
                # Better to keep it as is for now or flag it.
                pass
        
        if url != original_url:
            supabase.table('sources').update({"base_url": url}).eq('id', s['id']).execute()
            updated_count += 1
            print(f"Fixed: {original_url} -> {url}")
            
    print(f"Repair finished. Updated {updated_count} URLs.")

if __name__ == "__main__":
    fix_urls()
