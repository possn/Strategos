import { CODEX } from '../data/codex.js';

const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));

export function decide(context, history = []) {
  const sleep = context.sleep / 4;
  const energy = context.energy / 3;
  const recentStrength = history.slice(0, 2).some(x => x.decision?.mission?.id === 'strength' && x.completed);
  const time = context.time;
  const scores = {};

  scores.strength = 0.25 + sleep * 0.25 + energy * 0.32 + (time >= 15 ? 0.18 : -0.5) - (recentStrength ? 0.22 : 0);
  scores.recovery = 0.18 + (1 - sleep) * 0.38 + (1 - energy) * 0.26 + (context.challenge === 'recovery' ? 0.25 : 0);
  scores.focus = 0.2 + energy * 0.22 + (context.challenge === 'focus' || context.challenge === 'work' ? 0.38 : 0) + (time >= 15 ? 0.12 : -0.15);
  scores.walk = 0.26 + (1 - energy) * 0.14 + (context.challenge === 'mind' ? 0.18 : 0) + (time >= 5 ? 0.14 : 0);
  scores.connection = 0.16 + (context.challenge === 'family' ? 0.55 : 0) + (time >= 5 ? 0.12 : 0);

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [winnerId, winnerScore] = ranked[0];
  const mission = CODEX.find(m => m.id === winnerId);
  const duration = [...mission.durationOptions].reverse().find(d => d <= time) || mission.durationOptions[0];
  const confidence = Math.round(clamp(0.58 + (winnerScore - ranked[1][1]) * 0.65, 0.56, 0.96) * 100);
  const reasons = buildReasons(winnerId, context, recentStrength);
  const alternatives = ranked.slice(1, 3).map(([id]) => CODEX.find(m => m.id === id).name);
  const delta = scaleDelta(mission.baseDelta, duration / 15);
  return { mission, duration, confidence, reasons, alternatives, delta, scores };
}

function buildReasons(id, c, recentStrength) {
  const reasons = [];
  if (id === 'strength') {
    reasons.push(c.energy >= 2 ? 'Your reported energy supports productive work.' : 'A short strength dose is appropriate today.');
    reasons.push(c.sleep >= 3 ? 'Sleep was adequate for adaptation.' : 'The session is constrained to protect recovery.');
    if (!recentStrength) reasons.push('No recent strength mission creates a useful training opportunity.');
  }
  if (id === 'recovery') {
    reasons.push(c.sleep <= 2 ? 'Sleep was below your useful baseline.' : 'Your current energy favours restoration.');
    reasons.push('Recovery preserves tomorrow’s capacity rather than forcing output today.');
  }
  if (id === 'focus') {
    reasons.push('Your principal challenge requires concentrated attention.');
    reasons.push(`${c.time} uninterrupted minutes can create a meaningful result.`);
  }
  if (id === 'walk') {
    reasons.push('Low-friction movement offers a reliable return today.');
    reasons.push('Walking supports both mental clarity and physical recovery.');
  }
  if (id === 'connection') {
    reasons.push('The most important pressure today is relational, not physical.');
    reasons.push('Deliberate presence creates the highest expected return.');
  }
  return reasons.slice(0, 3);
}

function scaleDelta(delta, factor) {
  const out = {};
  for (const [key, value] of Object.entries(delta)) out[key] = +(value * Math.min(1.4, Math.max(0.5, factor))).toFixed(2);
  out.overall = +Object.values(out).filter(v => v > 0).reduce((a, b) => a + b, 0).toFixed(2);
  return out;
}
