from pydantic import BaseModel


class Prompt(BaseModel):
    prompt: str


DISALLOWED_DML_STATEMENTS = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE"]
