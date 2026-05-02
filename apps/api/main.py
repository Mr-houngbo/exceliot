from fastapi import FastAPI
from routers import jobs, health

app = FastAPI(title="Exceliot API", version="0.1.0")

app.include_router(health.router)
app.include_router(jobs.router, prefix="/api/v1")

@app.get("/")
def root():
    return {"status": "Exceliot is alive 🟢"}
