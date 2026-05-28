"""
Abstract base class for all OSINT data extractors.

Each extractor targets a specific data source (Medium blogs, GitHub repos,
Google Sheets, etc.) and outputs raw records that the normalizer then maps
into one of the 4 JSON schemas (Interview, Compensation, PrepResource, OSINTTool).
"""

from abc import ABC, abstractmethod
from typing import Any


class BaseExtractor(ABC):
    """Base class that all source-specific extractors must inherit from."""

    # Subclasses MUST override these
    source_type: str = "Unknown"
    description: str = ""

    @abstractmethod
    def extract(self) -> list[dict[str, Any]]:
        """
        Fetch raw data from the source.

        Returns a list of raw dictionaries, each representing one logical
        document (e.g., one interview experience, one compensation entry).
        The structure of these dicts is source-specific and will be
        normalized by the `transform` method.
        """
        ...

    @abstractmethod
    def transform(self, raw_records: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """
        Normalize raw extracted records into schema-compliant JSON payloads.

        Each returned dict must have at minimum:
          - document_id: str
          - metadata: dict
          - schema_type: str  (one of 'interview', 'compensation', 'prep_resource', 'osint_tool')
          - payload: dict     (the full schema-specific payload)

        Returns a list of normalized documents ready for the loader.
        """
        ...

    def run(self) -> list[dict[str, Any]]:
        """
        Execute the full extract-transform pipeline for this source.
        """
        print(f"\n{'='*60}")
        print(f"  Extractor: {self.__class__.__name__}")
        print(f"  Source:    {self.source_type}")
        print(f"  {self.description}")
        print(f"{'='*60}")

        print("  [1/2] Extracting raw data...")
        raw = self.extract()
        print(f"        -> {len(raw)} raw records extracted.")

        print("  [2/2] Transforming to normalized schema...")
        normalized = self.transform(raw)
        print(f"        -> {len(normalized)} documents normalized.")

        return normalized
