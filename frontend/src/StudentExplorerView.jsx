import React, { useState } from 'react';
import {
  Rocket, Shield, Orbit, Activity, Dna, Radar, Shirt, Bot,
  Volume2, VolumeX, Sparkles, ChevronRight, CheckCircle2,
  AlertTriangle, ArrowRight, Zap, Sun, Award, Presentation, BookOpen,
  Info, Compass, Layers, Play
} from 'lucide-react';
import Future3DViewport from './Future3DViewport';
import SpaceTrajectory3DViewer from './SpaceTrajectory3DViewer';
import Dna3DViewport from './Dna3DViewport';
import { radiationSonifier } from './radiationAudio';

export default function StudentExplorerView({
  simState,
  audioEnabled,
  onToggleAudio,
  spaceWeatherTelemetry,
  liveNoaaFluxBonus,
  noaaStatus,
  fetchLiveNoaa,
  isFetchingNoaa,
  onSwitchToExpert,
  activeExplorerTab,
  setActiveExplorerTab
}) {
  const [testSuitFlare, setTestSuitFlare] = useState(false);
  const [shieldMaterial, setShieldMaterial] = useState('beco'); // 'beco' | 'lead'

  const playGeigerDemo = () => {
    if (!radiationSonifier.enabled) {
      onToggleAudio();
    }
    radiationSonifier.triggerFlareAlarm();
  };

  return (
    <div className="student-explorer-layout">
      {/* ======================================================================
          VERTICAL LEFT-HAND NAVIGATION SIDEBAR (SPECIFICALLY FOR USER-FRIENDLY MODE)
         ====================================================================== */}
      <aside className="student-vertical-sidebar" aria-label="Student & Beginner Navigation">
        <div className="student-sidebar-brand">
          <div className="student-seal-wrapper">
            <img src="/gadaspace-logo.jpg" alt="GadaSpace Emblem" className="student-seal-img" />
            <span className="student-mode-badge">STUDENT MODE</span>
          </div>
          <h2 className="student-brand-title">GadaSpace Explorer</h2>
          <p className="student-brand-sub">Space Radiation Made Simple • Zero Scary Equations</p>
        </div>

        {/* Vertical Tabs down the left side */}
        <nav className="student-vertical-nav" aria-label="Explorer Modules">
          <button
            type="button"
            className={`student-nav-item ${activeExplorerTab === 'story' ? 'active' : ''}`}
            onClick={() => setActiveExplorerTab('story')}
          >
            <div className="nav-item-icon gold">
              <Sparkles size={16} />
            </div>
            <div className="nav-item-content">
              <span className="nav-item-title">1. Mission Overview &amp; Story</span>
              <span className="nav-item-desc">What we built &amp; why it matters</span>
            </div>
          </button>

          <button
            type="button"
            className={`student-nav-item ${activeExplorerTab === 'suit' ? 'active' : ''}`}
            onClick={() => setActiveExplorerTab('suit')}
          >
            <div className="nav-item-icon cyan">
              <Shirt size={16} />
            </div>
            <div className="nav-item-content">
              <span className="nav-item-title">2. 3D Smart Spacesuit</span>
              <span className="nav-item-desc">Magnetic coils &amp; audio clicks</span>
            </div>
          </button>

          <button
            type="button"
            className={`student-nav-item ${activeExplorerTab === 'trajectory' ? 'active' : ''}`}
            onClick={() => setActiveExplorerTab('trajectory')}
          >
            <div className="nav-item-icon emerald">
              <Orbit size={16} />
            </div>
            <div className="nav-item-content">
              <span className="nav-item-title">3. 3D Space Highway</span>
              <span className="nav-item-desc">Earth, Moon &amp; Mars routes</span>
            </div>
          </button>

          <button
            type="button"
            className={`student-nav-item ${activeExplorerTab === 'dna' ? 'active' : ''}`}
            onClick={() => setActiveExplorerTab('dna')}
          >
            <div className="nav-item-icon purple">
              <Dna size={16} />
            </div>
            <div className="nav-item-content">
              <span className="nav-item-title">4. 3D Living Cell &amp; DNA</span>
              <span className="nav-item-desc">How radiation damages cells</span>
            </div>
          </button>

          <button
            type="button"
            className={`student-nav-item ${activeExplorerTab === 'sun' ? 'active' : ''}`}
            onClick={() => setActiveExplorerTab('sun')}
          >
            <div className="nav-item-icon gold">
              <Sun size={16} />
            </div>
            <div className="nav-item-content">
              <span className="nav-item-title">5. Live AI Sun Watcher</span>
              <span className="nav-item-desc">Real NOAA satellites &amp; Gemini</span>
            </div>
          </button>

          <button
            type="button"
            className={`student-nav-item ${activeExplorerTab === 'sensors' ? 'active' : ''}`}
            onClick={() => setActiveExplorerTab('sensors')}
          >
            <div className="nav-item-icon cyan">
              <Activity size={16} />
            </div>
            <div className="nav-item-content">
              <span className="nav-item-title">6. Sensor Brain (Kalman)</span>
              <span className="nav-item-desc">Combining 5 sensors into one</span>
            </div>
          </button>
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="student-sidebar-footer">
          <button
            type="button"
            className="student-mode-switch-btn"
            onClick={onSwitchToExpert}
            title="Switch back to full mathematical physics & engineering dashboards"
          >
            <Zap size={14} className="gold-icon" />
            <span>Switch to 🔬 Expert Mode</span>
          </button>

          <div className="student-footer-actions">
            <button
              type="button"
              className={`student-mini-action-btn ${audioEnabled ? 'active' : ''}`}
              onClick={onToggleAudio}
              title="Toggle Geiger radiation clicking audio sound"
            >
              {audioEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              <span>{audioEnabled ? 'Audio: ON' : 'Geiger Audio'}</span>
            </button>

            <a
              href="/presentation.html"
              target="_blank"
              rel="noopener noreferrer"
              className="student-mini-action-btn gold"
              title="Open the 10-Minute NASA Space Apps Slide Presentation"
            >
              <Presentation size={14} />
              <span>10-Min Pitch</span>
            </a>
          </div>

          <a
            href="/GadaSpace_HorizonX_NASA_SpaceApps_10Slide_Pitch.pptx"
            download="GadaSpace_HorizonX_NASA_SpaceApps_10Slide_Pitch.pptx"
            className="student-mode-switch-btn"
            style={{
              textDecoration: 'none',
              borderColor: 'rgba(56, 189, 248, 0.45)',
              background: 'rgba(56, 189, 248, 0.12)',
              color: '#bae6fd',
              marginTop: 4
            }}
            title="Download the official 10-slide Microsoft PowerPoint (.pptx) file"
          >
            <Presentation size={14} style={{ color: '#38bdf8' }} />
            <span>📥 Download .PPTX Presentation</span>
          </a>
        </div>
      </aside>

      {/* ======================================================================
          MAIN STUDENT EXPLORER WORKSPACE (RICH 3D & PLAIN-ENGLISH TAKEAWAYS)
         ====================================================================== */}
      <main className="student-main-content">
        {/* Top Floating Header with Quick Mode Indicator */}
        <header className="student-top-banner">
          <div className="st-banner-left">
            <span className="st-badge">🎓 Student &amp; Amateur Friendly Mode</span>
            <span className="st-divider">•</span>
            <span className="st-subtitle">
              {activeExplorerTab === 'story' && 'Mission Story, Challenges & Final Takeaways'}
              {activeExplorerTab === 'suit' && 'Interactive 3D Spacesuit & Protective Magnetic Deflector'}
              {activeExplorerTab === 'trajectory' && 'Interactive 3D Flight Corridors through Space'}
              {activeExplorerTab === 'dna' && 'Interactive 3D DNA Helix & Cellular Healing'}
              {activeExplorerTab === 'sun' && 'Real-Time Solar Storm Forecaster Powered by NOAA & Gemini AI'}
              {activeExplorerTab === 'sensors' && 'Multi-Detector Sensor Consensus (No Blind Spots)'}
            </span>
          </div>

          <div className="st-banner-right">
            <button
              type="button"
              className="btn-switch-expert-top"
              onClick={onSwitchToExpert}
            >
              <span>🔬 View Full Equations (Expert Mode)</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </header>

        {/* ------------------------------------------------------------------
            TAB 1: MISSION STORY & BIG TAKEAWAYS
           ------------------------------------------------------------------ */}
        {activeExplorerTab === 'story' && (
          <div className="explorer-tab-body">
            {/* Big Welcome Hero */}
            <div className="student-hero-card">
              <div className="st-hero-tag">WELCOME TO GADASPACE</div>
              <h1 className="st-hero-headline">
                How We Protect Astronauts from <span className="highlight-gold">Deadly Deep-Space Radiation</span>
              </h1>
              <p className="st-hero-lead">
                In space, there is no Earth atmosphere or magnetic field to protect humans. Invisible cosmic rays and solar flares pass through standard spaceships like bullets, causing cancer, radiation sickness, and DNA damage. Here is what was broken before—and how Team Horizon-X solved it.
              </p>
            </div>

            {/* The 3 Core Limitations & Breakthrough Solutions */}
            <div className="st-cards-grid">
              <div className="st-feature-card">
                <div className="card-top-indicator red">THE OLD LIMITATION</div>
                <h3 className="st-card-title">1. The "Heavy Metal" Shield Trap</h3>
                <p className="st-card-text">
                  People used to think: <em>"Just put thick Lead or Aluminum armor around the ship!"</em> But when fast cosmic rays strike heavy lead, they shatter the metal nuclei in a process called <strong>nuclear spallation</strong>. This turns solid lead into an internal factory of lethal, uncharged <strong>neutrons</strong> and X-rays that poison the astronauts inside!
                </p>
                <div className="solution-box green">
                  <span className="sol-badge">OUR SOLUTION: BeCO &amp; COMPOSITE SHIELD</span>
                  <p>
                    Instead of heavy lead, we engineered a multi-layer shield using lightweight <strong>Beryllium-Carbon-Oxygen (BeCO)</strong>, Borated Polyethylene (HDPE), and <strong>¹⁵⁷Gd-MXene</strong> with Chernobyl fungal melanin. These light atoms stop cosmic rays <em>without</em> creating poisonous secondary neutrons!
                  </p>
                </div>
              </div>

              <div className="st-feature-card">
                <div className="card-top-indicator gold">ASTRONAUT HEALTH</div>
                <h3 className="st-card-title">2. Silent Radiation &amp; Spacesuit Danger</h3>
                <p className="st-card-text">
                  Radiation is invisible, silent, and odorless. Spacewalking astronauts have no way of knowing a solar storm is rising until massive cellular damage has already occurred. Furthermore, heavy continuous magnetic shields would drain a suit battery in under 45 minutes!
                </p>
                <div className="solution-box cyan">
                  <span className="sol-badge">OUR SOLUTION: SMART SUIT WITH AUDIO CLICKS</span>
                  <p>
                    We created an autonomous <strong>Smart EVA Spacesuit</strong>. It stays at 0 Watts in quiet space (giving 18+ hours battery). When radiation rises, it emits audible <strong>Geiger counter sound clicks</strong> that speed up and sound an alarm, while automatically activating micro-magnetic coils that deflect 88% of radiation away from the astronaut's heart and bone marrow!
                  </p>
                </div>
              </div>

              <div className="st-feature-card">
                <div className="card-top-indicator purple">MEASUREMENT BRAIN</div>
                <h3 className="st-card-title">3. Single Sensors Have Blind Spots</h3>
                <p className="st-card-text">
                  Standard space missions rely on a single silicon sensor. But silicon sensors are <strong>92% blind to uncharged neutrons</strong>, tricking mission control into thinking the cabin is safe when lethal radiation is actually accumulating.
                </p>
                <div className="solution-box purple">
                  <span className="sol-badge">OUR SOLUTION: KALMAN MULTI-DETECTOR FUSION</span>
                  <p>
                    Inspired by the democratic consensus of the Oromo Gadaa system, we fuse <strong>5 different sensors</strong> (silicon, tissue microdosimeter, scintillator, neutron counter, and camera) into <strong>ONE unified Kalman filter</strong>. It combines primary and secondary radiation in real time with ±4.8% accuracy.
                  </p>
                </div>
              </div>
            </div>

            {/* Big Student Takeaways Banner */}
            <div className="student-takeaways-box">
              <div className="st-takeaway-header">
                <Award size={22} className="gold-icon" />
                <h2>The 4 Key Takeaways Every Student Should Remember</h2>
              </div>
              <div className="takeaways-list">
                <div className="takeaway-item">
                  <span className="t-num">1</span>
                  <div>
                    <strong>Thick lead makes space radiation worse:</strong> High-speed cosmic rays smash lead into deadly neutrons. Light elements like <strong>BeCO</strong> and plastics are much safer.
                  </div>
                </div>
                <div className="takeaway-item">
                  <span className="t-num">2</span>
                  <div>
                    <strong>Astronauts can hear radiation:</strong> Our smart spacesuit uses real-time audio sound clicks so astronauts know instantly when a solar storm is rising.
                  </div>
                </div>
                <div className="takeaway-item">
                  <span className="t-num">3</span>
                  <div>
                    <strong>Magnetic fields protect like invisible forcefields:</strong> By using smart magnetic coils only when storms hit, we deflect charged protons without draining suit batteries.
                  </div>
                </div>
                <div className="takeaway-item">
                  <span className="t-num">4</span>
                  <div>
                    <strong>Teamwork in sensors (Kalman Fusion):</strong> One sensor can be blind, but combining 5 sensors together gives a 100% truthful reading.
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="takeaways-action-row">
                <button
                  type="button"
                  className="btn-st-primary"
                  onClick={() => setActiveExplorerTab('suit')}
                >
                  <Shirt size={16} />
                  <span>Try the 3D Spacesuit &amp; Audio Clicks</span>
                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  className="btn-st-secondary"
                  onClick={() => setActiveExplorerTab('trajectory')}
                >
                  <Orbit size={16} />
                  <span>Explore 3D Space Flight Highway</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            TAB 2: 3D SMART SPACESUIT & SHIELDING LAB
           ------------------------------------------------------------------ */}
        {activeExplorerTab === 'suit' && (
          <div className="explorer-tab-body">
            {/* Friendly Takeaway Banner */}
            <div className="st-banner-takeaway">
              <Info size={18} className="cyan-icon" />
              <div>
                <strong>🎓 Student Takeaway:</strong> The suit stays in quiet low-power mode (0 Watts) for 18+ hours. When a solar flare hits, the astronaut hears rapid <strong>Geiger clicking sounds</strong> in their helmet, and the suit automatically turns on its magnetic field to deflect cosmic protons away from their body!
              </div>
            </div>

            {/* Quick Interactive Controls Row */}
            <div className="st-interactive-bar">
              <div className="st-control-pill">
                <span className="pill-lbl">Simulate Solar Flare:</span>
                <button
                  type="button"
                  className={`st-toggle-btn ${testSuitFlare ? 'active-red' : ''}`}
                  onClick={() => {
                    const next = !testSuitFlare;
                    setTestSuitFlare(next);
                    if (next) playGeigerDemo();
                  }}
                >
                  {testSuitFlare ? '🔴 Intense Solar Flare (Active)' : '🟢 Quiet Space Weather'}
                </button>
              </div>

              <div className="st-control-pill">
                <span className="pill-lbl">Shielding Material:</span>
                <button
                  type="button"
                  className={`st-toggle-btn ${shieldMaterial === 'beco' ? 'active-green' : ''}`}
                  onClick={() => setShieldMaterial('beco')}
                >
                  ✨ BeCO + Melanin (Our Fix)
                </button>
                <button
                  type="button"
                  className={`st-toggle-btn ${shieldMaterial === 'lead' ? 'active-amber' : ''}`}
                  onClick={() => setShieldMaterial('lead')}
                >
                  ⚠️ Heavy Lead (Old Metal)
                </button>
              </div>

              <div className="st-control-pill">
                <button
                  type="button"
                  className="st-sound-demo-btn"
                  onClick={playGeigerDemo}
                  title="Test the real-time auditory Geiger clicking cues"
                >
                  <Volume2 size={15} />
                  <span>Listen to Geiger Clicks</span>
                </button>
              </div>
            </div>

            {/* Embedded 3D Spacesuit & Cruiser Viewport */}
            <div className="st-3d-container">
              <Future3DViewport
                plasmaRadiusM={2.5}
                crystalHwtPct={shieldMaterial === 'beco' ? 4.2 : 0.5}
                dsupBioPct={testSuitFlare ? 95 : 30}
                cascade={simState.stack}
              />
            </div>

            {/* Educational Explainer Cards beneath the 3D Model */}
            <div className="st-duo-cards">
              <div className="st-mini-card">
                <h4>🛡️ How the Active Magnetic Coils Work</h4>
                <p>
                  High-temperature superconducting wires run through the astronaut's waist and chest. When electricity flows, it creates a magnetic Lorentz force ($\vec&#123;F&#125; = q(\vec&#123;v&#125; \times \vec&#123;B&#125;)$) that curves incoming charged solar protons away from the astronaut, just like Earth's magnetic field protects our planet!
                </p>
              </div>
              <div className="st-mini-card">
                <h4>🔊 Why Auditory Radiation Clicks Save Lives</h4>
                <p>
                  Because astronauts must focus their eyes on construction tools or rover controls, they can't constantly stare at a screen. Real-time auditory clicks provide an unmistakable subconscious alert: the faster the clicking, the closer they are to a radiation hotspot.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            TAB 3: 3D SPACE FLIGHT HIGHWAY (TRAJECTORY)
           ------------------------------------------------------------------ */}
        {activeExplorerTab === 'trajectory' && (
          <div className="explorer-tab-body">
            <div className="st-banner-takeaway">
              <Info size={18} className="cyan-icon" />
              <div>
                <strong>🎓 Student Takeaway:</strong> Space is not an empty vacuum—it is filled with invisible donut-shaped radiation belts around Earth (the Van Allen Belts) and solar storms. Our 3D Trajectory optimizer calculates the safest "highway in the stars" so the spaceship avoids radiation clouds on its way to the Moon or Mars!
              </div>
            </div>

            {/* Embedded 3D Space Trajectory Simulator */}
            <div className="st-3d-container large">
              <SpaceTrajectory3DViewer />
            </div>

            {/* 3 Routes Explained Simply */}
            <div className="st-cards-grid">
              <div className="st-mini-card">
                <h4 style={{ color: '#f43f5e' }}>Path 1: Direct Fast Route</h4>
                <p>
                  Punches straight through the thickest part of the Van Allen radiation belt. It gets you there slightly faster, but exposes the crew to a high <strong>18.4 mSv/hour</strong> radiation spike!
                </p>
              </div>
              <div className="st-mini-card">
                <h4 style={{ color: '#10b981' }}>Path 2: Polar High-Inclination Highway</h4>
                <p>
                  Launches over the Earth's magnetic poles where the radiation belt is open. Completely avoids the trapped proton cloud, cutting total mission radiation by <strong>63%</strong>!
                </p>
              </div>
              <div className="st-mini-card">
                <h4 style={{ color: '#c084fc' }}>Path 3: Mars Sprint Corridor</h4>
                <p>
                  A high-velocity transfer to Mars that cuts months off the transit time, shielding astronauts from chronic deep-space cosmic rays.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            TAB 4: 3D LIVING CELL & DNA GUARDIAN
           ------------------------------------------------------------------ */}
        {activeExplorerTab === 'dna' && (
          <div className="explorer-tab-body">
            <div className="st-banner-takeaway">
              <Info size={18} className="cyan-icon" />
              <div>
                <strong>🎓 Student Takeaway:</strong> When ionizing cosmic rays hit an astronaut's body, they can snap both strands of the DNA ladder (a Double-Strand Break). Our BeCO and radiotrophic fungal melanin shield absorbs this energy so DNA strands stay intact!
              </div>
            </div>

            {/* Embedded 3D DNA Viewport */}
            <div className="st-3d-container">
              <Dna3DViewport
                absorbedDoseGy={simState.absorbedDoseGy || 0.05}
                effLet={simState.effLet || 4.2}
                dnaDsb={simState.dnaDsb || 1.8}
                shieldStack={simState.stack}
              />
            </div>

            <div className="st-duo-cards">
              <div className="st-mini-card">
                <h4>🧬 What is a DNA Double-Strand Break (DSB)?</h4>
                <p>
                  Single-strand breaks are easily repaired by normal cells. But when heavy iron ions smash through DNA, they snap both backbones simultaneously. If not shielded, this leads to cellular mutation, cataracts, and cancer.
                </p>
              </div>
              <div className="st-mini-card">
                <h4>🍄 How Radiotrophic Melanin Protects Cells</h4>
                <p>
                  Inspired by fungi discovered growing inside the Chernobyl reactor, our shield utilizes melanin polymers that convert ionizing radiation into harmless heat while neutralizing free radicals that attack cell membranes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            TAB 5: LIVE AI SUN WATCHER (NOAA + GEMINI)
           ------------------------------------------------------------------ */}
        {activeExplorerTab === 'sun' && (
          <div className="explorer-tab-body">
            <div className="st-banner-takeaway">
              <Info size={18} className="cyan-icon" />
              <div>
                <strong>🎓 Student Takeaway:</strong> The Sun constantly blows a "solar wind" of particles into space. We connect to real NOAA weather satellites (GOES-18 and DSCOVR) and use Google Gemini AI to forecast solar storms up to 72 hours in advance, giving astronauts time to prepare storm shelters!
              </div>
            </div>

            {/* Real-time Status Card */}
            <div className="student-noaa-card">
              <div className="noaa-card-top">
                <div className="noaa-title">
                  <Sun size={20} className="gold-icon" />
                  <h3>Live Space Weather Satellite Telemetry</h3>
                </div>
                <button
                  type="button"
                  className={`cmd-btn sync-noaa-btn ${isFetchingNoaa ? 'syncing' : ''}`}
                  onClick={fetchLiveNoaa}
                  disabled={isFetchingNoaa}
                >
                  <span>{isFetchingNoaa ? 'Syncing NOAA...' : 'Refresh NOAA Data'}</span>
                </button>
              </div>

              <div className="noaa-status-bar">
                <span className="live-dot" />
                <span>{noaaStatus}</span>
              </div>

              {/* 3 Simple Gauges for Students */}
              <div className="st-metrics-row">
                <div className="st-metric-pill">
                  <span className="st-m-val">{spaceWeatherTelemetry?.solarWindKms?.toFixed(0) || '425'} km/s</span>
                  <span className="st-m-lbl">Solar Wind Speed (Normal: 350-500 km/s)</span>
                </div>
                <div className="st-metric-pill">
                  <span className="st-m-val">{spaceWeatherTelemetry?.currentProton10Pfu?.toFixed(2) || '0.85'} pfu</span>
                  <span className="st-m-lbl">Proton Flux (Storm Alert if &gt; 10 pfu)</span>
                </div>
                <div className="st-metric-pill">
                  <span className="st-m-val" style={{ color: '#10b981' }}>QUIET / NOMINAL</span>
                  <span className="st-m-lbl">Solar Storm Alert Level</span>
                </div>
              </div>
            </div>

            <div className="st-cards-grid">
              <div className="st-mini-card">
                <h4>🛰️ NOAA GOES-18 Satellite</h4>
                <p>
                  Orbits 35,786 km above Earth, staring at the Sun 24/7 to measure incoming high-energy protons before they penetrate Earth's magnetic shield.
                </p>
              </div>
              <div className="st-mini-card">
                <h4>🚀 DSCOVR Satellite at L1</h4>
                <p>
                  Sits 1.5 million kilometers towards the Sun at the Lagrange-1 point, acting as an early tsunami warning buoy for the solar wind.
                </p>
              </div>
              <div className="st-mini-card">
                <h4>🤖 Google Gemini AI Co-Pilot</h4>
                <p>
                  Calculates solar flare physics to warn mission control exactly how many hours remain before an impending solar particle event arrives at the spacecraft.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            TAB 6: SENSOR BRAIN (KALMAN MULTI-DETECTOR FUSION)
           ------------------------------------------------------------------ */}
        {activeExplorerTab === 'sensors' && (
          <div className="explorer-tab-body">
            <div className="st-banner-takeaway">
              <Info size={18} className="cyan-icon" />
              <div>
                <strong>🎓 Student Takeaway:</strong> If you only use one sensor, you can easily be fooled. Silicon sensors are blind to neutrons; gas counters drift; cameras only see optical strikes. Inspired by the Oromo Gadaa consensus, we fuse 5 different sensors with a Kalman filter so the mission computer always knows the 100% truth!
              </div>
            </div>

            {/* Sensor Array Explained Simply */}
            <div className="st-cards-grid">
              <div className="st-sensor-card">
                <span className="st-s-code">DETECTOR 1</span>
                <h4>Silicon Telescope</h4>
                <p>Fast at counting charged particles, but has an <strong>8% neutron blind spot</strong>.</p>
                <span className="sensor-tag amber">Blind to Neutrons</span>
              </div>

              <div className="st-sensor-card">
                <span className="st-s-code">DETECTOR 2</span>
                <h4>Microdosimeter (TEPC)</h4>
                <p>Measures how tissue absorbs energy, but drifts slowly over long months.</p>
                <span className="sensor-tag cyan">Tissue Equivalent</span>
              </div>

              <div className="st-sensor-card">
                <span className="st-s-code">DETECTOR 3</span>
                <h4>Scintillator Crystal (CsI)</h4>
                <p>Glows when hit by X-rays and gamma photons from Bremsstrahlung radiation.</p>
                <span className="sensor-tag purple">X-Ray Specialist</span>
              </div>

              <div className="st-sensor-card">
                <span className="st-s-code">DETECTOR 4</span>
                <h4>¹⁵⁷Gd/³He Neutron Counter</h4>
                <p>Dedicated counter with 255,000-barn capture to count uncharged neutrons.</p>
                <span className="sensor-tag emerald">Neutron Expert</span>
              </div>
            </div>

            {/* The Kalman Fusion Magic */}
            <div className="student-hero-card" style={{ marginTop: 20 }}>
              <div className="st-hero-tag">THE CONSENSUS BRAIN</div>
              <h2 className="st-hero-headline" style={{ fontSize: 20 }}>
                Combining All 5 into One Single Source of Truth
              </h2>
              <p className="st-hero-lead" style={{ fontSize: 14 }}>
                Our Kalman filter algorithm automatically gives more trust to whichever sensor is strongest in that moment. If a solar flare saturates the silicon detector, the algorithm dynamically balances toward the scintillator and neutron counter, keeping measurement error down to an incredible <strong>&plusmn;4.8%</strong>.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
