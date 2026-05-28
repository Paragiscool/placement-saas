"""
Schema Normalizer for the RAG Data Extraction Pipeline.

Defines Pydantic models for all 4 JSON schema types and provides
validation, ID generation, and deduplication logic.

Schema Types:
  A) interview    - Corporate interview intelligence payloads
  B) compensation - Macro-statistical and compensation data
  C) prep_resource - Technical preparation resources
  D) osint_tool   - Student-engineered OSINT infrastructure
"""

import re
import json
from typing import Optional, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Shared metadata model (used by all schemas)
# ---------------------------------------------------------------------------
class DocumentMetadata(BaseModel):
    source_type: str
    source_url: Optional[str] = None
    extraction_date: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    academic_year: Optional[str] = None
    confidence_score: float = 0.8
    data_validation_status: Optional[str] = None
    managing_entity: Optional[str] = None
    resource_type: Optional[str] = None
    license: Optional[str] = None


# ---------------------------------------------------------------------------
# Schema A: Interview Intelligence
# ---------------------------------------------------------------------------
class CompanyEntity(BaseModel):
    company_name: str
    role_title: str
    target_departments: list[str] = []
    hiring_volume: Optional[str] = None
    compensation_tier: Optional[str] = None


class OADetails(BaseModel):
    platform: Optional[str] = None
    duration_minutes: Optional[int] = None
    total_questions: Optional[int] = None
    core_topics_tested: list[str] = []
    difficulty_rating: Optional[str] = None
    notes: Optional[str] = None
    sections: Optional[list[dict[str, Any]]] = None


class TechRound(BaseModel):
    round_sequence: int
    round_type: Optional[str] = "Technical Interview"
    duration_minutes: Optional[int] = None
    primary_focus: Optional[str] = None
    specific_queries: list[str] = []
    environment: Optional[str] = None
    key_insight: Optional[str] = None


class HRRound(BaseModel):
    duration_minutes: Optional[int] = None
    primary_focus: Optional[str] = None
    specific_queries: list[str] = []


class AssessmentPipeline(BaseModel):
    online_assessment: Optional[OADetails] = None
    technical_rounds: list[TechRound] = []
    hr_round: Optional[HRRound] = None


class PrepStrategy(BaseModel):
    critical_topics: list[str] = []
    recommended_resources: list[str] = []
    estimated_prep_time_weeks: Optional[int] = None
    key_differentiator: Optional[str] = None
    fast_track_criteria: Optional[list[str]] = None
    also_applies_to: Optional[list[str]] = None
    dual_degree_advantage: Optional[str] = None


class InterviewIntelligencePayload(BaseModel):
    """Schema A: Full interview experience for a company + role."""
    entity: CompanyEntity
    assessment_pipeline: AssessmentPipeline
    preparation_strategy: Optional[PrepStrategy] = None


# ---------------------------------------------------------------------------
# Schema B: Compensation & Macro-Statistical
# ---------------------------------------------------------------------------
class MacroPlacementContext(BaseModel):
    institute: str = "IIT Kharagpur"
    institute_phase: Optional[str] = None
    phase_start_date: Optional[str] = None
    total_institutional_offers: Optional[int] = None
    includes_ppo: Optional[bool] = None
    highest_institutional_ctc_inr: Optional[int] = None
    record_breaking_note: Optional[str] = None
    top_volume_recruiters: list[str] = []
    structural_trends: list[str] = []
    sector_distribution: Optional[dict[str, str]] = None
    data_source_methodology: Optional[str] = None


class FinancialBreakdown(BaseModel):
    base_salary_annual: Optional[int] = None
    base_salary_monthly: Optional[int] = None
    target_performance_bonus: Optional[int] = None
    performance_bonus_percentage: Optional[int] = None
    signing_bonus_one_time: Optional[int] = None
    relocation_bonus_one_time: Optional[int] = None


class EquityBreakdown(BaseModel):
    rsu_grant_usd: Optional[int] = None
    vesting_schedule_years: Optional[int] = None
    vesting_pattern: Optional[str] = None


class CalculatedTotals(BaseModel):
    year_1_total_approx: Optional[int] = None
    year_2_total_approx: Optional[int] = None
    year_3_total_approx: Optional[int] = None
    year_4_total_approx: Optional[int] = None
    notes: Optional[str] = None


class SpecificCompensationData(BaseModel):
    company_name: str
    role_title: str
    location: Optional[str] = None
    candidate_background: Optional[str] = None
    offer_status: Optional[str] = None
    financial_breakdown_inr: Optional[FinancialBreakdown] = None
    equity_breakdown: Optional[EquityBreakdown] = None
    calculated_totals_inr: Optional[CalculatedTotals] = None
    key_insight: Optional[str] = None


class CompensationPayload(BaseModel):
    """Schema B: Compensation data and/or macro placement statistics."""
    macro_placement_context: Optional[MacroPlacementContext] = None
    specific_compensation_data: Optional[SpecificCompensationData] = None


# ---------------------------------------------------------------------------
# Schema C: Preparation Resources
# ---------------------------------------------------------------------------
class CurriculumMetrics(BaseModel):
    total_logic_puzzles: Optional[int] = None
    total_probability_problems: Optional[int] = None
    total_modules: Optional[int] = None
    estimated_completion_weeks: Optional[int] = None
    difficulty_range: Optional[str] = None
    difficulty_progression: Optional[str] = None


class AccessInfo(BaseModel):
    url: Optional[str] = None
    access_type: Optional[str] = None
    format: Optional[str] = None


class ResourceDetails(BaseModel):
    resource_title: str
    description: Optional[str] = None
    target_disciplines: list[str] = []
    target_corporate_archetypes: list[str] = []
    curriculum_metrics: Optional[CurriculumMetrics] = None
    core_theoretical_topics: list[str] = []
    practical_implementation_topics: Optional[list[str]] = None
    recommended_supplementary_literature: list[str] = []
    github_resources: Optional[dict[str, Any]] = None
    key_insight: Optional[str] = None
    access_information: Optional[AccessInfo] = None


class PrepResourcePayload(BaseModel):
    """Schema C: Technical preparation resource catalog."""
    resource_details: ResourceDetails


# ---------------------------------------------------------------------------
# Schema D: OSINT Tools
# ---------------------------------------------------------------------------
class SubModule(BaseModel):
    name: str
    function: str


class Dependency(BaseModel):
    name: str
    function: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None


class ToolArchitecture(BaseModel):
    tool_name: str
    primary_function: str
    description: Optional[str] = None
    technology_stack: list[str] = []
    deployment_methodology: Optional[str] = None
    notification_channels: list[str] = []
    operational_mechanics: Optional[dict[str, Any]] = None
    sub_modules: list[SubModule] = []
    dependencies: Optional[list[Dependency]] = None
    compliance_and_risk_warnings: list[str] = []


class OSINTToolPayload(BaseModel):
    """Schema D: Student-engineered OSINT infrastructure documentation."""
    tool_architecture: ToolArchitecture


# ---------------------------------------------------------------------------
# Schema type registry
# ---------------------------------------------------------------------------
SCHEMA_MAP = {
    "interview": InterviewIntelligencePayload,
    "compensation": CompensationPayload,
    "prep_resource": PrepResourcePayload,
    "osint_tool": OSINTToolPayload,
}

# Maps seed_data subdirectory names to schema types
SEED_DIR_TO_SCHEMA = {
    "interview_experiences": "interview",
    "compensation": "compensation",
    "prep_resources": "prep_resource",
    "osint_tools": "osint_tool",
}


# ---------------------------------------------------------------------------
# Normalization utilities
# ---------------------------------------------------------------------------
def generate_document_id(schema_type: str, company: str | None, role: str | None, seq: int = 1) -> str:
    """
    Generate a human-readable document ID.
    Example: doc_interview_sprinklr_sde_001
    """
    def slugify(text: str) -> str:
        text = text.lower().strip()
        text = re.sub(r'[^a-z0-9]+', '_', text)
        text = text.strip('_')
        return text[:30]

    parts = ["doc", schema_type]
    if company:
        parts.append(slugify(company))
    if role:
        parts.append(slugify(role))
    parts.append(f"{seq:03d}")

    return "_".join(parts)


def validate_payload(schema_type: str, payload_data: dict) -> dict:
    """
    Validate a payload dict against the appropriate Pydantic model.
    Returns the validated payload as a dict.
    Raises ValueError if validation fails.
    """
    model_class = SCHEMA_MAP.get(schema_type)
    if model_class is None:
        raise ValueError(f"Unknown schema_type: '{schema_type}'. Must be one of: {list(SCHEMA_MAP.keys())}")

    # Parse the payload into the model (this validates it)
    validated = model_class.model_validate(payload_data)
    return validated.model_dump(exclude_none=True)


def normalize_document(raw: dict) -> dict:
    """
    Take a raw seed/extracted document and normalize it into the standard
    format expected by the RAG loader.

    Input `raw` must have:
      - document_id: str
      - metadata: dict (with at least source_type)

    And then the schema-specific payload fields at the top level.

    Returns a normalized document dict with keys:
      - document_id, schema_type, source_type, source_url, academic_year,
        company_name, role_title, payload, confidence_score
    """
    doc_id = raw.get("document_id", "")
    metadata = raw.get("metadata", {})

    # Detect schema type from the payload structure
    schema_type = _detect_schema_type(raw)

    # Extract the schema-specific payload (everything except document_id and metadata)
    payload_data = {k: v for k, v in raw.items() if k not in ("document_id", "metadata")}

    # Validate payload
    validated_payload = validate_payload(schema_type, payload_data)

    # Extract company and role from the payload for top-level indexing
    company_name = _extract_company(validated_payload, schema_type)
    role_title = _extract_role(validated_payload, schema_type)

    return {
        "document_id": doc_id,
        "schema_type": schema_type,
        "source_type": metadata.get("source_type", "Unknown"),
        "source_url": metadata.get("source_url"),
        "academic_year": metadata.get("academic_year"),
        "company_name": company_name,
        "role_title": role_title,
        "payload": validated_payload,
        "confidence_score": metadata.get("confidence_score", 0.8),
    }


def _detect_schema_type(doc: dict) -> str:
    """Detect schema type from the payload structure."""
    if "entity" in doc and "assessment_pipeline" in doc:
        return "interview"
    if "macro_placement_context" in doc or "specific_compensation_data" in doc:
        return "compensation"
    if "resource_details" in doc:
        return "prep_resource"
    if "tool_architecture" in doc:
        return "osint_tool"
    raise ValueError(f"Cannot detect schema type for document: {doc.get('document_id', 'unknown')}")


def _extract_company(payload: dict, schema_type: str) -> str | None:
    """Extract company name from validated payload."""
    if schema_type == "interview":
        return payload.get("entity", {}).get("company_name")
    if schema_type == "compensation":
        comp = payload.get("specific_compensation_data")
        return comp.get("company_name") if comp else None
    return None


def _extract_role(payload: dict, schema_type: str) -> str | None:
    """Extract role title from validated payload."""
    if schema_type == "interview":
        return payload.get("entity", {}).get("role_title")
    if schema_type == "compensation":
        comp = payload.get("specific_compensation_data")
        return comp.get("role_title") if comp else None
    return None


def payload_to_embedding_text(doc: dict) -> str:
    """
    Convert a normalized document into a natural-language text suitable
    for embedding. This is NOT the raw JSON — it's a flattened summary
    that captures the semantic meaning for vector search.
    """
    schema_type = doc.get("schema_type", "")
    payload = doc.get("payload", {})

    if schema_type == "interview":
        return _interview_to_text(payload, doc)
    elif schema_type == "compensation":
        return _compensation_to_text(payload, doc)
    elif schema_type == "prep_resource":
        return _prep_resource_to_text(payload, doc)
    elif schema_type == "osint_tool":
        return _osint_tool_to_text(payload, doc)
    else:
        # Fallback: just dump the JSON
        return json.dumps(payload, indent=2)


def _interview_to_text(payload: dict, doc: dict) -> str:
    """Generate embedding text for interview intelligence documents."""
    entity = payload.get("entity", {})
    pipeline = payload.get("assessment_pipeline", {})
    prep = payload.get("preparation_strategy", {})

    parts = [
        f"Interview experience at {entity.get('company_name', 'Unknown')} for the role of {entity.get('role_title', 'Unknown')}.",
        f"Target departments: {', '.join(entity.get('target_departments', []))}.",
        f"Hiring volume: {entity.get('hiring_volume', 'Unknown')}.",
    ]

    # OA details
    oa = pipeline.get("online_assessment", {})
    if oa:
        parts.append(
            f"Online Assessment: {oa.get('duration_minutes', '?')} minutes, "
            f"{oa.get('total_questions', '?')} questions, "
            f"difficulty {oa.get('difficulty_rating', 'Unknown')}. "
            f"Topics: {', '.join(oa.get('core_topics_tested', []))}."
        )

    # Tech rounds
    for rnd in pipeline.get("technical_rounds", []):
        parts.append(
            f"Technical Round {rnd.get('round_sequence', '?')}: "
            f"{rnd.get('duration_minutes', '?')} minutes. "
            f"Focus: {rnd.get('primary_focus', 'N/A')}. "
            f"Questions: {'; '.join(rnd.get('specific_queries', []))}."
        )
        if rnd.get("key_insight"):
            parts.append(f"Key insight: {rnd['key_insight']}")

    # Prep strategy
    if prep:
        topics = prep.get("critical_topics", [])
        if topics:
            parts.append(f"Critical preparation topics: {', '.join(topics)}.")
        resources = prep.get("recommended_resources", [])
        if resources:
            parts.append(f"Recommended resources: {', '.join(resources)}.")
        if prep.get("key_differentiator"):
            parts.append(f"Key differentiator: {prep['key_differentiator']}")

    return " ".join(parts)


def _compensation_to_text(payload: dict, doc: dict) -> str:
    """Generate embedding text for compensation documents."""
    parts = []

    macro = payload.get("macro_placement_context")
    if macro:
        parts.append(
            f"IIT Kharagpur placement statistics for {doc.get('academic_year', 'unknown year')}. "
            f"Phase: {macro.get('institute_phase', 'Unknown')}. "
            f"Total offers: {macro.get('total_institutional_offers', 'Unknown')}. "
            f"Highest CTC: {macro.get('highest_institutional_ctc_inr', 'Unknown')} INR."
        )
        trends = macro.get("structural_trends", [])
        if trends:
            parts.append(f"Key trends: {'; '.join(trends)}.")
        recruiters = macro.get("top_volume_recruiters", [])
        if recruiters:
            parts.append(f"Top recruiters: {', '.join(recruiters)}.")

    comp = payload.get("specific_compensation_data")
    if comp:
        fin = comp.get("financial_breakdown_inr", {})
        eq = comp.get("equity_breakdown", {})
        totals = comp.get("calculated_totals_inr", {})
        parts.append(
            f"Compensation for {comp.get('company_name', 'Unknown')} "
            f"{comp.get('role_title', 'Unknown')} at {comp.get('location', 'Unknown')}. "
            f"Candidate background: {comp.get('candidate_background', 'Unknown')}. "
            f"Base salary: {fin.get('base_salary_annual', '?')} INR/year. "
            f"Performance bonus: {fin.get('target_performance_bonus', 0)} INR. "
            f"Signing bonus: {fin.get('signing_bonus_one_time', 0)} INR. "
            f"RSU grant: {eq.get('rsu_grant_usd', 0)} USD over {eq.get('vesting_schedule_years', '?')} years. "
            f"Year 1 total: ~{totals.get('year_1_total_approx', '?')} INR. "
            f"Year 4 total: ~{totals.get('year_4_total_approx', '?')} INR."
        )
        if comp.get("key_insight"):
            parts.append(f"Key insight: {comp['key_insight']}")

    return " ".join(parts)


def _prep_resource_to_text(payload: dict, doc: dict) -> str:
    """Generate embedding text for preparation resource documents."""
    details = payload.get("resource_details", {})
    metrics = details.get("curriculum_metrics", {})

    parts = [
        f"Preparation resource: {details.get('resource_title', 'Unknown')}.",
        f"Description: {details.get('description', '')}.",
        f"Target disciplines: {', '.join(details.get('target_disciplines', []))}.",
        f"Target companies: {', '.join(details.get('target_corporate_archetypes', []))}.",
    ]

    if metrics:
        metric_parts = []
        if metrics.get("total_logic_puzzles"):
            metric_parts.append(f"{metrics['total_logic_puzzles']} logic puzzles")
        if metrics.get("total_probability_problems"):
            metric_parts.append(f"{metrics['total_probability_problems']} probability problems")
        if metrics.get("total_modules"):
            metric_parts.append(f"{metrics['total_modules']} modules")
        if metric_parts:
            parts.append(f"Contains: {', '.join(metric_parts)}.")

    topics = details.get("core_theoretical_topics", [])
    if topics:
        parts.append(f"Core topics: {', '.join(topics)}.")

    lit = details.get("recommended_supplementary_literature", [])
    if lit:
        parts.append(f"Recommended literature: {', '.join(lit)}.")

    if details.get("key_insight"):
        parts.append(f"Key insight: {details['key_insight']}")

    return " ".join(parts)


def _osint_tool_to_text(payload: dict, doc: dict) -> str:
    """Generate embedding text for OSINT tool documents."""
    arch = payload.get("tool_architecture", {})

    parts = [
        f"OSINT Tool: {arch.get('tool_name', 'Unknown')}.",
        f"Function: {arch.get('primary_function', '')}.",
        f"Description: {arch.get('description', '')}.",
        f"Tech stack: {', '.join(arch.get('technology_stack', []))}.",
        f"Deployment: {arch.get('deployment_methodology', 'Unknown')}.",
    ]

    channels = arch.get("notification_channels", [])
    if channels:
        parts.append(f"Notification channels: {', '.join(channels)}.")

    warnings = arch.get("compliance_and_risk_warnings", [])
    if warnings:
        parts.append(f"Compliance warnings: {'; '.join(warnings)}.")

    for sub in arch.get("sub_modules", []):
        parts.append(f"Sub-module '{sub.get('name', '?')}': {sub.get('function', '')}.")

    return " ".join(parts)
