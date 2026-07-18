export const HUMAN_DIMENSIONS = [
  { id: 'body', label: 'Body' },
  { id: 'mind', label: 'Mind' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'purpose', label: 'Purpose' },
  { id: 'legacy', label: 'Legacy' },
  { id: 'agency', label: 'Agency' }
];

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

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

  if (context) {
    const sleep = Number(context.sleep || 2) / 4;
    const energy = Number(context.energy || 2) / 3;
    base.body.energy = clamp(base.body.energy * 0.76 + ((sleep + energy) / 2) * 0.24, 0.18, 0.92);
    base.mind.energy = clamp(base.mind.energy * 0.84 + energy * 0.16, 0.18, 0.92);
    base.body.confidence = clamp(base.body.confidence + 0.12);
    base.mind.confidence = clamp(base.mind.confidence + 0.08);
  }

  return {
    nodes: HUMAN_DIMENSIONS.map(({ id, label }) => ({ ...base[id], label })),
    state: graphState(Object.values(base)),
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
