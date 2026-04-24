import os

from langchain_gigachat import GigaChat
from langchain_ollama import ChatOllama

LLM_URL = os.getenv("LLM_URL", "http://localhost:8000/v1/chat/completions")
GIGA_CHAT_CREDENTIALS = os.getenv("GIGACHAT_API_KEY", None)
OLLAMA_CLOUD = os.getenv("OLLAMA_CLOUD", "gemma4:31b-cloud")

giga_llm = GigaChat(
    credentials=GIGA_CHAT_CREDENTIALS,
    model="GigaChat",
    ca_bundle_file="russian_trusted_root_ca_pem.crt",
    temperature=0,
)

ollama = ChatOllama(model=OLLAMA_CLOUD, base_url=LLM_URL)
