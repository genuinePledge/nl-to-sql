import os

from langchain_community.utilities import SQLDatabase

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://user:password@localhost:5432/mydatabase"
)

db = SQLDatabase.from_uri(DATABASE_URL)
