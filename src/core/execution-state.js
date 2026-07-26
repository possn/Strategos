export const EXECUTION_STATUS={
  READY:'ready',
  ACTIVE:'active',
  PAUSED:'paused',
  COMPLETED:'completed',
  ABANDONED:'abandoned'
};

export function createExecutionState(phases,{now=Date.now(),phaseIndex=0}={}){
  if(!Array.isArray(phases)||!phases.length) throw new TypeError('Practice phases are required.');
  const duration=Number(phases[phaseIndex]?.[1]);
  if(!Number.isFinite(duration)||duration<=0) throw new TypeError('Phase duration must be positive.');
  return {
    status:EXECUTION_STATUS.ACTIVE,
    phaseIndex,
    phaseStartedAt:new Date(now).toISOString(),
    phaseDuration:duration,
    pausedAt:null,
    totalPausedDuration:0,
    updatedAt:new Date(now).toISOString()
  };
}

export function remainingSeconds(execution,{now=Date.now()}={}){
  if(!execution) return 0;
  const duration=Math.max(0,Number(execution.phaseDuration)||0);
  const started=Date.parse(execution.phaseStartedAt||'');
  if(!Number.isFinite(started)) return duration;
  const endpoint=execution.status===EXECUTION_STATUS.PAUSED && execution.pausedAt
    ? Date.parse(execution.pausedAt)
    : now;
  const elapsed=Math.max(0,(endpoint-started)/1000-(Number(execution.totalPausedDuration)||0));
  return Math.max(0,Math.ceil(duration-elapsed));
}

export function pauseExecution(execution,{now=Date.now()}={}){
  if(!execution||execution.status!==EXECUTION_STATUS.ACTIVE) return execution;
  return {...execution,status:EXECUTION_STATUS.PAUSED,pausedAt:new Date(now).toISOString(),updatedAt:new Date(now).toISOString()};
}

export function resumeExecution(execution,{now=Date.now()}={}){
  if(!execution||execution.status!==EXECUTION_STATUS.PAUSED) return execution;
  const pausedAt=Date.parse(execution.pausedAt||'');
  const extra=Number.isFinite(pausedAt)?Math.max(0,(now-pausedAt)/1000):0;
  return {...execution,status:EXECUTION_STATUS.ACTIVE,pausedAt:null,totalPausedDuration:(Number(execution.totalPausedDuration)||0)+extra,updatedAt:new Date(now).toISOString()};
}

export function startPhase(execution,phases,phaseIndex,{now=Date.now()}={}){
  const next=createExecutionState(phases,{now,phaseIndex});
  return {...next,startedAt:execution?.startedAt||new Date(now).toISOString()};
}

export function closeExecution(execution,status,{now=Date.now(),reason=null}={}){
  if(![EXECUTION_STATUS.COMPLETED,EXECUTION_STATUS.ABANDONED].includes(status)) throw new TypeError('Invalid closing status.');
  return {...execution,status,pausedAt:null,endedAt:new Date(now).toISOString(),updatedAt:new Date(now).toISOString(),reason};
}

export function isResumable(execution){
  return Boolean(execution&&[EXECUTION_STATUS.ACTIVE,EXECUTION_STATUS.PAUSED].includes(execution.status));
}
