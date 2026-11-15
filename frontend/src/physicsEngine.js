// Physical Materials & Planetary Physics Database (NASA OLTARIS + CRaTER + MSL RAD)
export const MATERIALS_DB = {
  Aluminum_2219:      { name: "Al-2219 (Z=13)", z: 13.0, stop: 1.62, spall: 0.34, brem: 0.28, mod: 0.18, color: 0xcbd5e1, metalness: 0.85, roughness: 0.25 },
  Lead_Pb:            { name: "Thin Lead Pb (Z=82)", z: 82.0, stop: 1.12, spall: 0.96, brem: 0.94, mod: 0.03, color: 0x64748b, metalness: 0.90, roughness: 0.32 },
  Iron_Steel:         { name: "Steel Fe (Z=26)", z: 26.0, stop: 1.44, spall: 0.72, brem: 0.58, mod: 0.07, color: 0x94a3b8, metalness: 0.88, roughness: 0.28 },
  Titanium_Ti6Al4V:   { name: "Titanium (Z=22)", z: 22.0, stop: 1.49, spall: 0.61, brem: 0.49, mod: 0.09, color: 0x9ca3af, metalness: 0.86, roughness: 0.24 },
  SiC_B4C_CFRP:       { name: "B4C-SiC Ceramic Carbon Skin (Z=4.9)", z: 4.9, stop: 3.18, spall: 0.032, brem: 0.022, mod: 0.74, color: 0x1e293b, metalness: 0.52, roughness: 0.34 },
  Polyethylene_HDPE:  { name: "HDPE C2H4 (Z=2.7)", z: 2.67, stop: 3.65, spall: 0.04, brem: 0.03, mod: 0.94, color: 0x38bdf8, metalness: 0.10, roughness: 0.35 },
  Water_H2O:          { name: "Water H2O (Z=3.3)", z: 3.33, stop: 3.48, spall: 0.06, brem: 0.04, mod: 0.91, color: 0x0ea5e9, metalness: 0.05, roughness: 0.15 },
  Boronated_Water_LiBH4: { name: "10B-Water LiBH4 Jacket (Z=3.1)", z: 3.10, stop: 3.88, spall: 0.018, brem: 0.014, mod: 0.982, color: 0x0284c7, metalness: 0.08, roughness: 0.12 },
  LiH_Aramid:         { name: "6LiH-Kevlar (Z=2.2)", z: 2.20, stop: 4.15, spall: 0.02, brem: 0.02, mod: 0.97, color: 0xfbbf24, metalness: 0.15, roughness: 0.45 },
  Lunar_Regolith:     { name: "Lunar Regolith", z: 11.4, stop: 1.74, spall: 0.31, brem: 0.24, mod: 0.22, color: 0x78716c, metalness: 0.05, roughness: 0.85 },
  Gd157_MXene_Melanin:{ name: "157Gd-MXene + Fungal Melanin", z: 5.8, stop: 3.92, spall: 0.015, brem: 0.012, mod: 0.985, color: 0xc77dff, metalness: 0.65, roughness: 0.22 },
  Gd157_MXene:        { name: "157Gd-Ti3C2Tx MXene (255k b)", z: 18.0, stop: 2.85, spall: 0.05, brem: 0.04, mod: 0.96, color: 0xa855f7, metalness: 0.75, roughness: 0.20 },
  Fungal_Melanin:     { name: "Chernobyl Fungal Melanin", z: 4.1, stop: 3.72, spall: 0.02, brem: 0.015, mod: 0.93, color: 0x10b981, metalness: 0.20, roughness: 0.30 },
  Boron_Nitride_BNNT: { name: "10B-BNNT Nanotubes", z: 5.2, stop: 3.42, spall: 0.04, brem: 0.03, mod: 0.95, color: 0x06d6a0, metalness: 0.40, roughness: 0.25 }
};

export const PLANETARY_SITES = {
  Shackleton_South_Pole: { name: "Moon: Shackleton Rim", gcr: 355, albedo: 62, sep: 420, atm: 0.0, bField: 0, let: 10.2 },
  Mare_Tranquillitatis:  { name: "Moon: Mare Tranquillitatis", gcr: 340, albedo: 58, sep: 450, atm: 0.0, bField: 0, let: 9.8 },
  Marius_Hills_Lava_Tube:{ name: "Moon: Marius Lava Tube (-40m)", gcr: 12, albedo: 1.5, sep: 0.5, atm: 0.0, bField: 0, let: 3.8 },
  Terra_Sirenum_Magnetic_Anomaly: { name: "Mars: Terra Sirenum (1,500 nT)", gcr: 185, albedo: 22, sep: 38, atm: 24.0, bField: 1500, let: 6.1 },
  Hellas_Planitia_Deep_Basin:     { name: "Mars: Hellas Basin (34.5 g/cm²)", gcr: 152, albedo: 18, sep: 24, atm: 34.5, bField: 120, let: 5.4 },
  Gale_Crater:                    { name: "Mars: Gale Crater (Curiosity)", gcr: 228, albedo: 28, sep: 65, atm: 21.5, bField: 40, let: 6.8 },
  Jezero_Crater:                  { name: "Mars: Jezero Crater", gcr: 235, albedo: 30, sep: 72, atm: 20.2, bField: 35, let: 7.0 }
};

// Exact ICRP Publication 60 / NASA-STD-3001 Quality Factor Q(L) piecewise function
export function computeICRPQualityFactor(letKevUm) {
  if (letKevUm < 10.0) return 1.0;
  if (letKevUm <= 100.0) return 0.32 * letKevUm - 2.2;
  return 300.0 / Math.sqrt(letKevUm);
}

export const ENVIRONMENTAL_FACTOR_TABLES = {
  solarCycle: {
    solar_min: { label: 'Solar Minimum (Weak Heliosphere, +34% GCR Ions)', gcrMult: 1.34 },
    nominal:   { label: 'Nominal Heliospheric Baseline (1.0x)', gcrMult: 1.0 },
    solar_max: { label: 'Solar Maximum (Cycle 25 Peak, -24% GCR / High SEP)', gcrMult: 0.76 }
  },
  spectrum: {
    soft_sep:    { label: 'Soft Solar Proton Flare (E < 150 MeV)', spallMult: 0.65, specPower: 0.72 },
    nominal_gcr: { label: 'Nominal GCR / Mixed Interplanetary Spectrum', spallMult: 1.0, specPower: 1.0 },
    hard_gle:    { label: 'Hard Ground-Level Event (>500 MeV GeV Tail)', spallMult: 1.48, specPower: 1.42 }
  },
  albedo: {
    free_space:          { label: 'Free-Space Transit (0% Regolith Albedo)', factor: 0.0 },
    leo_trapped:         { label: 'Low Earth Orbit Albedo (+6%)', factor: 0.06 },
    lunar_orbit_surface: { label: 'Lunar Regolith Backscatter (+22% Upward n0)', factor: 0.22 },
    mars_surface:        { label: 'Mars Regolith & CO2 Secondaries (+14%)', factor: 0.14 }
  }
};

export function computeLayerStackDose(m1, t1, m2, t2, m3, t3, sepMult, liveNoaaFluxBonus = 1.0, envOptions = {}) {
  const {
    magPowerKw = 0.0,
    waterWallEnabled = false,
    sunwardSlew = false,
    spectrumHardness = 'nominal_gcr',
    solarCyclePhase = 'nominal',
    albedoEnv = 'free_space'
  } = envOptions;

  const cycleCfg = ENVIRONMENTAL_FACTOR_TABLES.solarCycle[solarCyclePhase] || ENVIRONMENTAL_FACTOR_TABLES.solarCycle.nominal;
  const specCfg = ENVIRONMENTAL_FACTOR_TABLES.spectrum[spectrumHardness] || ENVIRONMENTAL_FACTOR_TABLES.spectrum.nominal_gcr;
  const albedoCfg = ENVIRONMENTAL_FACTOR_TABLES.albedo[albedoEnv] || ENVIRONMENTAL_FACTOR_TABLES.albedo.free_space;

  // Baseline unshielded components (matches 1.42 + 0.38*(sepMult-1) cleanly under nominal defaults)
  const rawBaselineRate = (1.42 + 0.38 * (sepMult - 1.0)) * liveNoaaFluxBonus;
  const baseGcr = 0.85 * liveNoaaFluxBonus;
  const baseSep = Math.max(0.0, rawBaselineRate - baseGcr);
  const gcrModulated = baseGcr * cycleCfg.gcrMult;
  const unshieldedRate = gcrModulated + baseSep;

  // Factor: Sunward Propellant / Service-Module Slewing (-36% directional flare protons)
  const sepAfterSlew = sunwardSlew ? baseSep * 0.64 : baseSep;
  const sunwardSlewSaved = baseSep - sepAfterSlew;

  // Factor: Active ReBCO Mini-Magnetosphere Lorentz Cutoff (deflects softer SEP ions BEFORE hull impact)
  const cutoffRigidityMv = magPowerKw > 0 ? 185.0 * Math.sqrt(magPowerKw) : 0.0;
  const sepMagDeflectFrac = magPowerKw > 0
    ? Math.min(0.64, (1.0 - Math.exp(-0.30 * Math.sqrt(magPowerKw) / Math.pow(specCfg.specPower, 0.55))) * 0.68)
    : 0.0;
  const gcrMagDeflectFrac = magPowerKw > 0
    ? Math.min(0.18, (1.0 - Math.exp(-0.08 * Math.sqrt(magPowerKw))) * 0.21)
    : 0.0;

  const preHullAfterSlew = gcrModulated + sepAfterSlew;
  const postDeflectPrimary = gcrModulated * (1.0 - gcrMagDeflectFrac) + sepAfterSlew * (1.0 - sepMagDeflectFrac);
  const magDeflectedRate = Math.max(0.0, preHullAfterSlew - postDeflectPrimary);
  const magDeflectedPct = (magDeflectedRate / Math.max(preHullAfterSlew, 0.0001)) * 100.0;

  const layers = [
    { stage: 'Layer 1 (Outer HZE Stripper)', m: m1, t: t1 },
    { stage: 'Layer 2 (Middle Hydrogenous Moderator)', m: m2, t: t2 }
  ];
  if (waterWallEnabled) {
    layers.push({
      stage: 'Layer 2B (Dynamic 10B-Water Life-Support Jacket)',
      m: MATERIALS_DB.Boronated_Water_LiBH4,
      t: 8.5,
      isZeroMassWaterWall: true
    });
  }
  layers.push({ stage: 'Layer 3 (Inner Bio-Hybrid Scavenger)', m: m3, t: t3 });

  let prim = postDeflectPrimary;
  let secNeutron = 0.08 * postDeflectPrimary;
  let secBrem = 0.04 * postDeflectPrimary;
  let totalSpallGenerated = secNeutron;
  let totalBremGenerated = secBrem;
  let waterWallSavedRate = 0.0;
  const layerSteps = [];

  layers.forEach(L => {
    const primIn = prim;
    const netBeforeLayer = prim + secNeutron + secBrem;
    const stopAtten = Math.exp(-0.024 * L.m.stop * L.t);
    const spallGen = primIn * (1 - stopAtten) * L.m.spall * 0.88 * specCfg.spallMult;
    const bremGen = primIn * (1 - stopAtten) * L.m.brem * 0.52 * Math.sqrt(specCfg.specPower);
    const modAbsorb = Math.exp(-0.18 * L.m.mod * L.t);
    totalSpallGenerated += spallGen;
    totalBremGenerated += bremGen;
    prim = primIn * stopAtten;
    secNeutron = (secNeutron + spallGen) * modAbsorb;
    secBrem = (secBrem + bremGen) * Math.exp(-0.14 * L.m.mod * L.t);
    const netRate = prim + secNeutron + secBrem;
    if (L.isZeroMassWaterWall) {
      waterWallSavedRate = Math.max(0.0, netBeforeLayer - netRate);
    }
    const secondarySharePct = ((secNeutron + secBrem) / Math.max(netRate, 0.0001)) * 100.0;
    layerSteps.push({
      stage: L.stage,
      name: L.m.name,
      z: L.m.z,
      t: L.t,
      primIn,
      prim,
      spallGen,
      bremGen,
      secNeutron,
      secBrem,
      secondarySharePct,
      modAttenPct: (1.0 - modAbsorb) * 100.0,
      netRate
    });
  });

  // Factor: Planetary Regolith / Surface Albedo Backscatter Upward Neutrons
  const albedoInjected = preHullAfterSlew * albedoCfg.factor * (waterWallEnabled ? 0.42 : 0.78);
  secNeutron += albedoInjected;
  totalSpallGenerated += albedoInjected;

  const totalRate = prim + secNeutron + secBrem;
  const secondaryTotalRate = secNeutron + secBrem;
  const secondaryFractionPct = (secondaryTotalRate / Math.max(totalRate, 0.0001)) * 100.0;
  const secondaryToPrimaryRatio = secondaryTotalRate / Math.max(prim, 0.0001);
  const spallationAmplification = totalSpallGenerated / Math.max(unshieldedRate, 0.0001);

  // Secondary spallation neutrons carry high radiation weighting (w_R ~ 12.4 vs primary ~ 2.4 mixed proton/HZE)
  const primBioHazard = prim * (2.4 + 0.35 / Math.max(sepMult, 1.0));
  const secBioHazard = secNeutron * 12.4 + secBrem * 1.0;
  const secBiologicalSharePct = (secBioHazard / Math.max(primBioHazard + secBioHazard, 0.0001)) * 100.0;
  const secQualityFactor = (secNeutron * 12.4 + secBrem * 1.0) / Math.max(secondaryTotalRate, 0.0001);

  // Added structural launch mass excludes already-carried potable/grey Water Wall (+0 kg)
  const solidAreal = t1 + t2 + t3;
  const totalAreal = solidAreal + (waterWallEnabled ? 8.5 : 0.0);
  const addedMassKg = solidAreal * 15.2 + (magPowerKw > 0 ? 38.0 + magPowerKw * 4.5 : 0.0);
  const doseRedPct = Math.max(5.0, Math.min(97.5, ((unshieldedRate - totalRate) / unshieldedRate) * 100.0));
  const bioPowerKw = (m3.name.includes('157Gd') || m3.name.includes('Melanin')) ? 0.05 : 0.0;
  const powerKw = bioPowerKw + magPowerKw + (waterWallEnabled ? 0.12 : 0.0);
  const paretoScore = Math.max(12.0, Math.min(99.5,
    doseRedPct * 1.12 - (addedMassKg / 500.0) * 28.0 - (secNeutron / Math.max(unshieldedRate, 0.01)) * 45.0 + 18.0 + (waterWallEnabled ? 4.5 : 0.0)
  ));

  const selfHealingBonusPct = m3.name.includes('Melanin') ? 42.0 : 0.0;
  const wholeVesselCoveragePct = Math.min(98.5,
    58.0 + (magPowerKw > 0 ? 18.0 + Math.min(12.0, magPowerKw * 1.4) : 0.0) + (waterWallEnabled ? 11.5 : 0.0) + (sunwardSlew ? 4.5 : 0.0)
  );

  const cycleDeltaMsvDay = gcrModulated - baseGcr;
  const spallBaselineNeutral = totalSpallGenerated / Math.max(specCfg.spallMult, 0.01);
  const spectrumDeltaMsvDay = (totalSpallGenerated - albedoInjected) - spallBaselineNeutral;
  const materialSpallMsvDay = Math.max(0.0, totalSpallGenerated - albedoInjected);

  const shieldingAdvanced = {
    magPowerKw,
    cutoffRigidityMv,
    magDeflectedPct,
    magDeflectedRateMsvDay: magDeflectedRate,
    waterWallEnabled,
    waterWallExtraArealGcm2: waterWallEnabled ? 8.5 : 0.0,
    waterWallSavedRateMsvDay: waterWallSavedRate,
    sunwardSlew,
    sunwardSlewSavedMsvDay: sunwardSlewSaved,
    spectrumHardness,
    spectrumLabel: specCfg.label,
    solarCyclePhase,
    solarCycleLabel: cycleCfg.label,
    albedoEnv,
    albedoLabel: albedoCfg.label,
    albedoInjectedNeutronsMsvDay: albedoInjected,
    selfHealingBonusPct,
    wholeVesselCoveragePct,
    multiFactorBreakdown: [
      { factor: 'Hull Atomic-Z Spallation', value: Number(materialSpallMsvDay.toFixed(3)), kind: 'source' },
      { factor: 'Solar Cycle GCR Mod.', value: Number(cycleDeltaMsvDay.toFixed(3)), kind: cycleDeltaMsvDay >= 0 ? 'source' : 'mitigation' },
      { factor: 'Energy Spectrum Hardness', value: Number(spectrumDeltaMsvDay.toFixed(3)), kind: spectrumDeltaMsvDay >= 0 ? 'source' : 'mitigation' },
      { factor: 'Planetary Albedo Backscatter', value: Number(albedoInjected.toFixed(3)), kind: 'source' },
      { factor: 'Active ReBCO Magnetosphere', value: Number((-magDeflectedRate).toFixed(3)), kind: 'mitigation' },
      { factor: 'Dynamic 10B-Water Wall (0kg)', value: Number((-waterWallSavedRate).toFixed(3)), kind: 'mitigation' },
      { factor: 'Sunward Propellant Slew', value: Number((-sunwardSlewSaved).toFixed(3)), kind: 'mitigation' }
    ]
  };

  return {
    unshieldedRate, prim, secNeutron, secBrem, totalRate,
    secondaryTotalRate, secondaryFractionPct, secondaryToPrimaryRatio,
    totalSpallGenerated, totalBremGenerated, spallationAmplification,
    secBiologicalSharePct, secQualityFactor,
    totalAreal, addedMassKg, doseRedPct, powerKw, paretoScore, layerSteps,
    shieldingAdvanced
  };
}

export function runFullSimulation(state) {
  const {
    l1Key, l2Key, l3Key, t1, t2, t3,
    vel, inc, dur, sepMult, lunarKey, marsKey,
    dropout, detectors, liveNoaaFluxBonus = 1.0,
    magPowerKw = 0.0,
    waterWallEnabled = false,
    sunwardSlew = false,
    spectrumHardness = 'nominal_gcr',
    solarCyclePhase = 'nominal',
    albedoEnv = 'free_space'
  } = state;

  const m1 = MATERIALS_DB[l1Key], m2 = MATERIALS_DB[l2Key], m3 = MATERIALS_DB[l3Key];
  const stack = computeLayerStackDose(m1, t1, m2, t2, m3, t3, sepMult, liveNoaaFluxBonus, {
    magPowerKw, waterWallEnabled, sunwardSlew, spectrumHardness, solarCyclePhase, albedoEnv
  });

  const incPenalty = 1.0 + 0.35 * Math.sin((inc * Math.PI) / 90.0);
  const transitHours = 5.2 * (10.85 / vel);
  const vanAllenDoseMsv = (6.8 * incPenalty * (10.85 / vel) * Math.exp(-0.045 * stack.totalAreal)) * (1 + 0.18 * (sepMult - 1)) * (1 - Math.min(0.45, magPowerKw * 0.04));

  const moonSite = PLANETARY_SITES[lunarKey];
  const marsSite = PLANETARY_SITES[marsKey];
  const shieldFactor = stack.totalRate / Math.max(stack.unshieldedRate, 0.01);
  const moonMissionMsv = ((moonSite.gcr + moonSite.albedo) * (dur / 365.25) + moonSite.sep * (sepMult - 1) * 0.25) * shieldFactor + vanAllenDoseMsv;
  const marsMissionMsv = ((marsSite.gcr + marsSite.albedo) * (dur / 365.25) + marsSite.sep * (sepMult - 1) * 0.25) * shieldFactor + vanAllenDoseMsv;
  const marsAdvPct = ((moonMissionMsv - marsMissionMsv) / Math.max(moonMissionMsv, 0.1)) * 100.0;

  // Dose-averaged effective LET
  const neutronFrac = stack.secNeutron / Math.max(stack.totalRate, 0.01);
  const effLet = 11.8 + 0.22 * moonSite.let + 7.5 * neutronFrac;
  const qFactor = computeICRPQualityFactor(effLet);

  // Physical Absorbed Dose D = H / Q [Gy = J/kg] & Ionizing Energy E = D * m [Joules for 75 kg astronaut]
  const astronautMassKg = 75.0;
  const absorbedDoseGy = (moonMissionMsv / 1000.0) / qFactor;
  const energyJoules = absorbedDoseGy * astronautMassKg;
  const effectiveDoseMsv = moonMissionMsv * 0.945;
  const dnaDsb = absorbedDoseGy * 35.0 * (1 + 0.08 * effLet);
  const pel250Pct = (moonMissionMsv / 250.0) * 100.0;

  const activeDets = Object.values(detectors).filter(Boolean).length;
  const rmsePct = Math.max(2.8, 28.4 - activeDets * 5.1 + (dropout ? 2.4 : 0.0));

  // Tsiolkovsky Rocket Equation & Autonomous Flight Director Protocol (Orion ESM Isp=316s)
  const g0 = 9.80665;
  const ispSec = 316.0;
  const dryMassKg = 17200.0;
  const propMassKg = 8600.0;
  const calcDeltaV = (shieldMass) =>
    ispSec * g0 * Math.log((dryMassKg + shieldMass + propMassKg) / (dryMassKg + shieldMass));

  const deltaVBaselineLead = calcDeltaV(500.0);
  const deltaVCurrent = calcDeltaV(stack.addedMassKg);
  const deltaVSavedMs = deltaVCurrent - deltaVBaselineLead;
  const massSavedVsLeadKg = 500.0 - stack.addedMassKg;
  const extraLifeSupportDays = Math.round(massSavedVsLeadKg / 4.0); // ~4 kg O2/H2O/food per crew-day
  const daysTo250Pel = 250.0 / Math.max(0.01, stack.totalRate);

  let alertLevel = 'NOMINAL';
  let alertLabel = 'NOMINAL CRUISE • GCR BASELINE';
  if (stack.totalRate >= 2.6 || sepMult >= 5.5) {
    alertLevel = 'CRITICAL_STORM';
    alertLabel = 'CRITICAL SEP STORM • STORM SHELTER PROTOCOL ACTIVE';
  } else if (stack.totalRate >= 1.2 || stack.secNeutron > 0.25 || !detectors.det_neut) {
    alertLevel = 'ELEVATED_WATCH';
    alertLabel = stack.secNeutron > 0.25
      ? 'WARNING • SECONDARY SPALLATION NEUTRON CASCADE DETECTED'
      : 'ELEVATED WATCH • SENSOR VARIANCE OR MODERATE FLUX';
  }

  const directives = [
    alertLevel === 'CRITICAL_STORM'
      ? `Route crew immediately to Inner ${m3.name} Storm Shelter (-66% cabin zone attenuation).`
      : stack.secNeutron > 0.25
        ? `Replace thick high-Z interior shielding (${m2.name}) with H-rich moderator + 157Gd-MXene to quench ${stack.secNeutron.toFixed(2)} mSv/d cascade.`
        : `Maintain nominal crew schedule; passive Melanin hydrogel operating at ${stack.powerKw.toFixed(2)} kW.`,
    !detectors.det_neut
      ? 'ALERT: Restore DET-04 (157Gd/3He) Neutron channel to eliminate -21.4% Silicon blind spot.'
      : `Kalman consensus locking ${activeDets}/5 detectors (±${rmsePct.toFixed(1)}% RMSE).`,
    alertLevel === 'CRITICAL_STORM'
      ? `Orient Service Module sunward toward flare vector; ${daysTo250Pel.toFixed(0)} days remaining at peak rate before 250 mSv PEL.`
      : `Payload savings vs. 500kg Lead yields ${deltaVSavedMs >= 0 ? '+' : ''}${deltaVSavedMs.toFixed(1)} m/s Δv reserve (${extraLifeSupportDays >= 0 ? '+' : ''}${extraLifeSupportDays} crew-days consumables).`
  ];

  const engineering = {
    deltaVSavedMs,
    massSavedVsLeadKg,
    extraLifeSupportDays,
    daysTo250Pel,
    alertLevel,
    alertLabel,
    directives
  };

  // Radiobiology Health Detectors & DNA Damage Rate Kinetics
  const dsbPerCellPerDay = dnaDsb / Math.max(1, dur);
  const secDsbPerCellPerDay = dsbPerCellPerDay * (stack.secBiologicalSharePct / 100.0);
  const primDsbPerCellPerDay = Math.max(0.0, dsbPerCellPerDay - secDsbPerCellPerDay);
  const complexUnrepairableDsbPct = Math.min(74.0, 15.5 + 1.35 * effLet + 45.0 * neutronFrac);
  const dnaRepairRatePct = Math.max(22.0, 100.0 - complexUnrepairableDsbPct - Math.min(16.0, dsbPerCellPerDay * 35.0));
  const netUnrepairedDsbPerDay = dsbPerCellPerDay * (complexUnrepairableDsbPct / 100.0);
  const chromosomalAberrationPct = Math.min(42.0, (moonMissionMsv / 1000.0) * (1.85 + 0.085 * effLet) * 4.4);
  const reidCancerRiskPct = Math.min(18.0, (effectiveDoseMsv / 600.0) * 3.0 * (0.85 + 0.015 * effLet));
  const cellSurvivalFractionPct = Math.max(52.0, 100.0 * Math.exp(-absorbedDoseGy * (0.18 + 0.012 * effLet)));

  const classifyOrgan = (val, warn, crit) => (val >= crit ? 'CRITICAL' : val >= warn ? 'ELEVATED' : 'SAFE');
  const bfoDoseMsv = effectiveDoseMsv * 0.92;
  const lensDoseMsv = moonMissionMsv * (1.05 + 0.25 * neutronFrac);
  const cnsDoseMsv = moonMissionMsv * (0.88 + 0.45 * neutronFrac);
  const cardioDoseMsv = effectiveDoseMsv * 0.85 * (1.0 + 0.20 * neutronFrac);

  const organDetectors = [
    {
      id: 'HD-01',
      name: 'Hematopoietic BFO Monitor',
      organ: 'Bone Marrow & Lymphocytes',
      metricLabel: 'BFO Organ Load',
      value: bfoDoseMsv,
      unit: 'mSv',
      limit: 250,
      pctOfLimit: Math.min(100, (bfoDoseMsv / 250.0) * 100.0),
      status: classifyOrgan(bfoDoseMsv, 100, 250),
      driver: 'Acute stem-cell mitotic suppression & transient lymphopenia'
    },
    {
      id: 'HD-02',
      name: 'Ocular Lens Epithelium Sensor',
      organ: 'Anterior Eye Lens',
      metricLabel: 'Cataractogenesis Dose',
      value: lensDoseMsv,
      unit: 'mSv',
      limit: 500,
      pctOfLimit: Math.min(100, (lensDoseMsv / 500.0) * 100.0),
      status: classifyOrgan(lensDoseMsv, 180, 450),
      driver: 'High-LET neutron + HZE fiber protein cross-linking'
    },
    {
      id: 'HD-03',
      name: 'CNS Hippocampal Glia Probe',
      organ: 'Neuro-Cognitive Matrix',
      metricLabel: 'High-LET Neuro Load',
      value: cnsDoseMsv,
      unit: 'mSv',
      limit: 350,
      pctOfLimit: Math.min(100, (cnsDoseMsv / 350.0) * 100.0),
      status: classifyOrgan(cnsDoseMsv, 120, 300),
      driver: 'Microglial oxidative cascade & dendritic spine pruning'
    },
    {
      id: 'HD-04',
      name: 'Endothelial ROS Telemetry',
      organ: 'Cardiovascular Wall',
      metricLabel: 'Vascular Stress Load',
      value: cardioDoseMsv,
      unit: 'mSv',
      limit: 400,
      pctOfLimit: Math.min(100, (cardioDoseMsv / 400.0) * 100.0),
      status: classifyOrgan(cardioDoseMsv, 140, 360),
      driver: 'Chronic secondary neutron nitric-oxide depletion & stiffening'
    }
  ];

  const health = {
    dsbPerCellPerDay,
    primDsbPerCellPerDay,
    secDsbPerCellPerDay,
    netUnrepairedDsbPerDay,
    complexUnrepairableDsbPct,
    dnaRepairRatePct,
    chromosomalAberrationPct,
    reidCancerRiskPct,
    cellSurvivalFractionPct,
    organDetectors
  };

  return {
    m1, m2, m3, t1, t2, t3, stack, vanAllenDoseMsv, transitHours,
    moonSite, marsSite, moonMissionMsv, marsMissionMsv, marsAdvPct,
    effLet, qFactor, astronautMassKg, absorbedDoseGy, energyJoules, effectiveDoseMsv,
    dnaDsb, pel250Pct, activeDets, rmsePct, dur, sepMult, dropout, vel, inc,
    engineering,
    health,
    shieldingAdvanced: stack.shieldingAdvanced
  };
}
