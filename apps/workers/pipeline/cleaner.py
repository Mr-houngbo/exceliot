import re
import html
from typing import Dict, Any

def clean_html(text: str) -> str:
    """Remove HTML tags and unescape entities."""
    if not text:
        return ""
    text = html.unescape(text)
    clean_text = re.sub(r'<[^>]+>', '', text)
    return clean_text.strip()

def format_salary_raw(min_s: float, max_s: float) -> str:
    """Format a raw salary string based on min and max."""
    if min_s and max_s:
        return f"{int(min_s)} - {int(max_s)}"
    elif min_s:
        return f"A partir de {int(min_s)}"
    elif max_s:
        return f"Jusqu'à {int(max_s)}"
    return ""

def clean_adzuna_job(raw_job: Dict[str, Any], source_id: str) -> Dict[str, Any]:
    """
    Maps an Adzuna job dictionary to the Supabase `jobs` table schema.
    """
    salary_min = raw_job.get("salary_min")
    salary_max = raw_job.get("salary_max")
    
    return {
        "external_id": str(raw_job.get("id")),
        "source_id": source_id,
        "url": raw_job.get("redirect_url"),
        "title": clean_html(raw_job.get("title", "")),
        "company": raw_job.get("company", {}).get("display_name", ""),
        "location": raw_job.get("location", {}).get("display_name", ""),
        "description": clean_html(raw_job.get("description", "")),
        "salary_raw": format_salary_raw(salary_min, salary_max),
        "salary_min": int(salary_min) if salary_min else None,
        "salary_max": int(salary_max) if salary_max else None,
        "contract_type": raw_job.get("contract_type", ""),
        "raw_data": raw_job,
    }
