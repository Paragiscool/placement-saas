import httpx
from bs4 import BeautifulSoup
from typing import Any
from datetime import datetime, timezone
from .base import BaseExtractor

class CampusPublicationsExtractor(BaseExtractor):
    source_type = "Campus_Publication"
    description = "Extracts placement analysis from Awaaz IIT KGP and Scholars' Avenue."

    def extract(self) -> list[dict[str, Any]]:
        # Mocked extraction from campus publication
        raw_records = []
        
        raw_records.append({
            "url": "https://www.awaaziitkgp.in/intern-placement/placement-analysis-2021-2022",
            "academic_year": "2021-2022",
            "total_offers": 1723,
            "highest_ctc": 24000000,
            "top_recruiters": ["Honeywell", "Microsoft", "Google"]
        })
        
        return raw_records

    def transform(self, raw_records: list[dict[str, Any]]) -> list[dict[str, Any]]:
        normalized = []
        for i, record in enumerate(raw_records):
            
            payload = {
                "macro_placement_context": {
                    "institute": "IIT Kharagpur",
                    "total_institutional_offers": record.get("total_offers"),
                    "highest_institutional_ctc_inr": record.get("highest_ctc"),
                    "top_volume_recruiters": record.get("top_recruiters", [])
                }
            }
            
            normalized.append({
                "document_id": f"doc_stats_macro_{record.get('academic_year', 'unknown').replace('-', '_')}_pub_{i+1:03d}",
                "schema_type": "compensation",
                "metadata": {
                    "source_type": self.source_type,
                    "source_url": record.get("url"),
                    "extraction_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                    "academic_year": record.get("academic_year"),
                    "confidence_score": 0.9
                },
                **payload
            })
            
        return normalized
