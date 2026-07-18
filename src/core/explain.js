export function buildExplanation(decision, context = {}) {
  const observations = [
    `You reported ${sleepLabel(context.sleep)} sleep.`,
    `Your energy is ${energyLabel(context.energy)}.`,
    `You have about ${Number(context.time || decision.duration)} minutes available.`,
    `Today, ${claimLabel(context.challenge)} has the strongest claim on your attention.`
  ];
  if (context.soreness) observations.push(`You described physical soreness as ${context.soreness}.`);
  if (context.emotionalLoad) observations.push(`You described today’s emotional load as ${context.emotionalLoad}.`);

  const ranked = [...decision.advisors]
    .sort((a, b) => (b.scores[decision.practice.id] || 0) - (a.scores[decision.practice.id] || 0));
  const strongest = ranked[0];
  const counterweight = ranked.find(a => a.position === 'Caution' || a.position === 'Oppose');

  const inferences = [decision.understanding.summary];
  if (strongest) inferences.push(`${strongest.advisor} carried the greatest weight because ${lowerFirst(strongest.reason)}`);
  if (counterweight && counterweight !== strongest) inferences.push(`${counterweight.advisor} limited the strength of the judgement because ${lowerFirst(counterweight.reason)}`);

  const changeConditions = [];
  if (!context.soreness) changeConditions.push('Significant pain or soreness would make me reassess the physical cost.');
  if (!context.emotionalLoad) changeConditions.push('Unusual emotional exhaustion could shift the judgement toward recovery or connection.');
  changeConditions.push('A meaningful change in available time would alter the feasible practice.');

  return {
    observations,
    inferences,
    decisiveFactors: ranked.slice(0, 3).map(a => ({ advisor: a.advisor, reason: a.reason })),
    unknowns: decision.unknowns,
    changeConditions,
    confidenceStatement: confidenceText(decision.confidence)
  };
}

function sleepLabel(value) { return ({1:'poor',2:'fair',3:'good',4:'excellent'})[value] || 'unreported'; }
function energyLabel(value) { return ({1:'low',2:'moderate',3:'high'})[value] || 'unreported'; }
function claimLabel(value) { return ({body:'your body',mind:'mental clarity',focus:'focused work',recovery:'recovery',family:'your relationships',work:'meaningful work'})[value] || 'your current priorities'; }
function lowerFirst(text='') { return text ? text[0].toLowerCase() + text.slice(1) : ''; }
function confidenceText(value) {
  if (value >= 85) return 'I have relatively strong confidence, while remaining open to correction.';
  if (value >= 70) return 'I have moderate confidence. A missing signal could still change this judgement.';
  return 'My confidence is limited. Treat this as a cautious working hypothesis.';
}
