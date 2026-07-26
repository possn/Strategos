import { buildPracticeSessionSnapshot,formatDuration } from './practice-session.js?v=0476p1';

export function buildPracticeExitModel({phases=[],execution=null}={}){
  const snapshot=buildPracticeSessionSnapshot({phases,execution});
  const percent=Math.round(snapshot.progressRatio*100);

  return {
    snapshot,
    percent,
    title:'Pause or end this Practice?',
    statement:snapshot.current
      ?`You are in “${snapshot.current.name}” with ${formatDuration(snapshot.current.remainingSeconds)} remaining.`
      :'Strategos will preserve the current Practice until you decide.',
    recordStatement:percent>0
      ?`Ending and recording will keep ${percent}% completion in Journey.`
      :'Ending and recording will keep an interrupted Practice in Journey.',
    discardStatement:'Discarding removes this session from Journey and from Practice learning.'
  };
}

export function canResumePractice(execution){
  return Boolean(execution&&['active','paused'].includes(execution.status));
}

export function normalisePracticeExitReason(reason){
  const allowed=['person-ended','interrupted-ended','person-discarded','interrupted-discarded'];
  return allowed.includes(reason)?reason:'person-ended';
}
