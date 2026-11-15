"""
RAD-ARES: Strict Pydantic v2 Data Schemas for Space Radiation Physics & Bio-Dosimetry
Defines request/response contracts for Van Allen transit, Graded-Z shielding,
Moon vs. Mars habitat comparison, and the Gemini AI Orchestration Layer.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class VanAllenTransitRequest(BaseModel):
    """Input parameters for Trans-Lunar Injection (TLI) passage through the Van Allen Belts."""

    perigee_velocity_km_s: float = Field(
        default=10.85,
        ge=7.8,
        le=16.0,
        description="Spacecraft TLI injection velocity at perigee in km/s (Orion/Apollo nominal ~10.85 km/s).",
    )
    orbital_inclination_deg: float = Field(
        default=28.5,
        ge=0.0,
        le=90.0,
        description="Orbital inclination in degrees relative to the geomagnetic equator (Cape Canaveral = 28.5 deg).",
    )
    hull_areal_density_g_cm2: float = Field(
        default=12.0,
        ge=1.0,
        le=80.0,
        description="Equivalent spacecraft hull shielding areal density in g/cm^2.",
    )
    hull_material: str = Field(
        default="Graded_Al_HDPE_Water",
        description="Hull shielding configuration ('Aluminum_2219', 'Iron_Steel', 'Polyethylene_HDPE', 'Graded_Al_HDPE_Water').",
    )
    solar_particle_event_active: bool = Field(
        default=False,
        description="Whether an acute Solar Energetic Particle (SEP) storm is occurring during transit.",
    )
    round_trip: bool = Field(
        default=True,
        description="If True, computes both outbound TLI and inbound lunar return Earth entry belt transit.",
    )


class ShieldLayerSpec(BaseModel):
    """Specification for a single material layer in a multi-layer spacecraft or habitat shield."""

    material_id: str = Field(
        ...,
        description="Material key from NASA-OLTARIS-HZETRN2020 database (e.g., 'Iron_Steel', 'Aluminum_2219', 'Lunar_Regolith', 'Polyethylene_HDPE', 'Water_H2O', 'Lead_Pb', 'Titanium_Ti6Al4V', 'Boron_Nitride_BNNT').",
    )
    areal_density_g_cm2: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Layer areal density (mass thickness = density * thickness) in g/cm^2.",
    )


class GradedShieldRequest(BaseModel):
    """Input parameters for evaluating the Secondary Radiation Paradox and Graded-Z Multi-Layer Shielding."""

    outer_layer: ShieldLayerSpec = Field(
        default_factory=lambda: ShieldLayerSpec(
            material_id="Aluminum_2219", areal_density_g_cm2=5.0
        ),
        description="Exterior bumper layer facing free space (micrometeoroid & primary electron stripper).",
    )
    middle_layer: ShieldLayerSpec = Field(
        default_factory=lambda: ShieldLayerSpec(
            material_id="Lunar_Regolith", areal_density_g_cm2=8.0
        ),
        description="Intermediate structural/absorber layer.",
    )
    inner_layer: ShieldLayerSpec = Field(
        default_factory=lambda: ShieldLayerSpec(
            material_id="Polyethylene_HDPE", areal_density_g_cm2=12.0
        ),
        description="Interior crew cabin liner (low-Z hydrogenous neutron & secondary fragment moderator).",
    )
    exposure_duration_days: float = Field(
        default=180.0,
        ge=1.0,
        le=1500.0,
        description="Mission duration in days under this shielding configuration.",
    )
    environment_type: str = Field(
        default="Deep_Space_GCR",
        description="Radiation environment ('Deep_Space_GCR', 'Solar_Storm_SEP', 'Lunar_Surface', 'Mars_Surface').",
    )
    sep_fluence_multiplier: float = Field(
        default=1.0,
        ge=0.0,
        le=25.0,
        description="Intensity multiplier for Solar Energetic Particle events (1.0 = nominal, 10.0 = Carrington/Aug-1972 class).",
    )


class PlanetaryHabitatComparisonRequest(BaseModel):
    """Input parameters for comparing Lunar vs. Martian surface radiation & bio-dosimetry."""

    mission_duration_days: float = Field(
        default=180.0,
        ge=1.0,
        le=1500.0,
        description="Surface stay duration in days.",
    )
    habitat_shield_g_cm2: float = Field(
        default=15.0,
        ge=0.0,
        le=100.0,
        description="Habitat wall areal density in g/cm^2.",
    )
    use_graded_z_water_polyethylene: bool = Field(
        default=True,
        description="If True, uses optimal Graded-Z (Al + Regolith + HDPE/Water); if False, uses monolithic heavy metal (Iron/Steel).",
    )
    lunar_site: str = Field(
        default="Shackleton_South_Pole",
        description="Lunar landing site ('Mare_Tranquillitatis', 'Shackleton_South_Pole', 'Marius_Hills_Lava_Tube').",
    )
    mars_site: str = Field(
        default="Terra_Sirenum_Magnetic_Anomaly",
        description="Martian landing site ('Gale_Crater', 'Jezero_Crater', 'Terra_Sirenum_Magnetic_Anomaly', 'Hellas_Planitia_Deep_Basin').",
    )
    include_solar_storm_event: bool = Field(
        default=True,
        description="Whether to include 1 major Solar Energetic Particle (SEP) storm during the surface stay.",
    )


class FullMissionSimulationRequest(BaseModel):
    """End-to-end mission simulation combining Van Allen transit, Graded-Z shielding, and surface stay."""

    van_allen_params: VanAllenTransitRequest = Field(
        default_factory=VanAllenTransitRequest
    )
    shield_params: GradedShieldRequest = Field(default_factory=GradedShieldRequest)
    planetary_params: PlanetaryHabitatComparisonRequest = Field(
        default_factory=PlanetaryHabitatComparisonRequest
    )
    deep_space_transit_days: float = Field(
        default=8.0,
        ge=0.0,
        le=500.0,
        description="Total round-trip cislunar or interplanetary cruise days outside planetary surfaces.",
    )


class DatasetCitation(BaseModel):
    """Structured citation referencing exact NASA instruments, files, and telemetry rows."""

    dataset_id: str
    instrument_source: str
    spatial_temporal_scope: str
    data_rows_referenced: str
    physical_parameter_extracted: str


class AgentQueryRequest(BaseModel):
    """Natural language query payload for the RAD-ARES Gemini Function-Calling Agent."""

    query: str = Field(
        ...,
        min_length=3,
        max_length=4000,
        description="Natural language question or simulation directive about space radiation, Van Allen belts, Graded-Z shielding, or Moon vs. Mars bio-dosimetry.",
    )
    override_api_key: Optional[str] = Field(
        default=None,
        description="Optional runtime Gemini API key override from the user interface.",
    )


class MultiDetectorFusionRequest(BaseModel):
    """
    Input parameters for GadaSpace (Team Horizon-X) Multi-Detector Data Integration,
    Unit Validation, Bayesian/Kalman Data Fusion, 72-Hour SEP Storm Forecasting,
    3D Spacecraft Spatial Dose Mapping, and Approaches A/B/C/D Evaluation.
    """

    active_detectors: List[str] = Field(
        default_factory=lambda: [
            "Silicon_Detector",
            "TEPC_Proportional_Counter",
            "Scintillation_Detector",
            "Neutron_Detector_Gd157_He3",
            "Passive_Dosimeter_TLD",
        ],
        description="List of active spacecraft radiation detectors included in the fusion run.",
    )
    fusion_algorithm: str = Field(
        default="Kalman_Bayesian_Transport_Fusion",
        description="Data fusion algorithm ('Single_Detector_Only', 'Simple_Unweighted_Average', 'Inverse_Variance_Weighted', 'Kalman_Bayesian_Transport_Fusion').",
    )
    mission_scenario: str = Field(
        default="Lunar_Surface_CRaTER_Storm",
        description="Scenario ('Lunar_Surface_CRaTER_Storm', 'Mars_Surface_MSL_RAD', 'Van_Allen_RBSP_Transit', 'Deep_Space_Halloween_SEP').",
    )
    shield_architecture: str = Field(
        default="Shield_C_GadaSpace_BioHybrid",
        description="Shielding architecture ('Shield_A_Monolithic_Lead_500kg', 'Shield_B_Single_HDPE_100kg', 'Shield_C_GadaSpace_BioHybrid_145kg').",
    )
    forecast_horizon_hours: int = Field(
        default=72,
        ge=12,
        le=168,
        description="Predictive SEP space-weather forecasting horizon in hours (12 to 168 hours).",
    )
    simulate_sensor_dropout: bool = Field(
        default=False,
        description="If True, simulates missing timestamps and Scintillator saturation during flare peak to test Module 2 & Metric 3 data completeness.",
    )
    custom_detector_records: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="Optional uploaded CSV/JSON detector records for validation and unit conversion.",
    )


class AgentQueryResponse(BaseModel):
    """Comprehensive response returned by the GadaSpace (Team Horizon-X) Gemini AI Orchestrator."""

    query: str
    orchestration_mode: str = Field(
        description="Indicates which Gemini key or deterministic physics router fulfilled the request."
    )
    invoked_tools: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Exact internal Python physics functions invoked with extracted parameters.",
    )
    synthesized_analysis_markdown: str = Field(
        description="Grounded scientific report generated from the computed metrics."
    )
    computed_telemetry: Dict[str, Any] = Field(
        default_factory=dict,
        description="Raw numerical physics and bio-dosimetry output dictionary.",
    )
    plotly_charts_json: Dict[str, Any] = Field(
        default_factory=dict,
        description="Serialized Plotly visualization figures ready for frontend rendering.",
    )
    reference_index: List[DatasetCitation] = Field(
        default_factory=list,
        description="Mandatory grounded reference index citing exact NASA dataset IDs, coordinates, and rows.",
    )

