import httpx
from bs4 import BeautifulSoup
import re
from typing import Any
from datetime import datetime, timezone
from .base import BaseExtractor

class MediumCodeClubExtractor(BaseExtractor):
    source_type = "Campus_Publication_Blog"
    description = "Extracts interview experiences from CodeClub Medium and SWG Foresight."

    def extract(self) -> list[dict[str, Any]]:
        # In a real scenario, this would scrape actual Medium URLs.
        # Medium often has anti-bot protections, so using an API or headless browser is better.
        # For demonstration, we'll simulate the extraction of a recent blog post 
        # using httpx for a known accessible page or returning parsed mock content if blocked.
        
        raw_records = []
        
        # Simulating extraction of a post
        raw_records.append({
            "url": "https://codeclub-iitkgp.medium.com/mock-post",
            "title": "Interview Experience at MockTech for SDE Intern",
            "content": "The OA was 90 minutes long with 3 questions. Round 1 focused on DP...",
            "company": "MockTech",
            "role": "SDE Intern",
            "extraction_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "academic_year": "2024"
        })
        
        return raw_records

    def transform(self, raw_records: list[dict[str, Any]]) -> list[dict[str, Any]]:
        normalized = []
        for i, record in enumerate(raw_records):
            # In a full implementation, you would use an LLM here to parse unstructured text 
            # into the exact schema structure (entity, assessment_pipeline, etc.)
            
            # Simulated LLM transformation outcome:
            payload = {
                "entity": {
                    "company_name": record.get("company", "Unknown"),
                    "role_title": record.get("role", "Unknown"),
                    "target_departments": [],
                },
                "assessment_pipeline": {
                    "online_assessment": {
                        "duration_minutes": 90,
                        "total_questions": 3,
                        "core_topics_tested": ["DP"],
                    },
                    "technical_rounds": [
                        {
                            "round_sequence": 1,
                            "primary_focus": "DP",
                            "specific_queries": []
                        }
                    ]
                }
            }
            
            normalized.append({
                "document_id": f"doc_interview_{record.get('company', 'unknown').lower()}_sde_{i+1:03d}",
                "schema_type": "interview",
                "metadata": {
                    "source_type": self.source_type,
                    "source_url": record.get("url"),
                    "extraction_date": record.get("extraction_date"),
                    "academic_year": record.get("academic_year"),
                    "confidence_score": 0.7
                },
                **payload
            })
            
        return normalized
