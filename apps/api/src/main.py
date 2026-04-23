import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langchain.agents import create_agent
from langchain_community.agent_toolkits import SQLDatabaseToolkit
from langchain_community.utilities import SQLDatabase
from langchain_gigachat import GigaChat
from langchain_ollama import ChatOllama
from pydantic import BaseModel


class PromptRequest(BaseModel):
    prompt: str


app = FastAPI()

origins = [
    "http://localhost.tiangolo.com",
    "https://localhost.tiangolo.com",
    "http://localhost",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

LLM_URL = os.getenv("LLM_URL", "http://localhost:8000/v1/chat/completions")
GIGA_CHAT_CREDENTIALS = os.getenv("GIGACHAT_API_KEY", None)

db = SQLDatabase.from_uri("postgresql+psycopg2://postgres:postgres@db:5432/analytics")

SYSTEM_PROMPT = """
You are an agent designed to interact with a SQL database.
Given an input question, create a syntactically correct {dialect} query to run,
then look at the results of the query and return the answer. Unless the user
specifies a specific number of examples they wish to obtain, always limit your
query to at most {top_k} results.

You can order the results by a relevant column to return the most interesting
examples in the database. Never query for all the columns from a specific table,
only ask for the relevant columns given the question.

You MUST double check your query before executing it. If you get an error while
executing a query, rewrite the query and try again.

DO NOT make any DML statements (INSERT, UPDATE, DELETE, DROP etc.) to the
database.

To start you should ALWAYS look at the tables in the database to see what you
can query. Do NOT skip this step.

Then you should query the schema of the most relevant tables.

Also give your interpretation of the question and your reasoning steps in the thought process. Always use the following format:
Question: the input question you are trying to answer
Thought: your thought process and reasoning steps to arrive at the final answer
Query: the SQL query you will run to get the answer
Answer: the final answer to the question based on the query results

And lastly ALWAYS output the executed SQL query for transparency, so the user can see what you are doing.
""".format(
    dialect=db.dialect,
    top_k=5,
)

giga_llm = GigaChat(
    credentials=GIGA_CHAT_CREDENTIALS,
    model="GigaChat",
    ca_bundle_file="russian_trusted_root_ca_pem.crt",
)

ollama = ChatOllama(model="qwen3.5:397b-cloud", base_url=LLM_URL)

toolkit = SQLDatabaseToolkit(db=db, llm=ollama)
tools = toolkit.get_tools()

agent = create_agent(ollama, tools, system_prompt=SYSTEM_PROMPT)


@app.post("/generate")
async def generate(request: PromptRequest) -> dict:
    return agent.invoke(
        {"messages": [{"role": "user", "content": request.prompt}]},
        stream_mode="values",
    )


@app.get("/health")
async def health():
    return {"status": "healthy"}
