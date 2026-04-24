from internal.domain.model import DISALLOWED_DML_STATEMENTS
from internal.domain.semantic_layer import SemanticLayer
from internal.infrastructure.db.pool import db
from internal.infrastructure.llm.services import ollama
from langchain.agents import create_agent
from langchain_community.agent_toolkits import SQLDatabaseToolkit
from langgraph.types import StreamMode

semantic_layer = SemanticLayer("/src/internal/domain/semantics.json")
semantic_layer.load()
semantic_context = semantic_layer.to_agent_context()

SYSTEM_PROMPT = """
You are an agent designed to interact with a SQL database using a semantic layer.
Given an input question, create a syntactically correct {dialect} query to run,
then look at the results of the query and return the answer. Unless the user
specifies a specific number of examples they wish to obtain, always limit your
query to at most {top_k} results.

You can order the results by a relevant column to return the most interesting
examples in the database. Never query for all the columns from a specific table,
only ask for the relevant columns given the question.

You MUST double check your query before executing it. If you get an error while
executing a query, rewrite the query and try again.

DO NOT make any DML statements: {statements} to the
database.

DO NOT query the schema because they are already provided below.

The semantic layer provides business-friendly definitions for tables, metrics, and dimensions:

### Tables
{tables}

### Metrics
{metrics}

### Dimensions
{dimensions}

### Notes
{notes}

Use the semantic layer context to understand the business meaning behind tables and columns.
Map business terms (e.g., "заказы", "заказы") to their canonical names and SQL fields.
Always use the canonical names in your queries unless the user explicitly asks for something else.
Strictly use russian language when communicating with the user, but remember that the SQL queries
should be in English and use the canonical names from the semantic layer.

Also give your interpretation of the question and your reasoning steps in the thought process. Always use the following format:
Думаю: your thought process and reasoning steps to arrive at the final answer
SQL запрос: the SQL query you will run to get the answer
Answer: the final answer to the question based on the query results

And lastly ALWAYS output the executed SQL query for transparency, so the user can see what you are doing.
""".format(
    dialect=db.dialect,
    top_k=5,
    statements=", ".join(DISALLOWED_DML_STATEMENTS),
    tables="\n".join(
        [f"- {t['name']}: {t['description']}" for t in semantic_context["tables"]]
    ),
    metrics="\n".join(
        [
            f"- {m['business_name']} ({m['canonical_name']}): {m.get('synonyms', [])} - {m['sql_mapping']}"
            for m in semantic_context["metrics"]
        ]
    ),
    dimensions="\n".join(
        [
            f"- {d['business_name']} ({d['canonical_name']}): {d.get('synonyms', [])} - {d['sql_mapping']}"
            for d in semantic_context["dimensions"]
        ]
    ),
    notes="\n".join(semantic_context["notes"]),
)


toolkit = SQLDatabaseToolkit(db=db, llm=ollama)
tools = toolkit.get_tools()

agent = create_agent(ollama, tools, system_prompt=SYSTEM_PROMPT)


def invoke_agent(messages, stream_mode: StreamMode = "values") -> dict:
    """Invoke the agent with the given messages and stream mode."""
    print("Invoking agent with system message:", SYSTEM_PROMPT)
    return agent.invoke(messages, stream_mode=stream_mode)
