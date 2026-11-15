# 🛰️ RAD-ARES v2.0: Closed-Loop Space Radiation, Bio-Hybrid Shielding & Spacecraft Trade-Off Engine
**2026 NASA Space Apps Challenge Submission**

```
[1. DETECT] ──► [2. CHARACTERIZE] ──► [3. MAP] ──► [4. PREDICT] ──► [5. PROTECT] ──► [6. MONITOR]
```

## 🏆 Executive Summary
**`RAD-ARES v2.0`** is a closed-loop aerospace radiation physics, metamaterial shielding, and human bio-dosimetry engine built to solve the #1 biological bottleneck of NASA's Artemis Lunar Return and Mars architectures.

Rather than optimizing only for raw shielding thickness (which violates spacecraft launch mass budgets), `RAD-ARES v2.0` optimizes the **4-Way Spacecraft Systems Engineering Constraint**:

$$\boxed{\text{Protection (\%)} \quad \text{vs.} \quad \text{Added Mass (kg)} \quad \text{vs.} \quad \text{Electrical Power (kW)} \quad \text{vs.} \quad \text{Crew Safety}}$$

And estimates astronaut radiation exposure and biological risk using NASA's physical-to-biological dosimetry chain:

$$D = \frac{E}{m}\text{ [Gy = J/kg]} \longrightarrow Q(\text{LET}) \longrightarrow H = D \times Q(\text{LET})\text{ [Sv]} \longrightarrow E_{\text{eff}} = \sum w_T H_T$$

---

## 🧬 Our Novel Scientific Breakthrough: The 3-Layer Bio-Hybrid Shield
Standard heavy metals (**Iron $Z=26$**, **Lead $Z=82$**) fail in deep space because relativistic Galactic Cosmic Rays ($^{56}\text{Fe}$ and GeV protons) shatter heavy nuclei via **nuclear spallation**, showering astronauts with lethal **secondary fast neutrons ($n^0$, $Q \approx 10\text{–}20$)** and **Bremsstrahlung X-rays**.

`RAD-ARES v2.0` introduces a novel, non-commutative **3-Stage Bio-Hybrid Graded-$Z$ Architecture**:
1. **Layer 1 — Ultra-Thin High-$Z$ Stripper (`< 1.0 g/cm²` Thin Lead / Al-2219):** Fragments incoming heavy HZE $^{56}\text{Fe}$ ions without thick-target neutron buildup.
2. **Layer 2 — Hydrogenous Elastic-Recoil Moderator (`Polyethylene HDPE` $\text{C}_2\text{H}_4$ + `Potable Water` $\text{H}_2\text{O}$):** Rapidly slows down secondary fast neutrons into thermal neutrons via proton-neutron elastic collisions ($^1\text{H}(n,n)^1\text{H}$).
3. **Layer 3 — Novel Bio-Hybrid Inner Absorber (`¹⁵⁷Gd-Doped Ti₃C₂Tₓ MXene Nanosheet` + `Chernobyl Radiotrophic Fungal Melanin Hydrogel`):**
   - **Gadolinium-157 ($^{157}\text{Gd}$)** possesses the **highest thermal neutron capture cross-section of any stable nuclide ($255,000\text{ barns}$ — $65\times$ higher than Boron-10!)**, swallowing thermalized neutrons in a sub-millimeter 2D MXene lattice.
   - **Radiotrophic Fungal Melanin (*Cryptococcus neoformans*)** absorbs residual Bremsstrahlung X-rays, scavenges ionizing free radicals ($OH^\bullet$), and **self-heals via radiosynthesis at $0\text{ W}$ electrical power**!

---

## 📡 Cross-Calibrated NASA Datasets Used
1. **`NASA-RBSP-REPT-MAGEIS-2026`** — *Van Allen Probes (RBSP-A/B) Relativistic Electron-Proton Telescope (REPT) & MagEIS* ($L = 1.08\text{–}6.64$).
2. **`NASA-OLTARIS-HZETRN2020-MAT`** — *NASA Langley OLTARIS & HZETRN-2020 Nuclear Spallation & Frontier Metamaterials Database*.
3. **`NASA-LRO-CRATER-TEP-2026`** — *Lunar Reconnaissance Orbiter (LRO) Cosmic Ray Telescope for the Effects of Radiation (CRaTER)*.
4. **`NASA-MSL-RAD-GALE-2026`** — *Mars Science Laboratory (Curiosity) Radiation Assessment Detector (MSL-RAD) & MGS MAG/ER Crustal Magnetic Anomalies*.

---

## 🚀 Quickstart & Execution Modes

### Mode 1: Instant Zero-Install Browser Final Demo
Double-click [`index.html`](index.html) to open the interactive Mission Control Dashboard immediately in Chrome, Edge, or Firefox with zero dependencies.

### Mode 2: Python Streamlit + FastAPI Microservice Stack
```bash
pip install -r requirements.txt

# Launch Streamlit Mission Control Dashboard (Standalone or Microservice Client)
streamlit run streamlit_app.py

# Optional: Launch Asynchronous FastAPI Backend (/docs Swagger UI at http://localhost:8000/docs)
uvicorn app.main:app --reload --port 8000
```
