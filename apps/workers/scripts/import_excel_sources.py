import pandas as pd
import os
import sys
from urllib.parse import urlparse

# Add current working directory to path to import db.supabase
sys.path.append(os.getcwd())
from db.supabase import supabase

def get_domain(url):
    try:
        domain = urlparse(url).netloc
        if not domain:
            domain = url.split('/')[0]
        return domain.replace('www.', '')
    except:
        return url

def import_sources():
    print("Starting import from Excel files...")
    
    # Paths relative to the script location (apps/workers/scripts)
    # If running from apps/workers, paths are correct
    ci_path = os.path.join('..', '..', 'data', 'sites-ivory-coast.xlsx')
    sn_path = os.path.join('..', '..', 'data', 'sites-senegal.xlsx')
    
    # 1. Ivory Coast
    if os.path.exists(ci_path):
        df_ci = pd.read_excel(ci_path)
        print(f"Loaded {len(df_ci)} sites from Ivory Coast.")
        
        sources_ci = []
        for _, row in df_ci.iterrows():
            url = str(row['Site'])
            name = get_domain(url)
            sources_ci.append({
                "name": name,
                "base_url": url,
                "is_active": True,
                "scraping_frequency_hours": 24
            })
    else:
        print(f"Warning: {ci_path} not found.")
        sources_ci = []
    
    # 2. Senegal
    if os.path.exists(sn_path):
        df_sn = pd.read_excel(sn_path)
        print(f"Loaded {len(df_sn)} sites from Senegal.")
        
        sources_sn = []
        for _, row in df_sn.iterrows():
            url = str(row['URL'])
            name = str(row.get('Nom du Site', get_domain(url)))
            sources_sn.append({
                "name": name,
                "base_url": url,
                "is_active": True,
                "scraping_frequency_hours": 24
            })
    else:
        print(f"Warning: {sn_path} not found.")
        sources_sn = []
    
    all_sources = sources_ci + sources_sn
    print(f"Total sources to process: {len(all_sources)}")
    
    success_count = 0
    skipped_count = 0
    for source in all_sources:
        try:
            # Check if exists first
            check = supabase.table('sources').select('id').eq('base_url', source['base_url']).execute()
            if check.data:
                skipped_count += 1
                continue
                
            supabase.table('sources').insert(source).execute()
            success_count += 1
            print(f"Imported: {source['name']}")
        except Exception as e:
            print(f"Failed to import {source['name']}: {e}")
            
    print(f"Import finished. Successfully imported {success_count} sources. Skipped {skipped_count} existing sources.")

if __name__ == "__main__":
    import_sources()
