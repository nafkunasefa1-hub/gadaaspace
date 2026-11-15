"""
GadaSpace (Team Horizon-X): Asynchronous FastAPI Microservice Endpoints (API v1)
Exposes REST endpoints for Streamlit, React/Three.js, or external mission control clients.
"""

from typing import Any, Dict

from fastapi import APIRouter, HTTPException, status

from app.core.config import settings
from app.schemas.dosimetry import (
    AgentQueryRequest,
    AgentQueryResponse,
    FullMissionSimulationRequest,
    GradedShieldRequest,
    MultiDetectorFusionRequest,
    PlanetaryHabitatComparisonRequest,
    VanAllenTransitRequest,
)
from app.services.gemini_agent import gemini_agent
from app.services.radiation_engine import radiation_engine

router = APIRouter()


@router.get("/health", summary="GadaSpace (Team Horizon-X) System & Multi-Key Pool Health Telemetry")
async def health_check() -> Dict[str, Any]:
    """Returns operational status, active Gemini key pool count, and NASA-STD-3001 constants."""
    key_pool = settings.get_api_key_pool()
    return {
        "status": "OPERATIONAL",
        "project": settings.PROJECT_NAME,
        "team": settings.TEAM_NAME,
        "version": settings.VERSION,
        "gemini_model": settings.GEMINI_MODEL,
        "configured_api_keys_in_pool": len(key_pool),
        "nasa_career_limit_msv": settings.NASA_PEL_CAREER_MSV,
        "nasa_legacy_limit_msv": settings.NASA_LEGACY_CAREER_MSV,
        "datasets_loaded": [
            "NASA-RBSP-REPT-MAGEIS-2026",
            "NASA-OLTARIS-HZETRN2020-MAT",
            "NASA-LRO-CRATER-TEP-2026",
            "NASA-MSL-RAD-GALE-2026",
            "NOAA-GOES-OMNI-MULTI-DETECTOR-2026",
        ],
    }


@router.get("/datasets/catalog", summary="Retrieve Curated NASA Reference Datasets")
async def get_datasets_catalog() -> Dict[str, Any]:
    """Returns the complete structured tables for Van Allen RBSP, OLTARIS Materials, LRO CRaTER, and MSL RAD."""
    return radiation_engine.get_dataset_catalog()


@router.post(
    "/radiation/van-allen-transit",
    summary="Simulate Pre-Flight Lunar Trajectory Through Van Allen Belts",
)
async def simulate_van_allen_endpoint(
    payload: VanAllenTransitRequest,
) -> Dict[str, Any]:
    """Integrates proton and electron flux + Bremsstrahlung across Inner and Outer Van Allen Belts."""
    try:
        return radiation_engine.simulate_van_allen_transit(payload)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Van Allen transit calculation error: {str(exc)}",
        ) from exc


@router.post(
    "/radiation/graded-shield",
    summary="Evaluate Graded-Z Multi-Layer Shielding & Secondary Neutron Paradox",
)
async def simulate_graded_shield_endpoint(
    payload: GradedShieldRequest,
) -> Dict[str, Any]:
    """Computes layer-by-layer attenuation, secondary spallation neutrons, and optimal Graded-Z allocation."""
    try:
        return radiation_engine.simulate_graded_z_shielding(payload)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Graded-Z shielding calculation error: {str(exc)}",
        ) from exc


@router.post(
    "/radiation/planetary-comparison",
    summary="Compare Moon vs. Mars Surface Dosimetry & Human Bio-Cost",
)
async def compare_planetary_habitats_endpoint(
    payload: PlanetaryHabitatComparisonRequest,
) -> Dict[str, Any]:
    """Compares Lunar and Martian sites, magnetic anomalies, CO2 attenuation, DNA DSBs, and CNS Fatigue."""
    try:
        return radiation_engine.compare_planetary_habitats(payload)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Planetary comparison calculation error: {str(exc)}",
        ) from exc


@router.post(
    "/radiation/multi-detector-fusion",
    summary="Run Multi-Detector Data Validation, Kalman/Bayesian Fusion, 72h Forecast & 3D Cabin Map",
)
async def simulate_multi_detector_fusion_endpoint(
    payload: MultiDetectorFusionRequest,
) -> Dict[str, Any]:
    """Executes GadaSpace (Team Horizon-X) Modules 1, 2, 4, 5, 3D Spatial Cabin Map, and Approaches A-D evaluation."""
    try:
        return radiation_engine.simulate_multi_detector_fusion_and_forecast(payload)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Multi-detector fusion error: {str(exc)}",
        ) from exc


@router.post(
    "/radiation/full-mission",
    summary="Run End-to-End Artemis / Mars Mission Simulation & Generate Plotly Charts",
)
async def run_full_mission_endpoint(
    payload: FullMissionSimulationRequest,
) -> Dict[str, Any]:
    """Executes the complete mission pipeline and returns serialized Plotly figures + reference citations."""
    try:
        return radiation_engine.run_full_mission_simulation(payload)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Full mission simulation error: {str(exc)}",
        ) from exc


@router.post(
    "/agent/query",
    response_model=AgentQueryResponse,
    summary="Natural Language Query Engine with Gemini Function Calling & Grounded Synthesis",
)
async def query_radiation_agent_endpoint(
    payload: AgentQueryRequest,
) -> AgentQueryResponse:
    """
    Analyzes complex natural language questions, extracts spatial/temporal/shielding parameters,
    invokes deterministic Python physics functions, and returns a grounded analysis + Plotly charts.
    """
    try:
        return gemini_agent.process_query(payload)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Orchestration error: {str(exc)}",
        ) from exc

