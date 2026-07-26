import { normaliseDailySignals } from './daily-signals.js?v=0476p1';

const CLAIM_LABELS={body:'physical capacity',mind:'mental clarity',focus:'protected attention',recovery:'recovery',family:'relationships',work:'meaningful work'};

export function buildDailyOrientation(signals={}, {profile=null, personalEvidence=null}={}){
  const s=normaliseDailySignals(signals);
  const constraints=[];
  const supports=[];
  if(s.sleep<=1)constraints.push('poor sleep'); else if(s.sleep>=4)supports.push('strong sleep');
  if(s.energy<=1)constraints.push('low energy'); else if(s.energy>=3)supports.push('high energy');
  if(s.soreness==='significant')constraints.push('significant soreness'); else if(s.soreness==='mild')constraints.push('mild soreness');
  if(s.emotionalLoad==='heavy')constraints.push('heavy emotional load'); else if(s.emotionalLoad==='light')supports.push('light emotional load');
  if(s.time<=5)constraints.push('a five-minute window'); else if(s.time>=30)supports.push(`${s.time} minutes available`);

  let posture='balanced';
  if(s.soreness==='significant'||s.sleep===1||(s.energy===1&&s.emotionalLoad==='heavy'))posture='protect';
  else if(s.energy===3&&s.sleep>=3&&s.soreness==='none'&&s.emotionalLoad!=='heavy')posture='advance';

  const title=posture==='protect'?'Protect capacity before adding demand.':posture==='advance'?'There is room for deliberate progress.':'Balance progress with today’s available capacity.';
  const primary=`${CLAIM_LABELS[s.challenge]||'today’s stated priority'} has the strongest declared claim.`;
  const constraintText=constraints.length?`Current constraints: ${constraints.join(', ')}.`:'No major constraint was declared.';
  const supportText=supports.length?`Available support: ${supports.join(', ')}.`:'Available support remains moderate.';
  const evidence=personalEvidence?.strongest&&personalEvidence.strongest.directionalCount>=3?{
    practiceName:personalEvidence.strongest.practiceName,
    statement:`Repeated outcomes suggest ${personalEvidence.strongest.practiceName} has helped in ${Math.round(personalEvidence.strongest.helpRate*100)}% weighted terms.`,
    influence:0
  }:null;
  return {
    posture,title,primary,constraintText,supportText,evidence,
    nextStep:'The Agora will compare viable actions, costs and safety boundaries before making a recommendation.',
    profileContext:profile?.experience?`Experience context: ${profile.experience}.`:null,
    automaticDecisionInfluence:0
  };
}

export function dailyOrientationSummary(o){
  if(!o)return 'Daily orientation unavailable.';
  return `${o.title} ${o.primary} ${o.constraintText}`;
}

export function recentCheckInTrajectory(checkIns=[], limit=7){
  const rows=[...(checkIns||[])].filter(x=>x?.day&&x?.signals).sort((a,b)=>String(b.day).localeCompare(String(a.day))).slice(0,limit);
  if(!rows.length)return {days:0,averageSleep:null,averageEnergy:null,dominantClaim:null,statement:'No daily check-in history yet.'};
  const avg=k=>rows.reduce((sum,r)=>sum+Number(normaliseDailySignals(r.signals)[k]),0)/rows.length;
  const claims={}; rows.forEach(r=>{const c=normaliseDailySignals(r.signals).challenge;claims[c]=(claims[c]||0)+1});
  const dominantClaim=Object.entries(claims).sort((a,b)=>b[1]-a[1])[0]?.[0]||null;
  return {days:rows.length,averageSleep:avg('sleep'),averageEnergy:avg('energy'),dominantClaim,statement:`Across ${rows.length} day${rows.length===1?'':'s'}, average sleep was ${avg('sleep').toFixed(1)}/4 and energy ${avg('energy').toFixed(1)}/3.`};
}
