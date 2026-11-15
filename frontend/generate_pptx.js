import pptxgen from 'pptxgenjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.join(__dirname, 'public', 'gadaspace-logo.jpg');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_16x9';
pptx.author = 'Team Horizon-X (Addis Ababa)';
pptx.company = 'NASA International Space Apps Challenge 2026';
pptx.subject = 'GadaSpace 5-Minute Pitch Deck • 10 Slides';
pptx.title = 'GadaSpace • Autonomous Radiation Defense for Artemis & Mars';

// Master Color Palette
const C_BG = '040711';
const C_PANEL = '0B111E';
const C_CARD = '0F172A';
const C_ELEVATED = '111A2D';
const C_STAT_BG = '060A14';
const C_BORDER = '1E293B';
const C_BORDER_LIGHT = '334155';

const C_CYAN = '38BDF8';
const C_GOLD = 'F59E0B';
const C_EMERALD = '10B981';
const C_ROSE = 'F43F5E';
const C_PURPLE = 'C084FC';

const C_TEXT = 'F8FAFC';
const C_TEXT_SUB = 'CBD5E1';
const C_MUTED = '94A3B8';
const C_SCRIPT = 'FDE68A';

/**
 * Creates the standard slide shell: background, top header card, and bottom speaker script drawer.
 */
function createSlideShell({ slideNum, category, timing, pillar, title, subtitle, scriptText }) {
  const slide = pptx.addSlide();
  slide.background = { color: C_BG };

  // ==========================================
  // TOP HEADER PANEL (x: 0.5, y: 0.35, w: 12.33, h: 0.95)
  // ==========================================
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.5, y: 0.32, w: 12.33, h: 0.98, rectRadius: 0.08,
    fill: { color: C_PANEL },
    line: { color: C_BORDER, width: 1 }
  });

  // Slide Number Pill
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.7, y: 0.42, w: 2.6, h: 0.26, rectRadius: 0.05,
    fill: { color: '0A192F' },
    line: { color: C_CYAN, width: 1 }
  });
  slide.addText(`SLIDE ${slideNum} / 10 • ${category}`, {
    x: 0.7, y: 0.42, w: 2.6, h: 0.26,
    fontSize: 9, bold: true, color: C_CYAN, fontFace: 'Segoe UI', align: 'center', valign: 'middle'
  });

  // Pillar Badge
  if (pillar) {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 3.4, y: 0.42, w: 4.8, h: 0.26, rectRadius: 0.05,
      fill: { color: '231805' },
      line: { color: C_GOLD, width: 1 }
    });
    slide.addText(pillar, {
      x: 3.4, y: 0.42, w: 4.8, h: 0.26,
      fontSize: 8.5, bold: true, color: C_GOLD, fontFace: 'Segoe UI', align: 'center', valign: 'middle'
    });
  }

  // Timing Badge (Top-Right)
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 10.43, y: 0.42, w: 2.2, h: 0.26, rectRadius: 0.05,
    fill: { color: '231805' },
    line: { color: C_GOLD, width: 1 }
  });
  slide.addText(`⏱ ${timing}`, {
    x: 10.43, y: 0.42, w: 2.2, h: 0.26,
    fontSize: 9, bold: true, color: C_GOLD, fontFace: 'Consolas', align: 'center', valign: 'middle'
  });

  // Slide Title
  slide.addText(title, {
    x: 0.7, y: 0.72, w: 10.0, h: 0.32,
    fontSize: 16.5, bold: true, color: C_TEXT, fontFace: 'Segoe UI', valign: 'middle'
  });

  // Slide Subtitle
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.7, y: 1.02, w: 11.8, h: 0.22,
      fontSize: 9.5, italic: true, color: C_MUTED, fontFace: 'Segoe UI', valign: 'top'
    });
  }

  // ==========================================
  // BOTTOM SPEAKER NOTES DRAWER (x: 0.5, y: 6.55, w: 12.33, h: 0.65)
  // ==========================================
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.5, y: 6.55, w: 12.33, h: 0.65, rectRadius: 0.06,
    fill: { color: C_STAT_BG },
    line: { color: C_GOLD, width: 1, dashType: 'dash' }
  });

  slide.addText([
    { text: '🎙️ SPEAKER SCRIPT (30s): ', options: { bold: true, color: C_GOLD, fontSize: 9, fontFace: 'Segoe UI' } },
    { text: scriptText, options: { color: C_SCRIPT, fontSize: 8.8, fontFace: 'Segoe UI' } }
  ], {
    x: 0.65, y: 6.58, w: 12.0, h: 0.58,
    valign: 'middle'
  });

  // Also attach native PowerPoint presenter notes
  slide.addNotes(scriptText);

  return slide;
}

/**
 * Adds a modern card with a solid left accent border (simulating border-left: 4px solid ...).
 */
function addAccentCard(slide, { x, y, w, h, accentColor, title, fill = C_CARD }) {
  // Main Card Body
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.08,
    fill: { color: fill },
    line: { color: C_BORDER, width: 1 }
  });

  // Left Accent Stripe
  slide.addShape(pptx.ShapeType.rect, {
    x, y: y + 0.05, w: 0.09, h: h - 0.1,
    fill: { color: accentColor },
    line: { color: accentColor, width: 0 }
  });

  // Card Title
  if (title) {
    slide.addText(title, {
      x: x + 0.25, y: y + 0.12, w: w - 0.4, h: 0.32,
      fontSize: 12, bold: true, color: accentColor, fontFace: 'Segoe UI'
    });
  }
}

/**
 * Adds a stat / metric box with bold value, label, and optional subtext.
 */
function addMetricBox(slide, { x, y, w, h, val, lbl, sub, color = C_CYAN }) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.08,
    fill: { color: C_STAT_BG },
    line: { color: C_BORDER, width: 1 }
  });

  slide.addText(val, {
    x: x + 0.05, y: y + 0.08, w: w - 0.1, h: 0.48,
    fontSize: 23, bold: true, color, fontFace: 'Consolas', align: 'center', valign: 'middle'
  });

  slide.addText(lbl, {
    x: x + 0.08, y: y + 0.58, w: w - 0.16, h: 0.32,
    fontSize: 9.5, bold: true, color: C_TEXT, fontFace: 'Segoe UI', align: 'center', valign: 'top'
  });

  if (sub) {
    slide.addText(sub, {
      x: x + 0.08, y: y + 0.88, w: w - 0.16, h: 0.28,
      fontSize: 8.5, color: C_MUTED, fontFace: 'Segoe UI', align: 'center', valign: 'top'
    });
  }
}

// =========================================================================
// SLIDE 1: INTRODUCTION & MISSION MANDATE
// =========================================================================
{
  const s1 = createSlideShell({
    slideNum: '01',
    category: 'INTRODUCTION',
    timing: '0:00 – 0:30 (30s)',
    pillar: '5-MINUTE PITCH • PILLAR 1: IMPACT',
    title: 'GadaSpace • Team Horizon-X: Autonomous Radiation Defense',
    subtitle: 'Where Ancient Gadaa Consensus Meets Interplanetary Nanomaterials & AI Heliophysics',
    scriptText: '"Judges, distinguished mentors: Welcome. During Apollo 16 and 17, an extreme solar proton storm erupted between missions that would have delivered a lethal 4.0-Sievert dose on the lunar surface. Today, for 30-day Artemis surface stays and 900-day voyages to Mars, luck is no longer an engineering strategy. Deep-space radiation is the number-one biological bottleneck to human exploration. We are Team Horizon-X, and this is GadaSpace—an autonomous multi-tier platform built to keep astronauts alive."'
  });

  // Left Column (w: 5.4, x: 0.5): Logo Medallion + Deep Space Mandate
  addAccentCard(s1, {
    x: 0.5, y: 1.45, w: 5.4, h: 4.95,
    accentColor: C_CYAN,
    title: '🚀 THE DEEP SPACE EXPLORATION MANDATE'
  });

  // Logo Medallion Centerpiece
  if (fs.existsSync(logoPath)) {
    s1.addImage({
      path: logoPath,
      x: 2.3, y: 1.9, w: 1.8, h: 1.8
    });
  }
  s1.addText('NASA International Space Apps Challenge 2026', {
    x: 0.7, y: 3.75, w: 5.0, h: 0.3,
    fontSize: 11, bold: true, color: C_TEXT, fontFace: 'Segoe UI', align: 'center'
  });
  s1.addText('ADDIS ABABA, ETHIOPIA • TEAM HORIZON-X', {
    x: 0.7, y: 4.05, w: 5.0, h: 0.25,
    fontSize: 9.5, bold: true, color: C_CYAN, fontFace: 'Consolas', align: 'center'
  });

  s1.addText([
    { text: 'During Apollo 16 & 17, an extreme solar storm would have delivered a lethal 4.0 Sv dose on the Moon. Today, for 30-day Artemis stays and 900-day Mars voyages, ', options: { fontSize: 10, color: C_TEXT_SUB } },
    { text: 'luck is not an engineering plan.\n\n', options: { fontSize: 10, bold: true, color: C_GOLD } },
    { text: 'GadaSpace unites advanced low-Z composite shielding (BeCO), active superconducting magnetic deflection, a digital smart EVA suit with real-time audio cues, Kalman sensor fusion, and Gemini AI orbital prediction.', options: { fontSize: 9.5, color: C_MUTED } }
  ], {
    x: 0.75, y: 4.38, w: 4.9, h: 1.85,
    fontFace: 'Segoe UI'
  });

  // Right Column (w: 6.6, x: 6.2): 3 Quantitative Benchmarks + Platform Pillars Card
  const metricsS1 = [
    { val: '1,200 mSv', lbl: 'Unshielded Mars Dose', sub: 'Lethal without shielding', color: C_ROSE, x: 6.2 },
    { val: '600 mSv', lbl: 'NASA Career PEL Ceiling', sub: 'Universal astronaut lifetime limit', color: C_GOLD, x: 8.45 },
    { val: '432 mSv', lbl: 'GadaSpace Shielded Dose', sub: '100% compliant with NASA limits', color: C_EMERALD, x: 10.7 }
  ];
  metricsS1.forEach(m => {
    addMetricBox(s1, {
      x: m.x, y: 1.45, w: 2.1, h: 1.25,
      val: m.val, lbl: m.lbl, sub: m.sub, color: m.color
    });
  });

  // Right Platform Overview Card
  addAccentCard(s1, {
    x: 6.2, y: 2.85, w: 6.63, h: 3.55,
    accentColor: C_GOLD,
    title: '🌟 COMPLETE MULTI-TIER DEFENSE ARCHITECTURE'
  });

  s1.addText([
    { text: '1. Advanced Low-Z & BeCO Composites: ', options: { fontSize: 10.5, bold: true, color: C_CYAN } },
    { text: 'Lightweight atoms (Z=4, 6, 8) and ¹⁵⁷Gd-MXene swallow incoming cosmic rays without secondary neutron spallation.\n\n', options: { fontSize: 9.5, color: C_TEXT_SUB } },
    { text: '2. Active 3.5-Tesla Superconducting Magnet: ', options: { fontSize: 10.5, bold: true, color: C_PURPLE } },
    { text: 'Lorentz deflection F = q(v × B) with 0-Watt quiet standby power, spooling up in milliseconds during solar flare spikes.\n\n', options: { fontSize: 9.5, color: C_TEXT_SUB } },
    { text: '3. Recreated Smart EVA Spacesuit: ', options: { fontSize: 10.5, bold: true, color: C_GOLD } },
    { text: 'Real-time Web Audio Geiger clicking sound cues in the helmet + wearable micro-HTS coils protecting bone marrow.\n\n', options: { fontSize: 9.5, color: C_TEXT_SUB } },
    { text: '4. Kalman Sensor Fusion & Google Gemini AI: ', options: { fontSize: 10.5, bold: true, color: C_EMERALD } },
    { text: 'Fuses 5 detectors into one truth (±4.8% RMSE) and provides 42 min to 2.5 hours advance Parker Spiral warning.', options: { fontSize: 9.5, color: C_TEXT_SUB } }
  ], {
    x: 6.45, y: 3.25, w: 6.2, h: 3.0,
    fontFace: 'Segoe UI'
  });
}

// =========================================================================
// SLIDE 2: THE PROBLEM & LEAD SPALLATION PARADOX
// =========================================================================
{
  const s2 = createSlideShell({
    slideNum: '02',
    category: 'THE PROBLEM',
    timing: '0:30 – 1:00 (30s)',
    pillar: 'PILLAR 1: IMPACT & PROBLEM ANALYSIS',
    title: 'The Problem & The Deadly "Lead Spallation Trap"',
    subtitle: 'Why traditional heavy metallic shields create secondary radiation cascades inside spacecraft',
    scriptText: '"Let us dismantle the biggest myth in aerospace shielding: adding heavy metal armor like lead. In deep space, relativistic cosmic ray iron nuclei strike heavy lead hulls, triggering nuclear spallation. The lead atoms shatter into clouds of secondary fast neutrons. Because neutrons carry a biological damage factor up to 20, adding lead actually increases the radiation dose inside the cabin! Furthermore, standard silicon sensors are 92% blind to these neutrons, tricking flight controllers into believing astronauts are safe."'
  });

  // Left Column: Spallation Paradox Box
  addAccentCard(s2, {
    x: 0.5, y: 1.45, w: 5.9, h: 4.95,
    accentColor: C_ROSE,
    title: '⚠️ THE NUCLEAR SPALLATION PARADOX'
  });

  s2.addText([
    { text: 'Conventional aerospace intuition assumes:\n', options: { fontSize: 10, italic: true, color: C_MUTED } },
    { text: '"Heavier metal like Lead (Pb, Z=82) or Aluminum provides more safety."\n\n', options: { fontSize: 10.5, bold: true, color: C_TEXT } },
    { text: 'In deep space, this assumption is catastrophic. Relativistic Galactic Cosmic Rays (GeV ⁵⁶Fe iron nuclei) strike dense lead atomic nuclei, shattering them via ', options: { fontSize: 10, color: C_TEXT_SUB } },
    { text: 'nuclear spallation.\n\n', options: { fontSize: 10.5, bold: true, color: C_ROSE } }
  ], { x: 0.75, y: 1.85, w: 5.4, h: 1.35, fontFace: 'Segoe UI' });

  // Callout Box inside Card
  s2.addShape(pptx.ShapeType.roundRect, {
    x: 0.75, y: 3.2, w: 5.4, h: 1.35, rectRadius: 0.06,
    fill: { color: '241118' },
    line: { color: C_ROSE, width: 1 }
  });
  s2.addText([
    { text: 'FATAL ENGINEERING CONSEQUENCE:\n', options: { fontSize: 9.5, bold: true, color: C_ROSE } },
    { text: 'Heavy metal armor turns into an internal factory of lethal, uncharged secondary fast neutrons (Q = 10–20) and Bremsstrahlung X-rays!\n\n', options: { fontSize: 9.5, color: 'FECDD3' } },
    { text: 'Adding 500 kg of pure lead increases cabin cancer biological dose by +42% while wasting 500 kg of launch payload!', options: { fontSize: 9.5, bold: true, color: C_GOLD } }
  ], { x: 0.9, y: 3.28, w: 5.1, h: 1.2, fontFace: 'Segoe UI' });

  s2.addText([
    { text: 'GadaSpace replaces this heavy metal trap entirely with advanced low-Z composites (BeCO) that absorb protons through equal-mass recoil without triggering nuclear fragmentation.', options: { fontSize: 9.5, color: C_MUTED } }
  ], { x: 0.75, y: 4.75, w: 5.4, h: 1.45, fontFace: 'Segoe UI' });

  // Right Column: 3 Critical Failure Modes of Existing Systems
  const failureModes = [
    {
      title: '1. Single-Sensor Blind Spot (-21.4% Error)',
      desc: 'Standard silicon dosimeters miss 92% of uncharged neutrons. Flight surgeons calculate false safe readings while astronauts accumulate lethal radiation.',
      color: C_ROSE, y: 1.45
    },
    {
      title: '2. Silent & Odorless Biological Threat',
      desc: 'Radiation gives no human sensory cues. Spacewalking astronauts have zero real-time awareness of rising solar flares until cellular DNA double-strand breaks occur.',
      color: C_GOLD, y: 3.15
    },
    {
      title: '3. Continuous Magnet Power Drain (>250W)',
      desc: 'Traditional active magnetic designs draw massive continuous power, exhausting spacesuit batteries in 45 minutes and imposing chronic electromagnetic burden.',
      color: C_CYAN, y: 4.85
    }
  ];

  failureModes.forEach(f => {
    addAccentCard(s2, {
      x: 6.7, y: f.y, w: 6.13, h: 1.55,
      accentColor: f.color,
      title: f.title
    });
    s2.addText(f.desc, {
      x: 6.95, y: f.y + 0.45, w: 5.6, h: 0.95,
      fontSize: 10, color: C_TEXT_SUB, fontFace: 'Segoe UI'
    });
  });
}

// =========================================================================
// SLIDE 3: SOLUTION 1 — BeCO & COMPOSITE SHIELDING
// =========================================================================
{
  const s3 = createSlideShell({
    slideNum: '03',
    category: 'SOLUTION 1: MATERIALS',
    timing: '1:00 – 1:30 (30s)',
    pillar: 'PILLAR 2 & 3: CREATIVITY & VALIDITY',
    title: 'Solution 1: Advanced Low-Z & BeCO Composite Shielding',
    subtitle: 'Quenching spallation: Lightweight atoms absorb cosmic rays without secondary neutron spallation',
    scriptText: '"To fix the spallation paradox, we replaced heavy metals with advanced Graded-Z composites. On the outside, our lightweight Beryllium-Carbon-Oxygen (BeCO) matrix slows relativistic cosmic protons without shattering. Behind it, Gadolinium-157 MXene nanosheets possess a thermal neutron capture cross-section of 255,000 barns—1.5 million times higher than lead. It swallows neutrons like a sponge, slashing secondary cabin neutrons by 92% and saving over 350 kg of rocket launch mass."'
  });

  // Left Column: 3-Layer Bio-Hybrid Graded-Z Stack
  addAccentCard(s3, {
    x: 0.5, y: 1.45, w: 6.8, h: 4.95,
    accentColor: C_EMERALD,
    title: '🔬 THE 3-LAYER GRADED-Z BIO-HYBRID ARCHITECTURE'
  });

  const layers = [
    {
      name: 'Layer 1 (Outer): BeCO (Beryllium-Carbon-Oxygen) Matrix',
      body: 'Low atomic mass (Z=4, 6, 8) absorbs incoming relativistic protons via equal-mass proton-proton elastic recoil without triggering spallation. Backed by UHMWPE fibers.',
      tagColor: C_CYAN, y: 1.95
    },
    {
      name: 'Layer 2 (Core): ¹⁵⁷Gd-MXene Nanocomposite (255,000 barns)',
      body: 'Gadolinium-157 possesses a thermal neutron capture cross-section 1,500,000× higher than lead. It swallows secondary neutrons like a microscopic sponge.',
      tagColor: C_PURPLE, y: 3.05
    },
    {
      name: 'Layer 3 (Inner): Chernobyl Fungal Melanin Hydrogel',
      body: 'Radiotrophic melanin converts residual ionizing energy into harmless heat and scavenges reactive oxygen species (ROS) in human cell tissue.',
      tagColor: C_EMERALD, y: 4.15
    }
  ];

  layers.forEach(l => {
    s3.addShape(pptx.ShapeType.roundRect, {
      x: 0.75, y: l.y, w: 6.3, h: 0.95, rectRadius: 0.06,
      fill: { color: C_STAT_BG }, line: { color: C_BORDER, width: 1 }
    });
    s3.addText(l.name, {
      x: 0.9, y: l.y + 0.08, w: 6.0, h: 0.28,
      fontSize: 10.5, bold: true, color: l.tagColor, fontFace: 'Segoe UI'
    });
    s3.addText(l.body, {
      x: 0.9, y: l.y + 0.35, w: 6.0, h: 0.55,
      fontSize: 9.2, color: C_TEXT_SUB, fontFace: 'Segoe UI'
    });
  });

  // Right Column: 3 High-Impact Stat Boxes
  const metricsS3 = [
    { val: '-61.5%', lbl: 'Net Cumulative Dose Cut', sub: 'Interplanetary GCR vs. Heavy Lead', color: C_EMERALD, y: 1.45 },
    { val: '255,000 b', lbl: '¹⁵⁷Gd Neutron Capture', sub: 'vs. Lead 0.17 b (1.5M× Higher!)', color: C_PURPLE, y: 3.15 },
    { val: '+145 kg', lbl: 'Total Shielding Mass', sub: 'Saves >355 kg over metallic armor', color: C_CYAN, y: 4.85 }
  ];
  metricsS3.forEach(m => {
    addMetricBox(s3, {
      x: 7.6, y: m.y, w: 5.23, h: 1.55,
      val: m.val, lbl: m.lbl, sub: m.sub, color: m.color
    });
  });
}

// =========================================================================
// SLIDE 4: SOLUTION 2 — ACTIVE MAGNETIC DEFLECTION
// =========================================================================
{
  const s4 = createSlideShell({
    slideNum: '04',
    category: 'SOLUTION 2: ACTIVE SHIELD',
    timing: '1:30 – 2:00 (30s)',
    pillar: 'PILLAR 2: CREATIVITY & FEASIBILITY',
    title: 'Solution 2: Active Superconducting Magnetic Deflection (Odaa-Aegis)',
    subtitle: 'Lorentz force F = q(v × B) deflecting solar flares with smart power duty-cycling',
    scriptText: '"Passive shielding cannot do it alone. In Solution 2, we pair passive materials with active High-Temperature Superconducting magnetic coils. Instead of leaving massive magnets running continuously—which would drain spacecraft power—our coils remain dormant at zero watts during nominal space weather. When our sensors detect an incoming solar storm, the coils spool up in milliseconds, creating an invisible magnetic deflector that bends 100% of charged solar protons away from crew quarters."'
  });

  // Left Column: 3.5T HTS Solenoid Deflector
  addAccentCard(s4, {
    x: 0.5, y: 1.45, w: 6.8, h: 4.95,
    accentColor: C_PURPLE,
    title: '⚡ 3.5-TESLA HTS SOLENOID DEFLECTION COILS'
  });

  s4.addText([
    { text: 'High-Temperature Superconducting (HTS ReBCO) coil arrays encircle crew quarters, creating an active magnetic deflector.\n\n', options: { fontSize: 10.5, color: C_TEXT } },
    { text: 'The Lorentz Force Principle: ', options: { fontSize: 10.5, bold: true, color: C_CYAN } },
    { text: 'F = q(v × B) curves positively charged solar protons away from the spacecraft trajectory before they touch the hull.\n\n', options: { fontSize: 10, color: C_TEXT_SUB } }
  ], { x: 0.75, y: 1.85, w: 6.3, h: 1.25, fontFace: 'Segoe UI' });

  // Standby Callout Box
  s4.addShape(pptx.ShapeType.roundRect, {
    x: 0.75, y: 3.15, w: 6.3, h: 1.4, rectRadius: 0.06,
    fill: { color: '20142C' }, line: { color: C_PURPLE, width: 1 }
  });
  s4.addText([
    { text: 'SMART STANDBY DUTY-CYCLING ALGORITHM:\n', options: { fontSize: 10, bold: true, color: C_PURPLE } },
    { text: '• In quiet space weather, coils sit dormant at ', options: { fontSize: 9.5, color: C_TEXT_SUB } },
    { text: '0 Watts ', options: { fontSize: 10, bold: true, color: C_EMERALD } },
    { text: '(zero power drain, zero chronic EM exposure).\n', options: { fontSize: 9.5, color: C_TEXT_SUB } },
    { text: '• Upon solar flare detection by NOAA/Kalman, coils spool up in milliseconds to full 3.5 T, achieving ', options: { fontSize: 9.5, color: C_TEXT_SUB } },
    { text: '100% deflection of high-energy protons.', options: { fontSize: 9.5, bold: true, color: C_CYAN } }
  ], { x: 0.9, y: 3.25, w: 6.0, h: 1.2, fontFace: 'Segoe UI' });

  s4.addText([
    { text: '• Solenoid geometry focuses field lines outward, keeping interior cabin field below OSHA/NASA limits (<0.5 mT).', options: { fontSize: 9.5, color: C_MUTED } }
  ], { x: 0.75, y: 4.85, w: 6.3, h: 1.3, fontFace: 'Segoe UI' });

  // Right Column: 2 Stat Tiles + Hybrid Synergy Box
  addMetricBox(s4, {
    x: 7.6, y: 1.45, w: 2.5, h: 1.45,
    val: '100%', lbl: 'Deflection of <100 MeV Protons', sub: 'High-energy solar flare barrier', color: C_EMERALD
  });
  addMetricBox(s4, {
    x: 10.33, y: 1.45, w: 2.5, h: 1.45,
    val: '0 Watts', lbl: 'Nominal Quiet Standby Power', sub: 'Millisecond rapid engagement', color: C_CYAN
  });

  addAccentCard(s4, {
    x: 7.6, y: 3.15, w: 5.23, h: 3.25,
    accentColor: C_GOLD,
    title: '🛡️ HYBRID PASSIVE-ACTIVE SYNERGY'
  });
  s4.addText([
    { text: 'The Perfect Division of Labor:\n', options: { fontSize: 11, bold: true, color: C_TEXT } },
    { text: '• The Active Magnetic Field deflects charged solar protons (which carry 90% of solar storm flux) without physical mass penalty.\n\n', options: { fontSize: 10, color: C_TEXT_SUB } },
    { text: '• The Passive BeCO & ¹⁵⁷Gd Composite passively swallows uncharged Galactic Cosmic Rays and secondary neutrons.\n\n', options: { fontSize: 10, color: C_TEXT_SUB } },
    { text: '• Pareto Multi-Objective Optimization Score: ', options: { fontSize: 10, color: C_TEXT_SUB } },
    { text: '94.6 / 100 ', options: { fontSize: 11, bold: true, color: C_GOLD } },
    { text: 'balancing dose reduction, payload mass, and electrical power.', options: { fontSize: 9.5, color: C_MUTED } }
  ], { x: 7.85, y: 3.55, w: 4.75, h: 2.7, fontFace: 'Segoe UI' });
}

// =========================================================================
// SLIDE 5: RECREATING THE ASTRONAUT SMART EVA SPACESUIT
// =========================================================================
{
  const s5 = createSlideShell({
    slideNum: '05',
    category: 'ASTRONAUT HEALTH',
    timing: '2:00 – 2:30 (30s)',
    pillar: 'PILLAR 1 & 2: IMPACT & CREATIVITY',
    title: 'Recreating the Astronaut Smart EVA Spacesuit',
    subtitle: 'Autonomous edge intelligence: Micro-magnetic coils & real-time Auditory Geiger sound cues',
    scriptText: '"Now to direct astronaut health: we completely reimagined the EVA spacesuit. First, we gave it an audible voice: synthesized Geiger clicks sound directly in the astronaut\'s headset, clicking faster as radiation rises so astronauts have instantaneous subconscious situational awareness without taking their eyes off tools. Second, flexible superconducting coils over the chest and bone marrow activate on-demand during solar flares, deflecting 88% of organ radiation while providing 18.5 hours of spacewalk battery life."'
  });

  // Left Column: Auditory Geiger-Müller Clicks
  addAccentCard(s5, {
    x: 0.5, y: 1.45, w: 5.9, h: 4.95,
    accentColor: C_GOLD,
    title: '🔊 REAL-TIME AUDITORY GEIGER-MÜLLER CLICKS'
  });

  s5.addText([
    { text: 'Spacewalking astronauts cannot stare at telemetry monitors while using core drills, rovers, or handling orbital tools.\n\n', options: { fontSize: 10.5, color: C_TEXT } },
    { text: 'We engineered a Web Audio synthesized Geiger clicker directly into the helmet communications feed:\n\n', options: { fontSize: 10, color: C_TEXT_SUB } }
  ], { x: 0.75, y: 1.85, w: 5.4, h: 1.1, fontFace: 'Segoe UI' });

  // Callout Box for Audio System
  s5.addShape(pptx.ShapeType.roundRect, {
    x: 0.75, y: 2.95, w: 5.4, h: 1.55, rectRadius: 0.06,
    fill: { color: '271C0A' }, line: { color: C_GOLD, width: 1 }
  });
  s5.addText([
    { text: 'AUDITORY SITUATIONAL AWARENESS:\n', options: { fontSize: 10, bold: true, color: C_GOLD } },
    { text: '• Click Tempo scales with instantaneous flux: the astronaut subconsciously senses radiation intensity rising.\n\n', options: { fontSize: 9.5, color: C_SCRIPT } },
    { text: '• At ≥ 5.0 mSv/hr storm spike, a high-pitch tone alerts the astronaut instantly to seek lunar shelter or engage suit deflection coils!', options: { fontSize: 9.5, bold: true, color: C_ROSE } }
  ], { x: 0.9, y: 3.05, w: 5.1, h: 1.35, fontFace: 'Segoe UI' });

  s5.addText([
    { text: 'Interactive Browser Demonstration: judges and users can toggle live Geiger audio with a single click inside the web application.', options: { fontSize: 9.5, italic: true, color: C_MUTED } }
  ], { x: 0.75, y: 4.75, w: 5.4, h: 1.4, fontFace: 'Segoe UI' });

  // Right Column: Wearable Micro-HTS Coils
  addAccentCard(s5, {
    x: 6.7, y: 1.45, w: 6.13, h: 3.15,
    accentColor: C_CYAN,
    title: '🦺 WEARABLE MICRO-HTS MAGNETIC DEFLECTION BUBBLE'
  });
  s5.addText([
    { text: 'Flexible superconducting loops woven through the suit\'s torso, waist, and helmet generate a localized 0.8-Tesla deflection bubble over vital blood-forming bone marrow and cardiac tissue.\n\n', options: { fontSize: 10, color: C_TEXT_SUB } },
    { text: '• On-demand engagement: coils stay dormant at 0W during quiet spacewalks.\n', options: { fontSize: 9.5, bold: true, color: C_EMERALD } },
    { text: '• Pressurized ¹⁰B-water vest provides secondary emergency neutron capture.', options: { fontSize: 9.5, color: C_TEXT_SUB } }
  ], { x: 6.95, y: 1.85, w: 5.6, h: 1.25, fontFace: 'Segoe UI' });

  // Two Stat Boxes under the card
  addMetricBox(s5, {
    x: 6.7, y: 4.85, w: 2.95, h: 1.55,
    val: '18.5h', lbl: 'Spacewalk Battery Endurance', sub: '0W Standby (vs. 45m continuous)', color: C_EMERALD
  });
  addMetricBox(s5, {
    x: 9.88, y: 4.85, w: 2.95, h: 1.55,
    val: '-88%', lbl: 'Organ Dose Deflection', sub: 'Protects blood-forming marrow', color: C_CYAN
  });
}

// =========================================================================
// SLIDE 6: KALMAN MULTI-DETECTOR SENSOR FUSION
// =========================================================================
{
  const s6 = createSlideShell({
    slideNum: '06',
    category: 'SENSOR BRAIN',
    timing: '2:30 – 3:00 (30s)',
    pillar: 'PILLAR 3: VALIDITY & NASA OPEN DATA',
    title: 'Kalman Multi-Detector Sensor Fusion (Gumii Consensus)',
    subtitle: 'Combining 5 heterogeneous sensors into ONE single source of truth with ±4.8% RMSE',
    scriptText: '"How do we monitor astronaut health accurately? Never rely on one sensor. Inspired by the Gadaa consensus assembly, our Kalman filter fuses five heterogeneous detectors—silicon, tissue counters, scintillators, and neutron detectors. It dynamically re-weights sensor drift, slashing dose uncertainty from ±28% down to ±4.8%."'
  });

  // Left Column: 5 Heterogeneous Sensors
  addAccentCard(s6, {
    x: 0.5, y: 1.45, w: 5.9, h: 4.95,
    accentColor: C_CYAN,
    title: '📡 5-SENSOR HETEROGENEOUS DETECTOR ARRAY'
  });

  const detectors = [
    { name: '1. Silicon PIN Diode: ', desc: 'Rapid charged ion counting (suffers 8% neutron blind spot).' },
    { name: '2. TEPC Microdosimeter: ', desc: 'Tissue-equivalent lineal energy (y in keV/µm); drifts over long missions.' },
    { name: '3. CsI(Tl) Scintillator: ', desc: 'Captures secondary Bremsstrahlung X-rays and gamma photons.' },
    { name: '4. ¹⁵⁷Gd/³He Counter: ', desc: 'Dedicated 255k-barn uncharged thermal & fast neutron sensor.' },
    { name: '5. Covered-Lens CMOS: ', desc: 'Physical USB ionizing radiation strike detection via Web Serial.' }
  ];
  let detY = 1.95;
  detectors.forEach(d => {
    s6.addText([
      { text: d.name, options: { bold: true, color: C_TEXT, fontSize: 10 } },
      { text: d.desc, options: { color: C_MUTED, fontSize: 9.2 } }
    ], { x: 0.75, y: detY, w: 5.4, h: 0.52, fontFace: 'Segoe UI' });
    detY += 0.56;
  });

  // Right Column: Inverse-Variance Kalman Consensus
  addAccentCard(s6, {
    x: 6.7, y: 1.45, w: 6.13, h: 3.15,
    accentColor: C_EMERALD,
    title: '⚖️ INVERSE-VARIANCE KALMAN RE-WEIGHTING'
  });

  s6.addText([
    { text: 'Inspired by the Oromo Gadaa Gumii assembly where no single faction rules blindly, our Extended Kalman Filter reconciles diverse sensor outputs.\n\n', options: { fontSize: 10, color: C_TEXT } }
  ], { x: 6.95, y: 1.85, w: 5.6, h: 0.65, fontFace: 'Segoe UI' });

  // Formula Callout
  s6.addShape(pptx.ShapeType.roundRect, {
    x: 6.95, y: 2.55, w: 5.6, h: 0.7, rectRadius: 0.06,
    fill: { color: '0A192F' }, line: { color: C_CYAN, width: 1 }
  });
  s6.addText('Dynamic Weighting:  w_i ∝ 1 / σ_i²   |   OLTARIS Nuclear Priors', {
    x: 6.95, y: 2.55, w: 5.6, h: 0.7,
    fontSize: 10.5, bold: true, color: C_CYAN, fontFace: 'Consolas', align: 'center', valign: 'middle'
  });

  s6.addText([
    { text: '• When proton saturation blinds the silicon diode, the filter automatically re-weights toward the neutron counter and scintillator.', options: { fontSize: 9.5, color: C_TEXT_SUB } }
  ], { x: 6.95, y: 3.35, w: 5.6, h: 0.9, fontFace: 'Segoe UI' });

  // Two Stat Tiles: Single vs Fused
  addMetricBox(s6, {
    x: 6.7, y: 4.85, w: 2.95, h: 1.55,
    val: '±28.4%', lbl: 'Single-Sensor Error', sub: 'Silicon blind to neutrons', color: C_ROSE
  });
  addMetricBox(s6, {
    x: 9.88, y: 4.85, w: 2.95, h: 1.55,
    val: '±4.8%', lbl: 'Kalman Fused RMSE', sub: 'Single source of truth', color: C_EMERALD
  });
}

// =========================================================================
// SLIDE 7: AI SOLAR STORM PREDICTOR
// =========================================================================
{
  const s7 = createSlideShell({
    slideNum: '07',
    category: 'AI FORECASTER',
    timing: '3:00 – 3:30 (30s)',
    pillar: 'PILLAR 4: RELEVANCE (NASA & NOAA OPEN DATA)',
    title: 'AI Solar Storm Predictor (Gemini + NOAA SWPC)',
    subtitle: 'Real-time satellite ingestion: 42 minutes to 2.5 hours advance Parker Spiral warning',
    scriptText: '"GadaSpace connects directly to live NOAA GOES-18 and DSCOVR satellites. Using Google Gemini AI and the Parker Spiral equations, we compute the speed delta between light-speed X-rays and slower protons, giving astronauts between 42 minutes and 2.5 hours of advance warning before a solar particle storm arrives."'
  });

  // Left Column: Live NOAA Satellite Telemetry Pipeline
  addAccentCard(s7, {
    x: 0.5, y: 1.45, w: 5.9, h: 4.95,
    accentColor: C_PURPLE,
    title: '🛰 LIVE SATELLITE STREAM PIPELINE'
  });

  const streams = [
    { title: '1. NOAA GOES-18: ', val: 'Integral Protons (≥10, ≥50, ≥100 MeV pfu) for solar energetic particle event detection.' },
    { title: '2. NOAA GOES-19: ', val: 'Relativistic outer Van Allen belt electrons (≥2 MeV) for spacecraft charging alerts.' },
    { title: '3. DSCOVR L1 Satellite: ', val: 'Solar wind speed (km/s) and IMF Bz reconnection magnetic field (nT).' },
    { title: '4. NASA OMNI2 & CRaTER: ', val: 'Historical validation against major Solar Cycle 23-25 SPE storms.' }
  ];
  let strY = 1.95;
  streams.forEach(st => {
    s7.addText([
      { text: st.title, options: { bold: true, color: C_CYAN, fontSize: 10 } },
      { text: st.val, options: { color: C_TEXT_SUB, fontSize: 9.2 } }
    ], { x: 0.75, y: strY, w: 5.4, h: 0.65, fontFace: 'Segoe UI' });
    strY += 0.72;
  });

  // Right Column: Gemini AI Co-Pilot & Early Warning Horizon
  addAccentCard(s7, {
    x: 6.7, y: 1.45, w: 6.13, h: 4.95,
    accentColor: C_CYAN,
    title: '🤖 GEMINI AI FLIGHT SURGEON CO-PILOT'
  });

  s7.addText([
    { text: 'Powered by high-speed Google AI Gemini multi-key failover pool running in the browser and edge.\n\n', options: { fontSize: 10.5, color: C_TEXT } },
    { text: 'Parker Spiral Early Warning Horizon Equation:\n', options: { fontSize: 10, bold: true, color: C_GOLD } }
  ], { x: 6.95, y: 1.85, w: 5.6, h: 0.8, fontFace: 'Segoe UI' });

  // Parker Spiral Equation Callout
  s7.addShape(pptx.ShapeType.roundRect, {
    x: 6.95, y: 2.65, w: 5.6, h: 0.7, rectRadius: 0.06,
    fill: { color: '20142C' }, line: { color: C_PURPLE, width: 1 }
  });
  s7.addText('Δt_warn = L_Parker(V_sw) / (β·c) - 8.3 min', {
    x: 6.95, y: 2.65, w: 5.6, h: 0.7,
    fontSize: 11, bold: true, color: C_CYAN, fontFace: 'Consolas', align: 'center', valign: 'middle'
  });

  s7.addText([
    { text: '• The Speed Delta Advantage: ', options: { fontSize: 10, bold: true, color: C_TEXT } },
    { text: 'Solar flare X-rays travel at light speed (c), arriving at Earth/Moon in 8.3 minutes. Mass-bearing energetic protons travel at 0.3–0.8c along the Parker Spiral magnetic field lines.\n\n', options: { fontSize: 9.5, color: C_TEXT_SUB } },
    { text: '• Critical Operational Payoff: ', options: { fontSize: 10, bold: true, color: C_EMERALD } },
    { text: 'Astronauts gain ', options: { fontSize: 9.5, color: C_TEXT_SUB } },
    { text: '42 minutes to 2.5 hours of advance warning ', options: { fontSize: 10, bold: true, color: C_EMERALD } },
    { text: 'before the particle storm arrives—plenty of time to abort spacewalks and engage magnetic shielding!', options: { fontSize: 9.5, color: C_TEXT_SUB } }
  ], { x: 6.95, y: 3.5, w: 5.6, h: 2.7, fontFace: 'Segoe UI' });
}

// =========================================================================
// SLIDE 8: 3D TRAJECTORY CORRIDORS
// =========================================================================
{
  const s8 = createSlideShell({
    slideNum: '08',
    category: '3D TRAJECTORY',
    timing: '3:30 – 4:00 (30s)',
    pillar: 'PILLAR 1 & 5: IMPACT & INTERACTIVE PRESENTATION',
    title: '3D Spacecraft Trajectory Radiation Corridors (Moon & Mars)',
    subtitle: 'Interactive 3D WebGL flight paths: Direct Apollo vs. Polar High-Inclination Bypass Corridor',
    scriptText: '"In our 3D Trajectory Studio, flight controllers can simulate orbital highways to the Moon and Mars. Look at Path 1: the standard Apollo transfer punches through the dense Van Allen belt with an 18.4 mSv/hr spike. Now look at Path 2: our Polar Bypass Corridor launches at 68.5 degrees over Earth\'s poles, completely circumnavigating the trapped proton belt and cutting total transit radiation by 63%!"'
  });

  const paths = [
    {
      name: 'PATH 1: DIRECT HOHMANN TLI',
      stat: '18.4 mSv/h',
      statLbl: 'Peak Belt Dose Spike',
      desc: 'Punches through the dense inner Van Allen proton belt (L=1.5–2.2). High cumulative exposure risk during solar flare periods.',
      color: C_ROSE, x: 0.5
    },
    {
      name: 'PATH 2: POLAR BYPASS HIGHWAY',
      stat: '-63%',
      statLbl: 'Total Transit Dose Cut',
      desc: 'Launches at i=68.5° over Earth\'s magnetic poles through open field lines. Completely circumnavigates the trapped proton belt!',
      color: C_EMERALD, x: 4.7
    },
    {
      name: 'PATH 3: MARS CONJUNCTION SPRINT',
      stat: '-40%',
      statLbl: 'Chronic GCR Dose Cut',
      desc: '165-day high-energy transit vs. 259-day Hohmann orbit, cutting chronic Galactic Cosmic Ray exposure and saving 134 mSv of lifetime dose.',
      color: C_PURPLE, x: 8.93
    }
  ];

  paths.forEach(p => {
    addAccentCard(s8, {
      x: p.x, y: 1.45, w: 3.9, h: 4.0,
      accentColor: p.color,
      title: p.name
    });

    s8.addText(p.stat, {
      x: p.x + 0.25, y: 2.1, w: 3.4, h: 0.6,
      fontSize: 26, bold: true, color: p.color, fontFace: 'Consolas', align: 'center'
    });
    s8.addText(p.statLbl, {
      x: p.x + 0.25, y: 2.75, w: 3.4, h: 0.3,
      fontSize: 10, bold: true, color: C_TEXT, fontFace: 'Segoe UI', align: 'center'
    });
    s8.addText(p.desc, {
      x: p.x + 0.25, y: 3.25, w: 3.4, h: 2.0,
      fontSize: 10, color: C_TEXT_SUB, fontFace: 'Segoe UI'
    });
  });

  // Bottom 3D Features Strip
  slideCardBottom(s8, {
    x: 0.5, y: 5.65, w: 12.33, h: 0.75,
    accentColor: C_CYAN,
    text: '🎮 INTERACTIVE 3D WEBGL ENGINE: Full orbital scrubbing (0–100% waypoint slider), real-time flux readouts, Moon vs. Mars surface terrain comparisons, and live Web Audio Geiger radiation clicks.'
  });
}

function slideCardBottom(slide, { x, y, w, h, accentColor, text }) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.06,
    fill: { color: C_PANEL }, line: { color: C_BORDER, width: 1 }
  });
  slide.addShape(pptx.ShapeType.rect, {
    x, y: y + 0.05, w: 0.08, h: h - 0.1,
    fill: { color: accentColor }, line: { color: accentColor, width: 0 }
  });
  slide.addText(text, {
    x: x + 0.25, y: y + 0.08, w: w - 0.4, h: h - 0.16,
    fontSize: 9.5, bold: true, color: C_CYAN, fontFace: 'Segoe UI', valign: 'middle'
  });
}

// =========================================================================
// SLIDE 9: DUAL PLATFORM ARCHITECTURE
// =========================================================================
{
  const s9 = createSlideShell({
    slideNum: '09',
    category: 'ACCESSIBILITY',
    timing: '4:00 – 4:30 (30s)',
    pillar: 'PILLAR 5: PRESENTATION & USABILITY',
    title: 'Dual Platform: Student/Explorer Mode vs. Expert Mode',
    subtitle: 'Designed for everyone: Zero scary equations for beginners, full differential physics for judges',
    scriptText: '"Science is only powerful if people can understand it. We built two tailored platform modes: Student Mode with vertical left navigation and zero scary equations so young learners can explore 3D spacesuits and DNA models, and Expert Flight Surgeon Mode with full differential equations and Pareto trade-off matrices for aerospace engineers."'
  });

  // Left Column: Student Mode
  addAccentCard(s9, {
    x: 0.5, y: 1.45, w: 5.9, h: 4.95,
    accentColor: C_CYAN,
    title: '🎓 STUDENT & EXPLORER MODE (USER-FRIENDLY)'
  });

  const studentFeatures = [
    { title: '• Vertical Left-Hand Navigation: ', desc: 'Replaces confusing top tabs with an intuitive vertical sidebar designed for easy exploration.' },
    { title: '• Zero Scary Equations: ', desc: 'Plain-English takeaway banners explain the core lessons in 2 simple sentences.' },
    { title: '• Rich Interactive 3D Models: ', desc: 'Rotate the 3D spacesuit, test magnetic shields, explore the Mars highway, and inspect DNA strands.' },
    { title: '• Real-Time Auditory Feedback: ', desc: 'Listen to live Geiger clicks and solar storm alerts directly in the browser.' }
  ];
  let sfY = 1.95;
  studentFeatures.forEach(sf => {
    s9.addText([
      { text: sf.title, options: { bold: true, color: C_CYAN, fontSize: 10 } },
      { text: sf.desc, options: { color: C_TEXT_SUB, fontSize: 9.3 } }
    ], { x: 0.75, y: sfY, w: 5.4, h: 0.65, fontFace: 'Segoe UI' });
    sfY += 0.72;
  });

  // Right Column: Expert Flight Surgeon Mode
  addAccentCard(s9, {
    x: 6.7, y: 1.45, w: 6.13, h: 4.95,
    accentColor: C_GOLD,
    title: '🔬 FLIGHT SURGEON & EXPERT MODE'
  });

  const expertFeatures = [
    { title: '• Full Governing Physics Chain: ', desc: 'D = E/m (ICRU-85) → Q(LET) (ICRP-60) → H Equivalent Organ Dose with rigorous mathematical integrity.' },
    { title: '• Pareto 4-Way Trade-Off Matrix: ', desc: 'Quantitative optimization of Dose Reduction vs. Parasitic Mass vs. Electrical Power Draw.' },
    { title: '• Physical Hardware Sensor Bridges: ', desc: 'Web Serial USB Geiger counter & covered-lens CMOS optical camera inputs.' },
    { title: '• NASA-STD-3001 Compliance: ', desc: 'Live tracking against 250 mSv Artemis & 600 mSv universal career PEL limits.' }
  ];
  let efY = 1.95;
  expertFeatures.forEach(ef => {
    s9.addText([
      { text: ef.title, options: { bold: true, color: C_GOLD, fontSize: 10 } },
      { text: ef.desc, options: { color: C_TEXT_SUB, fontSize: 9.3 } }
    ], { x: 6.95, y: efY, w: 5.6, h: 0.65, fontFace: 'Segoe UI' });
    efY += 0.72;
  });
}

// =========================================================================
// SLIDE 10: 5-PILLAR WINNING SCORECARD & CONCLUSION
// =========================================================================
{
  const s10 = createSlideShell({
    slideNum: '10',
    category: 'CONCLUSION',
    timing: '4:30 – 5:00 (30s)',
    pillar: '5 CORE CRITERIA SCORECARD & SUMMARY',
    title: 'Protecting Humanity\'s Next Giant Leap to Moon & Mars',
    subtitle: 'Official 5 Core Judging Criteria Verification & Production Architecture',
    scriptText: '"To conclude: Artemis is about building permanent civilizations on the Moon and Mars. GadaSpace delivers the complete, unified shield to protect our astronauts. Our code is live on GitHub and deployed on Vercel. Thank you, judges, and we are ready for your questions!"'
  });

  // Left Column: 5 Core Criteria Scorecard Table
  const tableRows = [
    [
      { text: 'OFFICIAL CRITERIA', options: { bold: true, color: C_GOLD, fontSize: 9.5, fill: { color: '1A2333' } } },
      { text: 'GADASPACE ENGINEERING DELIVERY & BENCHMARKS', options: { bold: true, color: C_TEXT, fontSize: 9.5, fill: { color: '1A2333' } } }
    ],
    [
      { text: '1. IMPACT', options: { bold: true, color: C_CYAN, fontSize: 9.5, fill: { color: C_PANEL } } },
      { text: 'Eliminates the #1 biological barrier for Artemis & Mars; keeps cumulative dose safely under the 600 mSv NASA career PEL ceiling.', options: { color: C_TEXT_SUB, fontSize: 9, fill: { color: C_PANEL } } }
    ],
    [
      { text: '2. CREATIVITY', options: { bold: true, color: C_PURPLE, fontSize: 9.5, fill: { color: C_ELEVATED } } },
      { text: 'BeCO low-Z composites + ¹⁵⁷Gd-MXene, Smart Spacesuit with Geiger audio clicks, Oromo Gadaa Gumii Kalman consensus.', options: { color: C_TEXT_SUB, fontSize: 9, fill: { color: C_ELEVATED } } }
    ],
    [
      { text: '3. VALIDITY', options: { bold: true, color: C_EMERALD, fontSize: 9.5, fill: { color: C_PANEL } } },
      { text: 'Strict NASA-STD-3001, ICRU-85, and ICRP-60/103 compliance, backed by ±4.8% Kalman multi-sensor fusion accuracy.', options: { color: C_TEXT_SUB, fontSize: 9, fill: { color: C_PANEL } } }
    ],
    [
      { text: '4. RELEVANCE', options: { bold: true, color: C_GOLD, fontSize: 9.5, fill: { color: C_ELEVATED } } },
      { text: 'Real-time 6-stream NOAA GOES-18/19 & DSCOVR satellites + NASA OLTARIS, CRaTER, and MSL RAD data integration.', options: { color: C_TEXT_SUB, fontSize: 9, fill: { color: C_ELEVATED } } }
    ],
    [
      { text: '5. PRESENTATION', options: { bold: true, color: C_ROSE, fontSize: 9.5, fill: { color: C_PANEL } } },
      { text: 'Interactive 3D WebGL digital twins, Web Audio Geiger sound clicks, Student/Expert dual views, live on GitHub & Vercel.', options: { color: C_TEXT_SUB, fontSize: 9, fill: { color: C_PANEL } } }
    ]
  ];

  s10.addTable(tableRows, {
    x: 0.5, y: 1.45, w: 7.7, h: 4.95,
    colW: [1.8, 5.9],
    line: { color: C_BORDER, width: 1 },
    autoPage: false
  });

  // Right Column: Closing Callout & Team Horizon-X Logo
  addAccentCard(s10, {
    x: 8.45, y: 1.45, w: 4.38, h: 4.95,
    accentColor: C_EMERALD,
    title: '🌟 THANK YOU, JUDGES!'
  });

  if (fs.existsSync(logoPath)) {
    s10.addImage({
      path: logoPath,
      x: 9.9, y: 2.0, w: 1.5, h: 1.5
    });
  }

  s10.addText('TEAM HORIZON-X\nGADASPACE PLATFORM', {
    x: 8.65, y: 3.65, w: 4.0, h: 0.45,
    fontSize: 12, bold: true, color: C_CYAN, fontFace: 'Segoe UI', align: 'center'
  });

  // GitHub & Vercel Badges
  s10.addShape(pptx.ShapeType.roundRect, {
    x: 8.7, y: 4.25, w: 3.9, h: 0.8, rectRadius: 0.06,
    fill: { color: '0A1F18' }, line: { color: C_EMERALD, width: 1 }
  });
  s10.addText([
    { text: '🚀 Live Deployment & Source Code:\n', options: { fontSize: 9, bold: true, color: C_EMERALD } },
    { text: 'github.com/nafkunasefa1-hub/gadaaspace', options: { fontSize: 8.5, color: C_TEXT } }
  ], {
    x: 8.8, y: 4.3, w: 3.7, h: 0.7,
    fontFace: 'Consolas', align: 'center', valign: 'middle'
  });

  s10.addShape(pptx.ShapeType.roundRect, {
    x: 8.7, y: 5.25, w: 3.9, h: 0.9, rectRadius: 0.06,
    fill: { color: '271C0A' }, line: { color: C_GOLD, width: 1 }
  });
  s10.addText('✦ OPEN FOR JUDGE QUESTIONS & ANSWERS (4 MIN) ✦', {
    x: 8.8, y: 5.3, w: 3.7, h: 0.8,
    fontSize: 9.5, bold: true, color: C_GOLD, fontFace: 'Segoe UI', align: 'center', valign: 'middle'
  });
}

// Generate the PPTX File
const publicOutputPath = path.join(__dirname, 'public', 'GadaSpace_HorizonX_NASA_SpaceApps_10Slide_Pitch.pptx');
const rootOutputPath = path.join(__dirname, '..', 'GadaSpace_HorizonX_NASA_SpaceApps_10Slide_Pitch.pptx');
const rootUpdatedPath = path.join(__dirname, '..', 'GadaSpace_HorizonX_NASA_SpaceApps_10Slide_Pitch_Updated.pptx');
const officialPath = path.join(__dirname, '..', 'GadaSpace_PitchDeck_Official.pptx');

pptx.writeFile({ fileName: publicOutputPath }).then(() => {
  console.log(`✅ PowerPoint successfully generated at web-accessible public path:\n   ${publicOutputPath}`);
  
  // Try copying to root output paths
  try {
    fs.copyFileSync(publicOutputPath, rootOutputPath);
    console.log(`✅ Also saved to root path:\n   ${rootOutputPath}`);
  } catch (err) {
    if (err.code === 'EBUSY') {
      console.warn(`⚠️ Note: root file is currently locked by a presentation viewer (e.g. WPS Office / PowerPoint).`);
    } else {
      console.warn(`⚠️ Could not overwrite root file:`, err.message);
    }
  }

  // Always write the updated and official copies so user has zero locking conflicts
  try {
    fs.copyFileSync(publicOutputPath, rootUpdatedPath);
    console.log(`✅ Saved unlocked updated copy at:\n   ${rootUpdatedPath}`);
    fs.copyFileSync(publicOutputPath, officialPath);
    console.log(`✅ Saved unlocked official copy at:\n   ${officialPath}`);
  } catch (e) {
    console.error('Error copying alternative files:', e);
  }
}).catch(err => {
  console.error('❌ Error generating PPTX:', err);
  process.exit(1);
});

