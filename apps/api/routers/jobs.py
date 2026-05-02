from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from db.supabase_client import supabase

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.get("/")
def list_jobs(
    tier: Optional[str] = Query(None, description="Filter by relevance tier (HIGH, MEDIUM, LOW)"),
    sector: Optional[str] = Query(None, description="Filter by sector"),
    remote: Optional[str] = Query(None, description="Filter by remote policy"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    try:
        query = supabase.table("jobs").select("*").order("relevance_score", desc=True)
        
        if tier:
            query = query.eq("relevance_tier", tier)
        else:
            # By default, only show scored jobs that are at least LOW
            query = query.in_("relevance_tier", ["HIGH", "MEDIUM", "LOW"])
            
        if sector:
            query = query.eq("sector", sector)
        if remote:
            query = query.eq("remote_policy", remote)
            
        # Pagination
        query = query.range(offset, offset + limit - 1)
        
        response = query.execute()
        return {"jobs": response.data, "count": len(response.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{job_id}")
def get_job(job_id: str):
    try:
        response = supabase.table("jobs").select("*").eq("id", job_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Job not found")
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
