import os
import math
import json
from typing import Dict, Any, List, Optional, Tuple
from pydantic import BaseModel
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# Initialize Gemini Client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

REFERENCE_TEXT = """
Expert Excel requis : VBA, macros, Power Query, Power Pivot,
tableaux croisés dynamiques, modélisation financière, reporting
automatisé, dashboards interactifs, formules avancées.
"""

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

def calculate_keyword_score(title: str, description: str) -> int:
    score = 0
    title_lower = str(title).lower() if title else ""
    desc_lower = str(description).lower() if description else ""
    
    if "excel" in title_lower:
        score += 20
    if "excel" in desc_lower:
        score += 10
    if "vba" in desc_lower or "macros" in desc_lower or "macro" in desc_lower:
        score += 15
    if "power query" in desc_lower or "power pivot" in desc_lower:
        score += 12
    if "tableau croisé dynamique" in desc_lower or "tcd" in desc_lower or "tableaux croisés dynamiques" in desc_lower:
        score += 10
    if "modélisation financière" in desc_lower or "modelisation financiere" in desc_lower:
        score += 10
    if "financial modeling" in desc_lower:
        score += 10
    if "reporting automation" in desc_lower or "automatisation" in desc_lower:
        score += 8
    if "dashboard" in desc_lower:
        score += 8
    if "contrôle de gestion" in desc_lower or "controle de gestion" in desc_lower:
        score += 5
    if "consolidation" in desc_lower:
        score += 5
    if "budget" in desc_lower or "prévisionnel" in desc_lower:
        score += 4
        
    return min(score, 50)

def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    norm_a = math.sqrt(sum(a * a for a in vec1))
    norm_b = math.sqrt(sum(b * b for b in vec2))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)

def get_embedding(text: str) -> List[float]:
    # Using Gemini embedding model
    result = client.models.embed_content(
        model="gemini-embedding-2",
        contents=text
    )
    return result.embeddings[0].values

# Cache the reference embedding
_REFERENCE_EMBEDDING = None

def calculate_semantic_score(description: str) -> int:
    global _REFERENCE_EMBEDDING
    if not description:
        return 0
        
    try:
        if _REFERENCE_EMBEDDING is None:
            _REFERENCE_EMBEDDING = get_embedding(REFERENCE_TEXT)
            
        job_embedding = get_embedding(description)
        similarity = cosine_similarity(job_embedding, _REFERENCE_EMBEDDING)
        
        if similarity > 0.85:
            return 30
        elif similarity >= 0.70:
            return 20
        elif similarity >= 0.55:
            return 10
    except Exception as e:
        print(f"Embedding error: {e}")
        
    return 0

def extract_structured_data(description: str) -> ExtractedJobData:
    if not description:
        description = "No description provided."

    prompt = f"""
    Tu es un expert en analyse d'offres d'emploi. Analyse l'offre suivante et extrais les informations demandées au format JSON.
    
    Description de l'offre :
    {description}
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type='application/json',
                response_schema=ExtractedJobData
            )
        )
        
        # In newer SDK, parsed response can be accessed directly or via text
        data = response.parsed if hasattr(response, 'parsed') else json.loads(response.text)
        if isinstance(data, dict):
            return ExtractedJobData(**data)
        return data
    except Exception as e:
        print(f"Extraction error: {e}")
        # Fallback to default empty data
        return ExtractedJobData(
            remote_policy="not_specified",
            salary_min=None,
            salary_max=None,
            experience_years_min=None,
            contract_type="not_specified",
            excel_level="not_specified",
            key_excel_skills=[],
            is_hidden_excel=False,
            sector="other"
        )

def calculate_context_bonus(title: str, description: str, extracted_data: ExtractedJobData) -> int:
    score = 0
    title_lower = str(title).lower() if title else ""
    desc_lower = str(description).lower() if description else ""
    
    if "excel" in title_lower:
        score += 10
        
    sector = str(extracted_data.sector).lower()
    if sector in ["finance", "audit", "banque", "financial"]:
        score += 5
        
    excel_level = str(extracted_data.excel_level).lower()
    if excel_level in ["advanced", "expert"] or "senior" in title_lower or "expert" in title_lower:
        score += 3
        
    if "formation" in desc_lower and "excel" in desc_lower:
        score += 5
        
    if "mos" in desc_lower or "microsoft office specialist" in desc_lower:
        score += 7
        
    return min(score, 20)

def determine_tier(score: int) -> str:
    if score >= 70:
        return "HIGH"
    elif score >= 40:
        return "MEDIUM"
    elif score >= 10:
        return "LOW"
    else:
        return "SKIP"

def score_job(title: str, description: str) -> Dict[str, Any]:
    # 1. Keyword Score
    kw_score = calculate_keyword_score(title, description)
    
    # 2. Semantic Score
    semantic_score = calculate_semantic_score(description)
    
    # 3. Structured Extraction
    extracted_data = extract_structured_data(description)
    
    # 4. Context Bonus
    bonus_score = calculate_context_bonus(title, description, extracted_data)
    
    # Final Score
    final_score = kw_score + semantic_score + bonus_score
    tier = determine_tier(final_score)
    
    return {
        "relevance_score": final_score,
        "relevance_tier": tier,
        "extracted_data": extracted_data.model_dump(),
        "tokens_used": 0
    }
