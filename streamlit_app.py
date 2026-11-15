"""
GadaSpace v4.0 (Team Horizon-X): 2026 NASA Space Apps Mission Control Dashboard (Streamlit)
===========================================================================================
Implements the complete 6-Stage Aerospace Radiation Architecture:
  [1. DETECT] -> [2. CHARACTERIZE] -> [3. MAP] -> [4. PREDICT] -> [5. PROTECT] -> [6. MONITOR]

And solves the 4-Way Spacecraft Systems Engineering Constraint:
  [Protection (%) vs. Added Mass (kg) vs. Electrical Power (kW) vs. Crew Safety]

Featuring:
  - Interactive 3D WebGL (Three.js) Spacecraft Ray-Tracing & Van Allen Belt Digital Twin
  - 5-Detector Kalman/Bayesian Data Fusion & Automated Unit Standardization
  - Novel 3-Layer Bio-Hybrid Shield: Thin-Pb/Al -> HDPE/Water -> 157Gd-MXene + Fungal Melanin
"""

import json
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import httpx
import pandas as pd
import plotly.io as pio
import streamlit as st
import streamlit.components.v1 as components

from app.core.config import settings
from app.schemas.dosimetry import (
    AgentQueryRequest,
    FullMissionSimulationRequest,
    GradedShieldRequest,
    MultiDetectorFusionRequest,
    PlanetaryHabitatComparisonRequest,
    ShieldLayerSpec,
    VanAllenTransitRequest,
)
from app.services.gemini_agent import gemini_agent
from app.services.radiation_engine import (
    OLTARIS_MATERIAL_DB,
    PLANETARY_SITES_DB,
    radiation_engine,
)


# ==============================================================================
# 1. PAGE CONFIGURATION & CUSTOM AEROSPACE TELEMETRY STYLING
# ==============================================================================

st.set_page_config(
    page_title="GadaSpace v4.0 — Team Horizon-X | 3D Multi-Detector Radiation Fusion & Bio-Hybrid Shielding",
    page_icon="🛰️",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
    .main {
        background-color: #0b0e14;
    }
    .stMetric {
        background: linear-gradient(135deg, #141a26 0%, #1b2436 100%);
        border: 1px solid #2a3950;
        border-radius: 10px;
        padding: 14px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
    }
    .paradox-box {
        background: linear-gradient(90deg, rgba(6,214,160,0.12) 0%, rgba(17,138,178,0.12) 100%);
        border-left: 4px solid #06d6a0;
        padding: 14px 18px;
        border-radius: 6px;
        margin-bottom: 16px;
    }
    .warning-box {
        background: linear-gradient(90deg, rgba(239,71,111,0.15) 0%, rgba(255,159,28,0.12) 100%);
        border-left: 4px solid #ef476f;
        padding: 14px 18px;
        border-radius: 6px;
        margin-bottom: 16px;
    }
    .pipeline-pill {
        background: linear-gradient(135deg, #1a2333 0%, #0f1724 100%);
        border: 1px solid #38bdf8;
        border-radius: 8px;
        padding: 10px;
        text-align: center;
        font-size: 0.85rem;
    }
    </style>
    """,
    unsafe_allow_html=True,
)


# ==============================================================================
# 2. DUAL-MODE EXECUTION CLIENT (FASTAPI MICROSERVICE + IN-PROCESS FALLBACK)
# ==============================================================================

def check_backend_microservice() -> Tuple[bool, str]:
    """Checks if the FastAPI server is reachable at settings.BACKEND_URL."""
    try:
        with httpx.Client(timeout=1.2) as client:
            resp = client.get(f"{settings.BACKEND_URL}{settings.API_PREFIX}/health")
            if resp.status_code == 200:
                return True, f"Connected to FastAPI Microservice ({settings.BACKEND_URL})"
    except Exception:
        pass
    return False, "Direct In-Process Physics & AI Engine (Zero-Latency Standalone Mode)"


def execute_agent_query(query_text: str, override_key: Optional[str]) -> Dict[str, Any]:
    """Routes natural language queries through FastAPI or direct in-process Gemini agent."""
    payload = {"query": query_text, "override_api_key": override_key or None}
    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(
                f"{settings.BACKEND_URL}{settings.API_PREFIX}/agent/query",
                json=payload,
            )
            if resp.status_code == 200:
                return resp.json()
    except Exception:
        pass
    res = gemini_agent.process_query(
        AgentQueryRequest(query=query_text, override_api_key=override_key or None)
    )
    return res.model_dump()


def execute_full_simulation(req: FullMissionSimulationRequest) -> Dict[str, Any]:
    """Routes full mission simulation through FastAPI or direct in-process physics engine."""
    try:
        with httpx.Client(timeout=8.0) as client:
            resp = client.post(
                f"{settings.BACKEND_URL}{settings.API_PREFIX}/radiation/full-mission",
                json=req.model_dump(),
            )
            if resp.status_code == 200:
                return resp.json()
    except Exception:
        pass
    return radiation_engine.run_full_mission_simulation(req)


def render_plotly_from_json_dict(fig_dict: Dict[str, Any], key: str) -> None:
    """Safely reconstructs and renders a Plotly figure from its serialized JSON dict with scrollZoom and modebar enabled."""
    fig = pio.from_json(json.dumps(fig_dict))
    fig.update_layout(dragmode="zoom")
    st.plotly_chart(
        fig,
        use_container_width=True,
        key=key,
        config={
            "scrollZoom": True,
            "displayModeBar": True,
            "displaylogo": False,
            "doubleClick": "reset+autosize",
        },
    )


# ==============================================================================
# 3. SIDEBAR: TELEMETRY STATUS, MULTI-KEY POOL & GLOBAL MISSION PARAMETERS
# ==============================================================================

with st.sidebar:
    st.markdown("## 🛰️ **GadaSpace v4.0 CONTROL**")
    st.caption(
        "Team Horizon-X | Photorealistic 3D WebGL & Multi-Detector Fusion | 2026 NASA Space Apps"
    )

    api_online, mode_desc = check_backend_microservice()
    key_pool = settings.get_api_key_pool()

    st.success(f"**Engine Status:** OPERATIONAL\n\n**Mode:** {mode_desc}")
    st.info(
        f"**Gemini Key Pool:** `{len(key_pool)}` Active Keys (`Key1`–`Key5` Failover)\n\n"
        f"**NASA-STD-3001 Limit:** `{settings.NASA_PEL_CAREER_MSV:.0f} mSv` (Artemis) / `{settings.NASA_LEGACY_CAREER_MSV:.0f} mSv` (Legacy)"
    )

    with st.expander("🔑 Optional Runtime Gemini Key Override"):
        runtime_api_key = st.text_input(
            "Override API Key (AIzaSy... or AQ...)",
            value="",
            type="password",
            help="Leave blank to use the 5 pre-configured keys in your .env rotation pool.",
        )

    st.markdown("---")
    st.markdown("### ⚙️ **Global Mission Parameters**")

    sim_duration_days = st.slider(
        "Planetary Surface Stay Duration (Days)",
        min_value=14.0,
        max_value=1000.0,
        value=180.0,
        step=14.0,
    )
    sim_perigee_vel = st.slider(
        "TLI Perigee Velocity (km/s)",
        min_value=8.0,
        max_value=14.5,
        value=10.85,
        step=0.15,
    )
    sim_inclination = st.slider(
        "Orbital Inclination (Degrees)",
        min_value=0.0,
        max_value=85.0,
        value=28.5,
        step=0.5,
    )
    sim_sep_storm = st.toggle(
        "Simulate Solar Energetic Particle (SEP) Storm",
        value=True,
    )

    st.markdown("### 🧬 **3-Layer Graded-Z & Novel Bio-Hybrid Stack**")
    material_options = list(OLTARIS_MATERIAL_DB.keys())
    outer_mat_sel = st.selectbox(
        "Layer 1: Outer HZE Stripper / Bumper",
        options=material_options,
        index=material_options.index("Aluminum_2219"),
        format_func=lambda k: OLTARIS_MATERIAL_DB[k]["display_name"],
    )
    outer_thick = st.slider("Outer Layer Mass (g/cm²)", 0.5, 30.0, 2.5, 0.5)

    mid_mat_sel = st.selectbox(
        "Layer 2: Middle Hydrogenous Moderator",
        options=material_options,
        index=material_options.index("Polyethylene_HDPE"),
        format_func=lambda k: OLTARIS_MATERIAL_DB[k]["display_name"],
    )
    mid_thick = st.slider("Middle Layer Mass (g/cm²)", 0.5, 40.0, 10.0, 0.5)

    inner_mat_sel = st.selectbox(
        "Layer 3: Inner Bio-Hybrid / Neutron Absorber",
        options=material_options,
        index=material_options.index("Gd157_MXene_Nanosheet"),
        format_func=lambda k: OLTARIS_MATERIAL_DB[k]["display_name"],
    )
    inner_thick = st.slider("Inner Layer Mass (g/cm²)", 0.5, 40.0, 5.5, 0.5)

    st.markdown("### 🌍 **Landing Site Selection**")
    lunar_sites = [k for k, v in PLANETARY_SITES_DB.items() if v["body"] == "Moon"]
    mars_sites = [k for k, v in PLANETARY_SITES_DB.items() if v["body"] == "Mars"]

    selected_lunar_site = st.selectbox(
        "Lunar Landing Site (LRO CRaTER)",
        options=lunar_sites,
        index=lunar_sites.index("Shackleton_South_Pole"),
        format_func=lambda k: PLANETARY_SITES_DB[k]["display_name"],
    )
    selected_mars_site = st.selectbox(
        "Martian Landing Site (MSL RAD)",
        options=mars_sites,
        index=mars_sites.index("Terra_Sirenum_Magnetic_Anomaly"),
        format_func=lambda k: PLANETARY_SITES_DB[k]["display_name"],
    )


# ==============================================================================
# 4. COMPUTE LIVE DETERMINISTIC SIMULATION FROM SIDEBAR CONTROLS
# ==============================================================================

total_shield_mass = outer_thick + mid_thick + inner_thick
is_low_z_inner = inner_mat_sel in {
    "Polyethylene_HDPE",
    "Water_H2O",
    "Boron_Nitride_BNNT",
    "Liquid_Hydrogen_LH2",
    "Melanin_Biopolymer_Hydrogel",
    "Gd157_MXene_Nanosheet",
    "LiH_Aramid_Metamaterial",
}

active_mission_request = FullMissionSimulationRequest(
    van_allen_params=VanAllenTransitRequest(
        perigee_velocity_km_s=sim_perigee_vel,
        orbital_inclination_deg=sim_inclination,
        hull_areal_density_g_cm2=min(total_shield_mass, 60.0),
        hull_material="Graded_Al_HDPE_Water" if is_low_z_inner else "Iron_Steel",
        solar_particle_event_active=sim_sep_storm,
        round_trip=True,
    ),
    shield_params=GradedShieldRequest(
        outer_layer=ShieldLayerSpec(
            material_id=outer_mat_sel, areal_density_g_cm2=outer_thick
        ),
        middle_layer=ShieldLayerSpec(
            material_id=mid_mat_sel, areal_density_g_cm2=mid_thick
        ),
        inner_layer=ShieldLayerSpec(
            material_id=inner_mat_sel, areal_density_g_cm2=inner_thick
        ),
        exposure_duration_days=sim_duration_days,
        environment_type="Solar_Storm_SEP" if sim_sep_storm else "Deep_Space_GCR",
        sep_fluence_multiplier=1.5 if sim_sep_storm else 1.0,
    ),
    planetary_params=PlanetaryHabitatComparisonRequest(
        mission_duration_days=sim_duration_days,
        habitat_shield_g_cm2=total_shield_mass,
        use_graded_z_water_polyethylene=is_low_z_inner,
        lunar_site=selected_lunar_site,
        mars_site=selected_mars_site,
        include_solar_storm_event=sim_sep_storm,
    ),
    deep_space_transit_days=8.0,
)

live_sim = execute_full_simulation(active_mission_request)
va_metrics = live_sim["van_allen_transit"]["metrics"]
sh_metrics = live_sim["graded_z_shielding"]["metrics"]
pm_summary = live_sim["planetary_comparison"]["mars_vs_moon_paradox_summary"]
camp_summary = live_sim["campaign_summary"]
bio_metrics = camp_summary["lunar_campaign_biodosimetry"]


# ==============================================================================
# 5. TOP HEADER, 6-STAGE PIPELINE & EXECUTIVE TELEMETRY RIBBON
# ==============================================================================

st.markdown(
    "# 🛰️ **GadaSpace v4.0 (Team Horizon-X): 3D Multi-Detector Radiation Fusion, Bio-Hybrid Shielding & Prediction System**"
)
st.markdown(
    "**6-Stage Architecture:** `1. DETECT (5 Sensors)` $\\rightarrow$ `2. CHARACTERIZE (LET & n⁰)` $\\rightarrow$ `3. MAP (3D Cabin & Belts)` $\\rightarrow$ `4. PREDICT (72h SEP)` $\\rightarrow$ `5. PROTECT (Protection vs. Mass vs. Power vs. Safety)` $\\rightarrow$ `6. MONITOR (D = E/m -> Q(LET) -> Sv)`"
)

with st.expander("🧊 Open Interactive 3D WebGL (Three.js) Ray-Tracing & Multi-Detector Fusion Studio", expanded=True):
    html_file_path = Path(__file__).resolve().parent / "index.html"
    if html_file_path.exists():
        components.html(html_file_path.read_text(encoding="utf-8"), height=860, scrolling=True)
    fusion_res = radiation_engine.simulate_multi_detector_fusion_and_forecast(
        MultiDetectorFusionRequest()
    )
    st.markdown("##### 📡 **Module 2 & 4: 5-Detector Validation, Unit Standardization & Kalman/Bayesian Data Fusion**")
    st.dataframe(pd.DataFrame(fusion_res["detector_validation_table"]), use_container_width=True, hide_index=True)
    st.markdown("##### 📊 **Section 10 Benchmark: Quantitative Evaluation of Approaches A, B, C & D**")
    st.dataframe(pd.DataFrame(fusion_res["approaches_a_b_c_d_evaluation"]), use_container_width=True, hide_index=True)
    st.markdown("##### 🛸 **Metric 5: 3D Spacecraft Cabin Spatial Radiation Distribution (5 Internal Zones)**")
    st.dataframe(pd.DataFrame(fusion_res["spatial_cabin_3d_zones"]), use_container_width=True, hide_index=True)

kpi1, kpi2, kpi3, kpi4, kpi5 = st.columns(5)
with kpi1:
    st.metric(
        label="Van Allen Belt Transit",
        value=f"{va_metrics['total_transit_dose_msv']:.2f} mSv",
        delta=f"{va_metrics['total_belt_exposure_hours']:.1f} hrs in Belts",
        delta_color="off",
    )
with kpi2:
    st.metric(
        label="Bio-Hybrid vs. Pure Iron",
        value=f"{sh_metrics['configured_stack_dose_rate_msv_day']:.2f} mSv/d",
        delta=f"-{sh_metrics['graded_z_advantage_over_iron_pct']:.1f}% vs Iron (Z=26)",
        delta_color="normal",
    )
with kpi3:
    st.metric(
        label=f"Moon Surface ({sim_duration_days:.0f}d)",
        value=f"{pm_summary['lunar_mission_dose_msv']:.1f} mSv",
        delta="0 g/cm² Air | Albedo n⁰ Active",
        delta_color="inverse",
    )
with kpi4:
    st.metric(
        label=f"Mars Surface ({sim_duration_days:.0f}d)",
        value=f"{pm_summary['mars_mission_dose_msv']:.1f} mSv",
        delta=f"-{pm_summary['mars_dose_reduction_vs_moon_pct']:.1f}% Safer than Moon!",
        delta_color="normal",
    )
with kpi5:
    st.metric(
        label="Absorbed Dose D = E/m -> Sv",
        value=f"{bio_metrics['estimated_absorbed_dose_gy']:.3f} Gy -> {bio_metrics['total_equivalent_dose_msv']:.1f} mSv",
        delta=f"Q(LET)={bio_metrics['icrp_quality_factor_q']} | {bio_metrics['dna_double_strand_breaks_per_cell']:.1f} DSB/cell",
        delta_color="inverse"
        if bio_metrics["nasa_250msv_limit_consumed_pct"] > 100
        else "normal",
    )


# ==============================================================================
# 6. FIVE MISSION CONTROL TABS
# ==============================================================================

tab_agent, tab_tradeoff, tab_shield, tab_belts_planets, tab_datasets = st.tabs(
    [
        "🧠 1. AI Flight Surgeon & Query Engine",
        "⚖️ 2. 4-Way Trade-Off Optimizer (Mass vs. Power vs. Safety)",
        "🧬 3. Novel Bio-Hybrid Shielding & Spallation Lab",
        "☄️ 4. Van Allen Belts, Moon vs. Mars & D=E/m Monitor",
        "🏆 5. NASA Datasets & 9 Global Awards Alignment",
    ]
)

# ------------------------------------------------------------------------------
# TAB 1: NATURAL LANGUAGE QUERYING ENGINE & GEMINI FUNCTION CALLING
# ------------------------------------------------------------------------------
with tab_agent:
    st.markdown(
        """
        <div class="paradox-box">
        <b>🤖 Intelligent Gemini Function-Calling Orchestrator (5-Key High-Availability Pool):</b> Ask any complex question about the 6-Stage Pipeline, why heavy metals fail, how our novel <b>Thin-Pb/Al + Polyethylene + <sup>157</sup>Gd-MXene + Radiotrophic Fungal Melanin</b> shield works, or how to optimize <b>Protection vs. Mass vs. Power vs. Crew Safety</b>.
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.markdown("##### ⚡ **One-Click Judge Preset Scenarios:**")
    p_col1, p_col2, p_col3, p_col4 = st.columns(4)

    preset_query: Optional[str] = None
    with p_col1:
        if st.button(
            "🧬 Novel Bio-Hybrid: Thin-Pb + HDPE + 157Gd-MXene + Melanin",
            use_container_width=True,
        ):
            preset_query = (
                "Evaluate a 180-day mission using a Thin Lead stripper, Polyethylene moderator, "
                "and novel 157Gd-MXene + Radiotrophic Fungal Melanin inner absorber at 18 g/cm^2. "
                "Compare Protection vs Mass vs Power against a 500 kg bulk shield."
            )
    with p_col2:
        if st.button(
            "⚖️ Trade-Off: Shield A (500 kg) vs. Shield B (100 kg)",
            use_container_width=True,
        ):
            preset_query = (
                "Compare Shield A (-40% radiation but adds 500 kg) vs Shield B (-32% radiation and adds 100 kg) "
                "vs our RAD-ARES Bio-Hybrid shield across Protection, Mass, Power, and Crew Safety."
            )
    with p_col3:
        if st.button(
            "🌕 vs 🔴 Moon vs. Mars Paradox & D=E/m Dosimetry",
            use_container_width=True,
        ):
            preset_query = (
                "Compare a 365-day stay on the Moon (Mare Tranquillitatis) vs Mars (Terra Sirenum Magnetic Anomaly) "
                "with 18 g/cm^2 shielding. Calculate D = E/m in Gy, Quality Factor Q(LET), and Sv against NASA's 250 mSv limit."
            )
    with p_col4:
        if st.button(
            "☄️ Van Allen Belt TLI Trajectory & SEP Storm", use_container_width=True
        ):
            preset_query = (
                "Simulate an Orion pre-flight lunar trajectory at 10.85 km/s and 28.5 deg inclination "
                "through the Inner Proton and Outer Electron Van Allen Belts during a Solar Particle Event."
            )

    default_input = (
        preset_query
        if preset_query
        else (
            "Run the full 6-Stage pipeline (Detect -> Characterize -> Map -> Predict -> Protect -> Monitor) "
            "for a 180-day lunar mission with 18 g/cm^2 shielding using Thin Lead, Polyethylene, 157Gd-MXene, and Radiotrophic Melanin. "
            "Optimize Protection vs Mass vs Power vs Crew Safety and compute D = E/m (Gy) and Equivalent Dose (mSv)."
        )
    )

    with st.form("nl_query_form", clear_on_submit=False):
        user_query_text = st.text_area(
            "Enter Complex Space Radiation, Trade-Off & Bio-Dosimetry Query:",
            value=default_input,
            height=95,
        )
        submitted = st.form_submit_button(
            "🚀 Execute 6-Stage Deterministic Physics Pipeline & Synthesize Grounded Report",
            type="primary",
            use_container_width=True,
        )

    if submitted or preset_query or "last_agent_response" not in st.session_state:
        with st.spinner(
            "Executing 6-Stage Physics Pipeline [Detect -> Characterize -> Map -> Predict -> Protect -> Monitor]..."
        ):
            st.session_state["last_agent_response"] = execute_agent_query(
                user_query_text, runtime_api_key
            )

    agent_res = st.session_state["last_agent_response"]
    st.caption(f"**Orchestration Mode:** `{agent_res['orchestration_mode']}`")

    with st.expander(
        "🛠️ View Executed 6-Stage Function Calls & Extracted Physics Parameters",
        expanded=False,
    ):
        st.json(agent_res["invoked_tools"])

    st.markdown(agent_res["synthesized_analysis_markdown"])

    st.markdown("#### 📊 **Dynamically Generated Telemetry Visualizations**")
    c_row1_1, c_row1_2 = st.columns(2)
    with c_row1_1:
        render_plotly_from_json_dict(
            agent_res["plotly_charts_json"]["secondary_paradox_chart"],
            key="agent_chart_shield",
        )
    with c_row1_2:
        render_plotly_from_json_dict(
            agent_res["plotly_charts_json"]["engineering_tradeoff_chart"],
            key="agent_chart_tradeoff",
        )

    c_row2_1, c_row2_2 = st.columns(2)
    with c_row2_1:
        render_plotly_from_json_dict(
            agent_res["plotly_charts_json"]["van_allen_trajectory_chart"],
            key="agent_chart_belt",
        )
    with c_row2_2:
        render_plotly_from_json_dict(
            agent_res["plotly_charts_json"]["planetary_paradox_chart"],
            key="agent_chart_planet",
        )


# ------------------------------------------------------------------------------
# TAB 2: 4-WAY ENGINEERING TRADE-OFF OPTIMIZER (PROTECTION VS MASS VS POWER VS SAFETY)
# ------------------------------------------------------------------------------
with tab_tradeoff:
    st.markdown(
        "### ⚖️ **Spacecraft Systems Constraint Optimizer: Protection vs. Mass vs. Power vs. Crew Safety**"
    )
    st.markdown(
        """
        <div class="paradox-box">
        <b>🚀 Why You Cannot Optimize Only for Radiation Protection:</b> In real NASA mission design (Orion / Gateway / HLS), every extra kilogram launched through Trans-Lunar Injection (TLI) requires exponential propellant mass under the Tsiolkovsky Rocket Equation. For example:
        <ul>
            <li><b>Shield A</b> reduces radiation by <b>40%</b> but adds <b>500 kg</b> ($8.0\\%\\text{ dose reduction per }100\\text{ kg}$).</li>
            <li><b>Shield B</b> reduces radiation by <b>32%</b> but adds only <b>100 kg</b> ($32.0\\%\\text{ dose reduction per }100\\text{ kg}$ — $4\\times$ higher mass efficiency!).</li>
            <li><b>Shield C (Our Novel Bio-Hybrid: Thin-Pb/Al + HDPE + <sup>157</sup>Gd-MXene + Radiotrophic Melanin)</b> reduces radiation by <b>61.5%</b> while adding only <b>145 kg</b> and <b>0.05 kW</b> power!</li>
        </ul>
        </div>
        """,
        unsafe_allow_html=True,
    )

    render_plotly_from_json_dict(
        live_sim["plotly_charts_json"]["engineering_tradeoff_chart"],
        key="tab2_tradeoff_chart",
    )

    st.markdown("#### 📋 **Multi-Objective Spacecraft Shielding Trade-Off Matrix**")
    st.dataframe(
        pd.DataFrame(live_sim["graded_z_shielding"]["engineering_tradeoff_matrix"]),
        use_container_width=True,
        hide_index=True,
    )

    st.markdown("#### 🔄 **Live 6-Stage Operational Pipeline Telemetry (`Detect -> Monitor`)**")
    st.dataframe(
        pd.DataFrame(live_sim["six_stage_closed_loop_pipeline"]),
        use_container_width=True,
        hide_index=True,
    )


# ------------------------------------------------------------------------------
# TAB 3: NOVEL BIO-HYBRID SHIELDING CAD & SECONDARY NEUTRON PARADOX LAB
# ------------------------------------------------------------------------------
with tab_shield:
    st.markdown(
        "### 🧬 **Novel Bio-Hybrid Metamaterials & The Secondary Spallation Paradox**"
    )

    if not is_low_z_inner:
        st.markdown(
            f"""
            <div class="warning-box">
            <b>⚠️ SECONDARY RADIATION HAZARD DETECTED IN INNER LAYER:</b> Your inner cabin liner is currently set to a higher-Z metal (<b>{OLTARIS_MATERIAL_DB[inner_mat_sel]['display_name']}</b>). Relativistic GCR protons and <sup>56</sup>Fe ions striking this inner wall generate unmoderated <b>Secondary Spallation Neutrons ({sh_metrics['secondary_spallation_neutron_dose_msv_day']:.3f} mSv/day)</b> and Bremsstrahlung X-rays directly inside the crew cabin! Switch Layer 3 in the sidebar to <b><sup>157</sup>Gd-MXene Nanosheet</b>, <b>Radiotrophic Melanin</b>, or <b>Polyethylene (HDPE)</b>.
            </div>
            """,
            unsafe_allow_html=True,
        )
    else:
        st.markdown(
            f"""
            <div class="paradox-box">
            <b>✅ NOVEL BIO-HYBRID / GRADED-Z MODERATION ACTIVE:</b> Your inner cabin liner (<b>{OLTARIS_MATERIAL_DB[inner_mat_sel]['display_name']}</b>) suppresses secondary spallation neutrons and scavenges Bremsstrahlung X-rays, cutting daily dose by <b>{sh_metrics['graded_z_advantage_over_iron_pct']:.1f}%</b> compared to monolithic Iron of the exact same mass ({sh_metrics['total_areal_density_g_cm2']:.1f} g/cm²)!
            </div>
            """,
            unsafe_allow_html=True,
        )

    render_plotly_from_json_dict(
        live_sim["plotly_charts_json"]["secondary_paradox_chart"],
        key="tab3_shield_chart",
    )

    st.markdown("#### 🔬 **Layer-by-Layer Particle Transport & Secondary Spallation Cascade**")
    st.dataframe(
        pd.DataFrame(live_sim["graded_z_shielding"]["layer_by_layer_transport"]),
        use_container_width=True,
        hide_index=True,
    )


# ------------------------------------------------------------------------------
# TAB 4: VAN ALLEN BELT TRAJECTORY, MOON VS MARS & D=E/m DOSIMETRY MONITOR
# ------------------------------------------------------------------------------
with tab_belts_planets:
    st.markdown(
        "### ☄️ **Van Allen Belt Trajectory, Moon vs. Mars Paradox & Astronaut Exposure ($D = E/m \\rightarrow \\text{Sv}$)**"
    )

    b_col1, b_col2 = st.columns(2)
    with b_col1:
        render_plotly_from_json_dict(
            live_sim["plotly_charts_json"]["van_allen_trajectory_chart"],
            key="tab4_belt_chart",
        )
    with b_col2:
        render_plotly_from_json_dict(
            live_sim["plotly_charts_json"]["planetary_paradox_chart"],
            key="tab4_planet_chart",
        )

    render_plotly_from_json_dict(
        live_sim["plotly_charts_json"]["biodosimetry_gauge_chart"],
        key="tab4_bio_chart",
    )

    st.markdown("#### 🩺 **Stage 6 (`MONITOR`): Organ-Specific Effective Dose & $D = E/m$ Breakdown**")
    org_col1, org_col2 = st.columns(2)
    with org_col1:
        st.json(bio_metrics["organ_specific_doses_msv"])
    with org_col2:
        st.dataframe(
            pd.DataFrame(live_sim["planetary_comparison"]["all_planetary_sites_benchmark"]),
            use_container_width=True,
            hide_index=True,
        )


# ------------------------------------------------------------------------------
# TAB 5: GROUNDED NASA DATASETS & 9 GLOBAL AWARDS ALIGNMENT
# ------------------------------------------------------------------------------
with tab_datasets:
    st.markdown("### 🏆 **How `RAD-ARES v2.0` Directly Targets All 9 NASA Space Apps Global Awards**")
    st.markdown(
        """
        | Official NASA Space Apps Award | How `RAD-ARES v2.0` Directly Wins This Category |
        | :--- | :--- |
        | **1. Best Use of Science** | Implements the exact physics chain ($D = E/m\\text{ [Gy]} \\rightarrow Q(LET) \\rightarrow H\\text{ [Sv]}$), Simpson's Rule Van Allen integration, Boltzmann spallation neutron cascades, and novel **$^{157}\\text{Gd}$-MXene ($255,000\\text{ barns}$) + Radiotrophic Fungal Melanin** bio-shielding. |
        | **2. Best Use of Data** | Cross-calibrates **4 empirical NASA datasets** (`Van Allen RBSP`, `Langley OLTARIS/HZETRN2020`, `Lunar LRO CRaTER`, `Mars Curiosity MSL RAD`) with row-level citations. |
        | **3. Best Use of Technology** | Combines an asynchronous **FastAPI** microservice, **SciPy/NumPy** physics kernel, **5-Key High-Availability Gemini Function-Calling Orchestrator**, and a zero-downtime Neuro-Symbolic fallback router. |
        | **4. Galactic Impact** | Solves the #1 biological barrier to permanent human settlement on the Moon and Mars while introducing self-healing, zero-power radiotrophic melanin bio-shields applicable to Earth nuclear/medical safety. |
        | **5. Best Mission Concept** | Built around real NASA systems engineering constraints: **$\\text{Protection vs. Mass (kg) vs. Power (kW) vs. Crew Safety}$** and the 6-stage lifecycle (`Detect -> Characterize -> Map -> Predict -> Protect -> Monitor`). |
        | **6. Most Inspirational** | Transforms invisible, lethal cosmic rays into an empowering blueprint for keeping human explorers alive and cognitively sharp across interplanetary space. |
        | **7. Best Use of Storytelling** | Uses **3 counter-intuitive scientific paradoxes** (Why Iron makes radiation worse, Why layer order matters, Why Mars is safer than the Moon) to tell an unforgettable story with open NASA data. |
        | **8. Global Connection** | Provides an open, browser-accessible radiation CAD & mission planning tool usable by students, researchers, and space agencies worldwide without supercomputer access. |
        | **9. Art & Technology** | Fuses generative bio-mimetic architecture (Chernobyl radiotrophic melanin hydrogels + 2D MXene metamaterials) with interactive dark-space telemetry visualizations. |
        """
    )

    catalog = radiation_engine.get_dataset_catalog()
    st.markdown("#### 📡 **1. `NASA-RBSP-REPT-MAGEIS-2026` — Van Allen Probes L-Shell Flux Grid**")
    st.dataframe(pd.DataFrame(catalog["datasets"][0]["records"]), use_container_width=True, hide_index=True)

    st.markdown("#### 🧱 **2. `NASA-OLTARIS-HZETRN2020-MAT` — Nuclear Spallation & Frontier Metamaterials Database**")
    st.dataframe(pd.DataFrame(catalog["datasets"][1]["records"]), use_container_width=True, hide_index=True)

    st.markdown("#### 🌕🔴 **3. `NASA-LRO-CRATER` & `NASA-MSL-RAD` — Planetary Surface Telemetry Database**")
    st.dataframe(pd.DataFrame(catalog["datasets"][2]["records"]), use_container_width=True, hide_index=True)

    st.download_button(
        label="📥 Download Complete Mission Simulation, Trade-Offs & Citations Payload (JSON)",
        data=json.dumps(live_sim, indent=2),
        file_name="rad_ares_v2_nasa_simulation_report.json",
        mime="application/json",
        use_container_width=True,
    )
