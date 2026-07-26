export const HUMAN_DIMENSIONS = [
  { id: 'body', label: 'Body' },
  { id: 'mind', label: 'Mind' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'purpose', label: 'Purpose' },
  { id: 'recovery', label: 'Recovery' },
  { id: 'agency', label: 'Agency' }
];

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const present = v => v !== undefined && v !== null && v !== '';

// Signal → Domain canonical mapping (v0.49.0)
// sleep    → Recovery (primary),  Body (secondary — rest enables physical capacity)
// energy   → Body (primary),      Mind (secondary — vitality supports cognition)
// soreness → Body modifier        (reduces body energy when significant)
// time     → Agency               (available time defines capacity to act)
// challenge→ Purpose (primary),   secondary domain mirrors the chosen challenge type
// emotLoad → Mind (primary),      Relationships (secondary — load spills into relational space)
function applyContextSignals(base, context) {
  if (!context) return;

  // sleep (0-4) → Recovery + Body secondary
  if (present(context.sleep)) {
    const s = clamp(Number(context.sleep) / 4);
    base.recovery.energy = clamp(base.recovery.energy * 0.72 + s * 0.28, 0.18, 0.92);
    base.recovery.confidence = clamp(base.recovery.confidence + 0.14);
    base.body.energy = clamp(base.body.energy * 0.92 + s * 0.08, 0.18, 0.92);
  }

  // energy (1-3) → Body + Mind secondary
  if (present(context.energy)) {
    const e = clamp((Number(context.energy) - 1) / 2);
    base.body.energy = clamp(base.body.energy * 0.76 + e * 0.24, 0.18, 0.92);
    base.body.confidence = clamp(base.body.confidence + 0.12);
    base.mind.energy = clamp(base.mind.energy * 0.88 + e * 0.12, 0.18, 0.92);
    base.mind.confidence = clamp(base.mind.confidence + 0.06);
  }

  // soreness (none|mild|significant) → Body modifier
  if (present(context.soreness)) {
    const mod = { none: 0.04, mild: -0.05, significant: -0.18 }[context.soreness] ?? 0;
    base.body.energy = clamp(base.body.energy + mod, 0.18, 0.92);
  }

  // time (5|15|30|60 min) → Agency
  if (present(context.time)) {
    const tv = { 5: 0.18, 15: 0.42, 30: 0.68, 60: 0.92 }[Number(context.time)] ?? 0.5;
    base.agency.energy = clamp(base.agency.energy * 0.82 + tv * 0.18, 0.18, 0.92);
    base.agency.confidence = clamp(base.agency.confidence + 0.10);
  }

  // challenge → Purpose + secondary domain
  if (present(context.challenge)) {
    base.purpose.energy = clamp(base.purpose.energy * 0.84 + 0.68 * 0.16, 0.18, 0.92);
    base.purpose.confidence = clamp(base.purpose.confidence + 0.10);
    const secondary = { body: 'body', recovery: 'recovery', mind: 'mind', focus: 'mind', family: 'relationships', work: 'agency' }[context.challenge];
    if (secondary) {
      base[secondary].energy = clamp(base[secondary].energy * 0.90 + 0.55 * 0.10, 0.18, 0.92);
    }
  }

  // emotionalLoad (light|usual|heavy) → Mind + Relationships
  if (present(context.emotionalLoad)) {
    const lv = { light: 0.85, usual: 0.62, heavy: 0.32 }[context.emotionalLoad] ?? 0.5;
    base.mind.energy = clamp(base.mind.energy * 0.82 + lv * 0.18, 0.18, 0.92);
    base.mind.confidence = clamp(base.mind.confidence + 0.08);
    base.relationships.energy = clamp(base.relationships.energy * 0.88 + lv * 0.12, 0.18, 0.92);
    base.relationships.confidence = clamp(base.relationships.confidence + 0.07);
  }
}

export function buildHumanGraph(history = [], context = null) {
  const base = Object.fromEntries(HUMAN_DIMENSIONS.map(({ id }) => [id, {
    id,
    energy: 0.5,
    momentum: 0,
    confidence: history.length ? 0.45 : 0.2,
    volatility: 0.08
  }]));

  const completed = history.filter(item => item.completed && item.decision?.delta).slice(0, 30).reverse();
  const snapshots = Object.fromEntries(HUMAN_DIMENSIONS.map(({ id }) => [id, []]));

  completed.forEach((entry, index) => {
    const recency = 0.45 + (index + 1) / Math.max(completed.length, 1) * 0.55;
    HUMAN_DIMENSIONS.forEach(({ id }) => {
      const delta = Number(entry.decision.delta[id] || 0);
      base[id].energy = clamp(base[id].energy + delta * 0.07 * recency, 0.18, 0.92);
      snapshots[id].push(delta);
    });
  });

  HUMAN_DIMENSIONS.forEach(({ id }) => {
    const values = snapshots[id];
    if (values.length) {
      const recent = values.slice(-5);
      const older = values.slice(-10, -5);
      const recentAverage = average(recent);
      const olderAverage = older.length ? average(older) : 0;
      base[id].momentum = clamp((recentAverage - olderAverage) * 0.9, -1, 1);
      base[id].confidence = clamp(0.35 + Math.min(values.length, 12) * 0.045, 0.35, 0.88);
      base[id].volatility = clamp(standardDeviation(recent) * 0.8, 0.04, 0.55);
    }
  });

  applyContextSignals(base, context);

  return {
    nodes: HUMAN_DIMENSIONS.map(({ id, label }) => ({ ...base[id], label })),
    state: graphState(Object.values(base)),
    updatedAt: new Date().toISOString()
  };
}

// Build a graph that progressively awakens as check-in signals arrive.
// Unanswered domains start fully dormant; each answered signal lights up its domain.
// The organism visually feeds as the person responds — one signal, one awakening.
export function buildCheckinGraph(context = {}) {
  const dormant = { energy: 0.14, momentum: 0, confidence: 0.07, volatility: 0.05 };
  const base = Object.fromEntries(HUMAN_DIMENSIONS.map(({ id }) => [id, { id, ...dormant }]));

  // sleep (0-4) → Recovery awakens; Body stirs
  if (present(context.sleep)) {
    const s = clamp(Number(context.sleep) / 4);
    base.recovery.energy = 0.28 + s * 0.58;
    base.recovery.confidence = 0.52;
    base.body.energy = Math.max(base.body.energy, 0.18 + s * 0.16);
    base.body.confidence = Math.max(base.body.confidence, 0.16);
  }

  // energy (1-3) → Body awakens; Mind stirs
  if (present(context.energy)) {
    const e = clamp((Number(context.energy) - 1) / 2);
    base.body.energy = Math.max(base.body.energy, 0.28 + e * 0.58);
    base.body.confidence = Math.max(base.body.confidence, 0.52);
    base.mind.energy = Math.max(base.mind.energy, 0.16 + e * 0.14);
    base.mind.confidence = Math.max(base.mind.confidence, 0.14);
  }

  // soreness → Body modifier (can awaken alone or adjust if already active)
  if (present(context.soreness)) {
    const adj = { none: 0.08, mild: -0.06, significant: -0.22 }[context.soreness] ?? 0;
    if (base.body.confidence > 0.12) {
      base.body.energy = clamp(base.body.energy + adj, 0.14, 0.92);
    } else {
      base.body.energy = context.soreness === 'none' ? 0.56 : context.soreness === 'mild' ? 0.40 : 0.26;
      base.body.confidence = 0.38;
    }
  }

  // time → Agency awakens
  if (present(context.time)) {
    const tv = { 5: 0.18, 15: 0.44, 30: 0.68, 60: 0.92 }[Number(context.time)] ?? 0.5;
    base.agency.energy = 0.22 + tv * 0.62;
    base.agency.confidence = 0.52;
  }

  // challenge → Purpose awakens; secondary domain stirs
  if (present(context.challenge)) {
    base.purpose.energy = 0.65;
    base.purpose.confidence = 0.52;
    const secondary = { body: 'body', recovery: 'recovery', mind: 'mind', focus: 'mind', family: 'relationships', work: 'agency' }[context.challenge];
    if (secondary) {
      base[secondary].energy = Math.max(base[secondary].energy, 0.36);
      base[secondary].confidence = Math.max(base[secondary].confidence, 0.28);
    }
  }

  // emotionalLoad → Mind awakens; Relationships stirs
  if (present(context.emotionalLoad)) {
    const lv = { light: 0.85, usual: 0.62, heavy: 0.32 }[context.emotionalLoad] ?? 0.5;
    base.mind.energy = Math.max(base.mind.energy, 0.22 + lv * 0.56);
    base.mind.confidence = Math.max(base.mind.confidence, 0.52);
    base.relationships.energy = Math.max(base.relationships.energy, 0.18 + lv * 0.34);
    base.relationships.confidence = Math.max(base.relationships.confidence, 0.24);
  }

  return {
    nodes: HUMAN_DIMENSIONS.map(({ id, label }) => ({ ...base[id], label })),
    state: 'Awakening',
    updatedAt: new Date().toISOString()
  };
}

export function projectHumanReturn(graph, delta = {}) {
  return {
    ...graph,
    nodes: graph.nodes.map(node => ({
      ...node,
      energy: clamp(node.energy + Number(delta[node.id] || 0) * 0.08, 0.12, 0.96)
    }))
  };
}

function graphState(nodes) {
  const momentum = average(nodes.map(node => node.momentum));
  const energy = average(nodes.map(node => node.energy));
  if (momentum > 0.08) return 'Growing';
  if (energy < 0.42) return 'Recovering';
  if (energy < 0.5) return 'Dormant';
  return 'Stable';
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function standardDeviation(values) {
  if (values.length < 2) return 0;
  const mean = average(values);
  return Math.sqrt(average(values.map(value => (value - mean) ** 2)));
}
