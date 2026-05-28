import pandas as pd
from typing import Any
from datetime import datetime, timezone
from .base import BaseExtractor

class GoogleSheetsExtractor(BaseExtractor):
    source_type = "RTI_Sheet"
    description = "Extracts RTI placement statistics from crowd-sourced Google Sheets."

    def extract(self) -> list[dict[str, Any]]:
        # Using a publicly accessible mock Google Sheet CSV export link for demonstration.
        # Format: https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv
        # As an example, we just return a mocked raw record.
        
        raw_records = []
        raw_records.append({
            "url": "https://docs.google.com/spreadsheets/d/1sO_3yy-GFCZEIJhFVaRky6G3eOmxKbaLCECSCQFfbd4/edit?usp=drivesdk",
            "academic_year": "2021-2022",
            "total_offers": 1723,
            "highest_ctc": 24000000,
            "trends": [
                "Dual Degree candidates favored",
                "Migration to non-core"
            ]
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
                    "structural_trends": record.get("trends", [])
                }
            }
            
            normalized.append({
                "document_id": f"doc_stats_macro_{record.get('academic_year', 'unknown').replace('-', '_')}_{i+1:03d}",
                "schema_type": "compensation",
                "metadata": {
                    "source_type": self.source_type,
                    "source_url": record.get("url"),
                    "extraction_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                    "academic_year": record.get("academic_year"),
                    "confidence_score": 0.8
                },
                **payload
            })
            
        return normalized
