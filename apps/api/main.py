from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import jobs, health

app = FastAPI(title="Exceliot API", version="0.1.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(jobs.router, prefix="/api/v1")

@app.get("/")
def root():
    return {"status": "Exceliot is alive 🟢"}
