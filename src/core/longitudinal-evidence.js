export function buildLongitudinalEvidence({patterns=[],transfers=[],context={}}={}){
  const targetContextKey=[context.challenge||'unknown',context.soreness||'unknown',context.emotionalLoad||'unknown'].join('|');
  const transferByPattern=new Map((transfers||[]).filter(x=>x.targetContextKey===targetContextKey&&x.status!=='rejected').map(x=>[x.patternId,x]));
  const items=[],scoreAdjustments={};
  for(const pattern of patterns||[]){
    if(!['emerging','stable'].includes(pattern.status))continue;
    const transfer=transferByPattern.get(pattern.id);
    if(!transfer?.weight)continue;
    const positive=Number(pattern.positive||0),negative=Number(pattern.negative||0);
    const sign=positive>negative?1:negative>positive?-1:0;
    if(!sign)continue;
    const adjustment=+(Math.min(.14,Math.max(0,Number(transfer.weight)))*sign).toFixed(3);
    scoreAdjustments[pattern.practiceId]=+((scoreAdjustments[pattern.practiceId]||0)+adjustment).toFixed(3);
    items.push({patternId:pattern.id,practiceId:pattern.practiceId,status:pattern.status,direction:sign>0?'support':'caution',adjustment,observations:Number(pattern.observations||0),causalStrength:Number(pattern.causalStrength||0),sourceContextKey:pattern.contextKey,targetContextKey,transferStatus:transfer.status,transferSimilarity:Number(transfer.similarity||0),explanation:sign>0?`Repeated outcomes cautiously support ${pattern.practiceId} in a similar context.`:`Repeated outcomes caution against ${pattern.practiceId} in a similar context.`});
  }
  return {targetContextKey,scoreAdjustments,items,status:items.length?'available':'none'};
}
export function applyLongitudinalAdjustments(totals,evidence){
  const next={...(totals||{})};
  for(const [id,v] of Object.entries(evidence?.scoreAdjustments||{}))next[id]=+((next[id]||0)+Number(v||0)).toFixed(3);
  return next;
}
export function longitudinalConfidenceAdjustment(evidence){
  if(!evidence?.items?.length)return 0;
  const support=evidence.items.filter(x=>x.status==='stable'&&x.transferStatus==='supported'&&x.observations>=4&&x.causalStrength>=.5).length;
  const caution=evidence.items.filter(x=>x.direction==='caution').length;
  return +(Math.min(.03,support*.01)-Math.min(.04,caution*.015)).toFixed(3);
}
export function verifyLongitudinalEvidence(evidence){
  const reasons=[];
  if(!evidence||typeof evidence!=='object')reasons.push('Evidence payload is missing.');
  for(const item of evidence?.items||[]){
    if(Math.abs(Number(item.adjustment||0))>.14)reasons.push(`Pattern ${item.patternId} exceeds the influence boundary.`);
    if(item.sourceContextKey===undefined||item.targetContextKey===undefined)reasons.push(`Pattern ${item.patternId} lacks context provenance.`);
    if(!['support','caution'].includes(item.direction))reasons.push(`Pattern ${item.patternId} has an invalid direction.`);
  }
  return {valid:reasons.length===0,reasons};
}
export function longitudinalEvidenceSummary(evidence){
  if(!evidence?.items?.length)return 'No longitudinal evidence influenced this judgement.';
  return `${evidence.items.length} bounded longitudinal signals: ${evidence.items.filter(x=>x.direction==='support').length} support, ${evidence.items.filter(x=>x.direction==='caution').length} caution.`;
}
