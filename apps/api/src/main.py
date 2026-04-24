from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from internal.domain.model import Prompt
from internal.usecase.agent import invoke_agent

app = FastAPI()

allowed_origins = [
    "http://localhost",
    "https://localhost",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/generate")
async def generate(prompt: Prompt) -> dict:
    return invoke_agent(
        {"messages": [{"role": "user", "content": prompt.prompt}]},
        stream_mode="values",
    )


@app.get("/health")
async def health():
    return {"status": "healthy"}
