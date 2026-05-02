import os
import math
import re
from typing import Dict, Any, List, Optional, Tuple
from pydantic import BaseModel
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# Initialize Gemini Client (Optional fallback)
GEMINI_AVAILABLE = False
try:
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key and not api_key.startswith("AIzaSyB6oFi"): # Basic check if it's potentially valid
        client = genai.Client(api_key=api_key)
        GEMINI_AVAILABLE = True
except Exception:
    GEMINI_AVAILABLE = False

class ExtractedJobData(BaseModel):
    remote_policy: str  # full_remote | hybrid | on_site | not_specified
    salary_min: Optional[int]
    salary_max: Optional[int]
    experience_years_min: Optional[int]
    contract_type: str  # CDI | CDD | freelance | stage | alternance | not_specified
    excel_level: str  # beginner | intermediate | advanced | expert | not_specified
    key_excel_skills: List[str]
    is_hidden_excel: bool
    sector: str  # finance | audit | rh | marketing | logistique | other

def local_nlp_extraction(title: str, description: str) -> ExtractedJobData:
    """
    Performs basic NLP extraction using regex and keyword matching.
    Totally free and local.
    """
    text = (str(title) + " " + str(description)).lower()
    
    # 1. Remote Policy
    remote = "on_site"
    if any(word in text for word in ["télétravail total", "full remote", "100% remote", "télétravail complet"]):
        remote = "full_remote"
    elif any(word in text for word in ["télétravail", "remote", "hybride", "jours de présentiel"]):
        remote = "hybrid"
        
    # 2. Contract Type
    contract = "not_specified"
    if "cdi" in text: contract = "CDI"
    elif "cdd" in text: contract = "CDD"
    elif any(word in text for word in ["freelance", "indépendant", "auto-entrepreneur"]): contract = "freelance"
    elif "stage" in text: contract = "stage"
    elif any(word in text for word in ["alternance", "apprentissage", "contrat pro"]): contract = "alternance"
    
    # 3. Excel Level
    level = "not_specified"
    if any(word in text for word in ["expert", "maîtrise parfaite", "guru", "ninja"]): level = "expert"
    elif any(word in text for word in ["avancé", "advanced", "confirmé", "approfondi"]): level = "advanced"
    elif any(word in text for word in ["intermédiaire", "intermediate", "maîtrise"]): level = "intermediate"
    elif "débutant" in text: level = "beginner"
    
    # 4. Sector
    sector = "other"
    if any(word in text for word in ["finance", "comptabilité", "bancaire", "trésorerie", "audit"]): sector = "finance"
    elif any(word in text for word in ["rh", "ressources humaines", "recrutement"]): sector = "rh"
    elif any(word in text for word in ["marketing", "communication", "digital"]): sector = "marketing"
    elif any(word in text for word in ["logistique", "supply chain", "achat"]): sector = "logistique"
    
    # 5. Skills
    skills = []
    if "vba" in text: skills.append("VBA")
    if "macro" in text: skills.append("Macros")
    if "power query" in text: skills.append("Power Query")
    if "power pivot" in text: skills.append("Power Pivot")
    if any(word in text for word in ["tcd", "tableau croisé", "pivot table"]): skills.append("TCD")
    if "looker" in text: skills.append("Looker")
    
    return ExtractedJobData(
        remote_policy=remote,
        salary_min=None, # Hard to extract via regex accurately
        salary_max=None,
        experience_years_min=None,
        contract_type=contract,
        excel_level=level,
        key_excel_skills=skills,
        is_hidden_excel="excel" not in text and any(s in text for s in ["vba", "power query", "modélisation"]),
        sector=sector
    )

def calculate_keyword_score(title: str, description: str) -> int:
    score = 0
    title_lower = str(title).lower() if title else ""
    desc_lower = str(description).lower() if description else ""
    
    # Titre (Max importance)
    if "excel" in title_lower: score += 20
    
    # Description
    if "excel" in desc_lower: score += 10
    if "vba" in desc_lower or "macros" in desc_lower: score += 15
    if "power query" in desc_lower or "power pivot" in desc_lower: score += 12
    if any(word in desc_lower for word in ["tableau croisé dynamique", "tcd"]): score += 10
    if any(word in desc_lower for word in ["modélisation financière", "financial modeling"]): score += 10
    if any(word in desc_lower for word in ["reporting automation", "automatisation"]): score += 8
    if "dashboard" in desc_lower: score += 8
    if any(word in desc_lower for word in ["contrôle de gestion", "comptabilité"]): score += 5
    
    return min(score, 50)

def score_job(title: str, description: str) -> Dict[str, Any]:
    """
    Calculates score and extracts data. 
    Uses Local NLP by default, can use Gemini if quota allows.
    """
    # 1. Local Extraction (Free & Fast)
    extracted_data = local_nlp_extraction(title, description)
    
    # 2. Local Keyword Score
    kw_score = calculate_keyword_score(title, description)
    
    # 3. Context Bonus (Local)
    bonus_score = 0
    if "excel" in str(title).lower(): bonus_score += 10
    if extracted_data.sector == "finance": bonus_score += 5
    if extracted_data.excel_level in ["advanced", "expert"]: bonus_score += 3
    if "mos" in str(description).lower(): bonus_score += 7
    
    # 4. Semantic Score (Mocked if AI fails)
    # Since we can't reliably use embeddings for free without quota issues, 
    # we simulate the semantic score by looking for "Expert" signals.
    semantic_score = 0
    if extracted_data.excel_level == "expert": semantic_score = 25
    elif extracted_data.excel_level == "advanced": semantic_score = 15
    
    final_score = kw_score + semantic_score + bonus_score
    
    # Tier determination
    tier = "SKIP"
    if final_score >= 70: tier = "HIGH"
    elif final_score >= 40: tier = "MEDIUM"
    elif final_score >= 10: tier = "LOW"
    
    return {
        "relevance_score": final_score,
        "relevance_tier": tier,
        "extracted_data": extracted_data.model_dump(),
        "tokens_used": 0
    }
