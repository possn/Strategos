import { localDayKey,dailyCheckInForDay } from './daily-signals.js?v=0476p1';

export function resolveStartupDestination(state){
  if(!state?.profile||!state?.onboardingVersion){
    return {
      route:'onboarding',
      reason:'onboarding-required',
      resumable:false
    };
  }

  const continuity=resolveContinuityDestination(state);

  // Something active to resume — surface through Today
  if(continuity.resumable){
    return {route:'today',reason:'returning-person',resumable:true};
  }

  // Fresh day, no check-in yet — go directly to check-in
  const checkin=dailyCheckInForDay(state.dailyCheckIns||[],localDayKey());
  if(!checkin){
    return {route:'checkin',reason:'daily-checkin-required',resumable:false};
  }

  return {route:'today',reason:'returning-person',resumable:false};
}

export function resolveContinuityDestination(state){
  const current=state?.current;

  if(!current){
    return {
      route:'today',
      reason:'no-active-flow',
      resumable:false
    };
  }

  if(['paused','interrupted','active'].includes(current.execution?.status)){
    return {
      route:'resumePrompt',
      reason:current.execution?.status==='active'
        ?'practice-recovered-after-reload'
        :'practice-interrupted',
      resumable:true
    };
  }

  if(current.execution?.status==='completed'&&!current.completed){
    return {
      route:'reflect',
      reason:'reflection-pending',
      resumable:true
    };
  }

  if(current.decision&&!current.startedAt){
    return {
      route:'judgement',
      reason:'judgement-pending',
      resumable:true
    };
  }

  return {
    route:'today',
    reason:'safe-default',
    resumable:false
  };
}

export function buildContinuityNotice(state){
  const destination=resolveContinuityDestination(state);
  const messages={
    'practice-interrupted':'Your Practice was preserved.',
    'practice-recovered-after-reload':'Your active Practice was recovered.',
    'reflection-pending':'Your Practice is complete. Reflection is still waiting.',
    'judgement-pending':'Your current judgement is still available.',
    'no-active-flow':'Today is ready.',
    'safe-default':'Today is ready.'
  };

  return {
    ...destination,
    message:messages[destination.reason]||'Strategos is ready.'
  };
}

export function shouldShowContinuityCard(state){
  return resolveContinuityDestination(state).resumable;
}
