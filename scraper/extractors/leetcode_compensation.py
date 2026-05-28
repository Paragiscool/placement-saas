import httpx
from bs4 import BeautifulSoup
from typing import Any
from datetime import datetime, timezone
from .base import BaseExtractor

class LeetCodeCompensationExtractor(BaseExtractor):
    source_type = "Professional_Forum"
    description = "Extracts compensation data from LeetCode discuss threads."

    def extract(self) -> list[dict[str, Any]]:
        # This would normally scrape LeetCode discuss compensation section.
        # For demonstration, returning a mocked extracted thread.
        raw_records = []
        
        raw_records.append({
            "url": "https://leetcode.com/discuss/compensation/4653762/Google-or-SWE-L4-or-Bengaluru",
            "company": "Google",
            "role": "SWE L4",
            "location": "Bengaluru",
            "base_salary": 3800000,
            "bonus": 570000,
            "rsu": 95000,
            "academic_year": "2023-2024"
        })
        
        return raw_records

    def transform(self, raw_records: list[dict[str, Any]]) -> list[dict[str, Any]]:
        normalized = []
        for i, record in enumerate(raw_records):
            
            payload = {
                "specific_compensation_data": {
                    "company_name": record.get("company", "Unknown"),
                    "role_title": record.get("role", "Unknown"),
                    "location": record.get("location"),
                    "financial_breakdown_inr": {
                        "base_salary_annual": record.get("base_salary"),
                        "target_performance_bonus": record.get("bonus")
                    },
                    "equity_breakdown": {
                        "rsu_grant_usd": record.get("rsu")
                    }
                }
            }
            
            normalized.append({
                "document_id": f"doc_stats_compensation_{record.get('company', 'unknown').lower()}_{i+1:03d}",
                "schema_type": "compensation",
                "metadata": {
                    "source_type": self.source_type,
                    "source_url": record.get("url"),
                    "extraction_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                    "academic_year": record.get("academic_year"),
                    "confidence_score": 0.85
                },
                **payload
            })
            
        return normalized
