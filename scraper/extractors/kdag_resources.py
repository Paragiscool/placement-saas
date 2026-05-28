import httpx
from bs4 import BeautifulSoup
from typing import Any
from datetime import datetime, timezone
from .base import BaseExtractor

class KDAGResourcesExtractor(BaseExtractor):
    source_type = "Student_Society_Repository"
    description = "Extracts preparation resources from KDAG."

    def extract(self) -> list[dict[str, Any]]:
        # Mocked extraction from KDAG resources page
        raw_records = []
        
        raw_records.append({
            "url": "https://kdagiitkgp.com/resources",
            "title": "CDC 101: Think Tank",
            "description": "Compendium comprising over 200 logic puzzles and 120 advanced probability problems.",
            "target_disciplines": ["Quantitative Finance", "Data Science"],
            "logic_puzzles": 200,
            "probability_problems": 120
        })
        
        return raw_records

    def transform(self, raw_records: list[dict[str, Any]]) -> list[dict[str, Any]]:
        normalized = []
        for i, record in enumerate(raw_records):
            
            payload = {
                "resource_details": {
                    "resource_title": record.get("title", "Unknown"),
                    "description": record.get("description"),
                    "target_disciplines": record.get("target_disciplines", []),
                    "target_corporate_archetypes": [],
                    "curriculum_metrics": {
                        "total_logic_puzzles": record.get("logic_puzzles"),
                        "total_probability_problems": record.get("probability_problems")
                    },
                    "core_theoretical_topics": [],
                    "recommended_supplementary_literature": []
                }
            }
            
            normalized.append({
                "document_id": f"doc_resource_kdag_{i+1:03d}",
                "schema_type": "prep_resource",
                "metadata": {
                    "source_type": self.source_type,
                    "source_url": record.get("url"),
                    "extraction_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                    "managing_entity": "Kharagpur Data Analytics Group (KDAG)",
                    "confidence_score": 0.95
                },
                **payload
            })
            
        return normalized
