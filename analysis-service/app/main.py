from fastapi import FastAPI
from app.api import analyze
import os

app = FastAPI(title="ProofHire Analysis Service")

app.include_router(analyze.router, prefix="/api")

@app.get("/health")
def health_check():
    return {"status": "ok"}
