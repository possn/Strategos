export const MOVEMENT_PREFERENCES=Object.freeze({
  'none-declared':'Não indicar uma limitação de movimento',
  'avoid-strength':'Evitar treino de força',
  'avoid-movement':'Evitar práticas com movimento'
});

export function normaliseHealthContext(input){
  if(!input||input.consentVersion!==1||input.source!=='person'||!Object.hasOwn(MOVEMENT_PREFERENCES,input.movementPreference))return null;
  if(typeof input.updatedAt!=='string'||!Number.isFinite(Date.parse(input.updatedAt)))return null;
  return {movementPreference:input.movementPreference,consentVersion:1,source:'person',updatedAt:input.updatedAt};
}
export function createHealthContext(movementPreference,{now=new Date()}={}){
  return normaliseHealthContext({movementPreference,consentVersion:1,source:'person',updatedAt:now.toISOString()});
}
export function withHealthContext(context={},healthContext=null){
  const {movementPreference:previous,...signals}=context||{};
  const health=normaliseHealthContext(healthContext);
  return {...signals,movementPreference:health?.movementPreference||'not-shared'};
}
export function healthContextSummary(input){
  const health=normaliseHealthContext(input);
  return health?MOVEMENT_PREFERENCES[health.movementPreference]:'Ainda não indicado. É opcional.';
}
export function canEditHealthContext(state){
  return !['active','paused','interrupted'].includes(state?.current?.execution?.status);
}
