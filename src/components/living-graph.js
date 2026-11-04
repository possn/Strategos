const polar = (cx, cy, radius, angle) => {
  const radians = (angle - 90) * Math.PI / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
};

// Ambient presence is deliberately neutral: no inferred health state or moving geometry.
export function renderAmbientOrganism(){
  const nodes=Array.from({length:6},(_,index)=>{
    const point=polar(120,120,76,index*60);
    return `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="4" class="ambient-node"/>`;
  }).join('');
  return `<div class="ambient-organism" role="img" aria-label="Presença visual do Strategos, sem pontuação de saúde"><svg viewBox="0 0 240 240" aria-hidden="true"><circle class="ambient-halo" cx="120" cy="120" r="54"/><circle class="ambient-orbit" cx="120" cy="120" r="76"/><circle class="ambient-inner" cx="120" cy="120" r="44"/>${nodes}<circle class="ambient-core" cx="120" cy="120" r="9"/></svg></div>`;
}

export function renderLivingGraph(graph, { compact = false, ambient = false } = {}) {
  if(ambient)return renderAmbientOrganism();
  const size = compact ? 240 : 310;
  const center = size / 2;
  const radius = compact ? 78 : 101;
  const nodes = graph.nodes.map((node, index) => {
    const angle = index * 60;
    const point = polar(center, center, radius, angle);
    const core = 4.5 + node.energy * 6;
    const halo = core + 5 + node.volatility * 8;
    return { ...node, ...point, angle, core, halo };
  });

  const connections = nodes.map((node, index) => {
    const next = nodes[(index + 1) % nodes.length];
    const opacity = 0.12 + ((node.energy + next.energy) / 2) * 0.36;
    const d1 = `M ${node.x.toFixed(1)} ${node.y.toFixed(1)} Q ${center} ${center} ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
    return `<path class="graph-link" style="opacity:${opacity.toFixed(2)}" d="${d1}"/>`;
  }).join('');

  const nodeMarkup = nodes.map(node => {
    const labelPoint = polar(center, center, radius + (compact ? 32 : 42), node.angle);
    const trend = node.momentum > 0.04 ? '↑' : node.momentum < -0.04 ? '↓' : '•';
    return `<g class="graph-node" data-dimension="${node.id}">
      <circle class="node-halo" cx="${node.x}" cy="${node.y}" r="${node.halo.toFixed(1)}" style="opacity:${(0.06 + node.confidence * 0.14).toFixed(2)}"/>
      <circle class="node-core" cx="${node.x}" cy="${node.y}" r="${node.core.toFixed(1)}"/>
      <text class="node-label" x="${labelPoint.x.toFixed(1)}" y="${labelPoint.y.toFixed(1)}">${node.label}</text>
      <text class="node-trend" x="${node.x.toFixed(1)}" y="${(node.y + 3).toFixed(1)}">${trend}</text>
    </g>`;
  }).join('');

  return `<section class="living-graph ${compact ? 'compact' : ''}" aria-label="Living Human Graph">
    <div class="graph-heading"><div><p class="eyebrow">LIVING HUMAN GRAPH</p><h3>Your current pattern</h3></div><span class="graph-state">${graph.state}</span></div>
    <svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Six dimensions of human flourishing">
      <circle class="graph-orbit" cx="${center}" cy="${center}" r="${radius}"/>
      <g class="graph-web">${connections}</g>
      <circle class="graph-pulse" cx="${center}" cy="${center}" r="${compact ? 18 : 23}"/>
      <circle class="graph-center" cx="${center}" cy="${center}" r="${compact ? 7 : 9}"/>
      ${nodeMarkup}
    </svg>
    <p class="graph-note">Not a score. A living model that becomes clearer through your choices.</p>
  </section>`;
}
