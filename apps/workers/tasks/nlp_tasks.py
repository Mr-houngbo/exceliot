from celery_app import app
from db.supabase import supabase
from pipeline.scorer import score_job
from datetime import datetime, timezone
import traceback

@app.task
def run_nlp_scoring():
    print("Starting NLP Scoring pipeline...")
    
    # 1. Create Scoring Log
    log_data = {
        "status": "running"
    }
    try:
        log_resp = supabase.table('scoring_logs').insert(log_data).execute()
        log_id = log_resp.data[0]['id']
    except Exception as e:
        print(f"Error creating scoring log: {e}")
        return

    try:
        # 2. Fetch unscored jobs
        print("Fetching unscored jobs...")
        jobs_resp = supabase.table('jobs').select('id, title, description, location, salary_min, salary_max').is_('nlp_extracted_at', 'null').limit(20).execute()
        jobs_to_score = jobs_resp.data
        
        if not jobs_to_score:
            print("No unscored jobs found.")
            supabase.table('scoring_logs').update({
                "status": "success",
                "finished_at": datetime.now(timezone.utc).isoformat(),
                "jobs_scored": 0
            }).eq("id", log_id).execute()
            return

        print(f"Found {len(jobs_to_score)} jobs to score.")
        
        jobs_scored_count = 0
        jobs_failed_count = 0
        total_tokens = 0
        
        # 3. Score each job and update
        for job in jobs_to_score:
            try:
                score_result = score_job(job['title'], job['description'], job.get('location', ''))
                
                # Update job
                update_data = {
                    "relevance_score": score_result["relevance_score"],
                    "relevance_tier": score_result["relevance_tier"],
                    "remote_policy": score_result["extracted_data"].get("remote_policy"),
                    "salary_min": score_result["extracted_data"].get("salary_min") or job.get("salary_min"),
                    "salary_max": score_result["extracted_data"].get("salary_max") or job.get("salary_max"),
                    "experience_years_min": score_result["extracted_data"].get("experience_years_min"),
                    "contract_type": score_result["extracted_data"].get("contract_type"),
                    "excel_level": score_result["extracted_data"].get("excel_level"),
                    "key_excel_skills": score_result["extracted_data"].get("key_excel_skills", []),
                    "sector": score_result["extracted_data"].get("sector"),
                    "nlp_extracted_at": datetime.now(timezone.utc).isoformat()
                }
                
                supabase.table('jobs').update(update_data).eq('id', job['id']).execute()
                
                jobs_scored_count += 1
                total_tokens += score_result["tokens_used"]
            except Exception as inner_e:
                print(f"Error scoring job {job['id']}: {inner_e}")
                traceback.print_exc()
                jobs_failed_count += 1

        # 4. Update Log
        estimated_cost = (total_tokens / 1_000_000) * 0.20 # Approximate blended cost
        
        supabase.table('scoring_logs').update({
            "status": "success",
            "finished_at": datetime.now(timezone.utc).isoformat(),
            "jobs_scored": jobs_scored_count,
            "jobs_failed": jobs_failed_count,
            "tokens_used": total_tokens,
            "estimated_cost_usd": estimated_cost
        }).eq("id", log_id).execute()

        print(f"NLP Scoring completed. Scored: {jobs_scored_count}, Failed: {jobs_failed_count}, Tokens: {total_tokens}")

    except Exception as e:
        error_msg = str(e)
        print(f"NLP scoring pipeline failed: {error_msg}")
        traceback.print_exc()
        
        supabase.table('scoring_logs').update({
            "status": "failed",
            "finished_at": datetime.now(timezone.utc).isoformat(),
            "error_message": error_msg
        }).eq("id", log_id).execute()
