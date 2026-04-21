import os

import requests
from fastapi import FastAPI

app = FastAPI()

LLM_URL = os.getenv("LLM_URL", "http://localhost:8000/v1/chat/completions")


def generate(prompt: str) -> str:
    response = requests.post(
        LLM_URL,
        json={
            "model": "gemma4",
            "messages": [{"role": "user", "content": prompt}],
            "stream": False,
        },
    )
    data = response.json()
    return data["message"]["content"]


@app.get("/")
async def root():
    return {"message": generate("Tell me what can you do?")}


@app.get("/health")
async def health():
    return {"status": "healthy"}
