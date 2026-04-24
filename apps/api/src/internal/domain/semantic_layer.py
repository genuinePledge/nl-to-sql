import json
from pathlib import Path
from typing import Any, Dict, List, Optional


class SemanticLayer:
    def __init__(self, filename: str):
        self.filename = filename
        self._data: Optional[Dict[str, Any]] = None

    def load(self) -> Dict[str, Any] | None:
        filepath = Path(self.filename)
        if not filepath.exists():
            raise FileNotFoundError(f"Semantic layer file not found: {self.filename}")

        with open(filepath, "r", encoding="utf-8") as f:
            self._data = json.load(f)

        return self._data

    def get_tables(self) -> List[Dict[str, Any]]:
        return self._data.get("tables", []) if self._data else []

    def get_metrics(self) -> List[Dict[str, Any]]:
        return self._data.get("metrics", []) if self._data else []

    def get_dimensions(self) -> List[Dict[str, Any]]:
        return self._data.get("dimensions", []) if self._data else []

    def get_joins(self) -> List[Dict[str, Any]]:
        return self._data.get("joins", []) if self._data else []

    def get_notes(self) -> List[str]:
        return self._data.get("notes", []) if self._data else []

    def to_agent_context(self) -> Dict[str, Any]:
        return {
            "tables": self.get_tables(),
            "metrics": self.get_metrics(),
            "dimensions": self.get_dimensions(),
            "joins": self.get_joins(),
            "notes": self.get_notes(),
        }
