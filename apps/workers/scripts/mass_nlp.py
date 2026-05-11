import os
import sys
import time

# Add current working directory to path to import local modules
sys.path.append(os.getcwd())

from tasks.nlp_tasks import run_nlp_scoring
from db.supabase import supabase

def mass_score():
    print("Starting Mass NLP Scoring...")
    
    while True:
        # Check how many unscored jobs remain
        res = supabase.table('jobs').select('id', count='exact').is_('nlp_extracted_at', 'null').execute()
        remaining = res.count if res.count is not None else 0
        
        print(f"--- {remaining} jobs remaining to score ---")
        
        if remaining == 0:
            print("All jobs scored!")
            break
            
        # Run one batch (run_nlp_scoring handles 20 jobs per batch by default)
        try:
            run_nlp_scoring()
        except Exception as e:
            print(f"Error during scoring batch: {e}")
            time.sleep(5)
            
        # Small delay to avoid rate limits if using Gemini
        time.sleep(2)

if __name__ == "__main__":
    mass_score()
