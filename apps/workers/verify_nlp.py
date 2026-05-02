from tasks.nlp_tasks import run_nlp_scoring
import os
from dotenv import load_dotenv

load_dotenv()

def verify():
    print("Starting manual verification of NLP Scoring...")
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ ERROR: OPENAI_API_KEY not found in environment.")
        return
    
    try:
        run_nlp_scoring()
        print("✅ NLP Scoring task executed successfully (check logs for details).")
    except Exception as e:
        print(f"❌ ERROR during NLP Scoring: {e}")

if __name__ == "__main__":
    verify()
