import httpx
from typing import Any
from datetime import datetime, timezone
from .base import BaseExtractor

class GithubReposExtractor(BaseExtractor):
    source_type = "Open_Source_Repository"
    description = "Extracts repo metadata from MetaKGP and KDAG GitHub orgs."
    
    # GitHub API rate limit for unauthenticated requests is 60/hr
    API_BASE = "https://api.github.com/repos"

    def extract(self) -> list[dict[str, Any]]:
        repos_to_extract = [
            "metakgp/mftp",
            "XylenSky/notify-magnet",
            "metakgp/Dynac"
        ]
        
        raw_records = []
        with httpx.Client() as client:
            for repo in repos_to_extract:
                try:
                    resp = client.get(f"{self.API_BASE}/{repo}", timeout=10.0)
                    if resp.status_code == 200:
                        data = resp.json()
                        raw_records.append({
                            "repo_name": data.get("name"),
                            "full_name": data.get("full_name"),
                            "description": data.get("description"),
                            "url": data.get("html_url"),
                            "language": data.get("language"),
                            "topics": data.get("topics", []),
                            "extraction_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                        })
                except Exception as e:
                    print(f"Error fetching {repo}: {e}")
                    
        return raw_records

    def transform(self, raw_records: list[dict[str, Any]]) -> list[dict[str, Any]]:
        normalized = []
        for i, record in enumerate(raw_records):
            
            payload = {
                "tool_architecture": {
                    "tool_name": record.get("repo_name", "Unknown"),
                    "primary_function": record.get("description", "Unknown"),
                    "technology_stack": [record.get("language")] if record.get("language") else [] + record.get("topics", []),
                    "deployment_methodology": "Unknown",
                    "notification_channels": [],
                    "sub_modules": [],
                    "compliance_and_risk_warnings": []
                }
            }
            
            normalized.append({
                "document_id": f"doc_osint_tool_{record.get('repo_name', 'unknown').lower()}_{i+1:03d}",
                "schema_type": "osint_tool",
                "metadata": {
                    "source_type": self.source_type,
                    "source_url": record.get("url"),
                    "extraction_date": record.get("extraction_date"),
                    "managing_entity": record.get("full_name", "").split("/")[0],
                    "confidence_score": 0.85
                },
                **payload
            })
            
        return normalized
