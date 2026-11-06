import test from 'node:test';
import assert from 'node:assert/strict';
import {recentReportedPattern,shortPatternDescription,longitudinalReason} from '../src/core/recent-reported-pattern.js';
import {contextualNextStep} from '../src/core/contextual-next-step.js';
import {mindfulFeedbackPreference} from '../src/core/mindful-feedback.js';
import {renderTodayPaths} from '../src/components/today-paths.js';

const now=new Date(2026,10,6,12);
// Use local date serialization independently of locale support.
const check=(offset,signals)=>{
 const d=new Date(2026,10,6-offset,12);
 return {day:[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'),signals};
};
const history=(...signals)=>({dailyCheckIns:signals.map((s,i)=>check(i,s))});
const feedback=(outcome,daysAgo)=>({practice:'mindfulness-90',outcome,at:new Date(Date.UTC(2026,10,6-daysAgo,10)).toISOString()});

test('a pattern requires three distinct recent recorded days and two matching observations',()=>{
 assert.equal(recentReportedPattern([],now),null);
 assert.equal(recentReportedPattern([check(1,{energy:1}),check(2,{energy:1})],now),null);
 assert.equal(recentReportedPattern([check(1,{energy:1}),check(1,{energy:1}),check(2,{energy:2})],now),null);
 const entries=[check(1,{sleep:1}),check(2,{sleep:2}),check(3,{energy:3})];
 const pattern=recentReportedPattern(entries,now);
 assert.equal(pattern.signal,'sleep');
 assert.equal(pattern.kind,'recovery');
 assert.equal(pattern.count,2);
 assert.equal(pattern.observedDays,3);
 assert.equal(recentReportedPattern([check(7,{sleep:1}),check(8,{sleep:1}),check(2,{sleep:4})],now),null);
 assert.equal(recentReportedPattern([check(1,{sleep:0}),check(2,{sleep:null}),check(3,{sleep:4})],now),null);
 assert.equal(recentReportedPattern(history({emotionalLoad:'usual'},{emotionalLoad:'usual'},{energy:3}).dailyCheckIns,now),null);
});

test('one premium card reflects confirmed pattern with clear self-report provenance in both languages',()=>{
 const state=history({challenge:'body'},{energy:1},{energy:1});
 for(const lang of ['pt','en']){
  const pattern=recentReportedPattern(state.dailyCheckIns,now);
  assert.equal(pattern.signal,'energy');
  const next=contextualNextStep(state,lang,now);
  assert.equal(next.kind,'recovery');
  assert.equal(next.basis,'recent-self-report');
  assert.equal(next.action,'open-mindfulness');
  assert.match(next.description,/2/);
  assert.ok(longitudinalReason(pattern,lang).length>40);
  assert.ok(shortPatternDescription(pattern,lang).length<90);
  const html=renderTodayPaths({language:lang,nextStep:next});
  assert.equal((html.match(/class="today-path"/g)||[]).length,3);
  assert.match(html,/data-action="open-mindfulness"/);
 }
});
test('today has priority; a good today signal contradicts a matching historical pattern',()=>{
 const good=history({sleep:4},{sleep:1},{sleep:1});
 const next=contextualNextStep(good,'en',now);
 assert.equal(next.kind,'mindful');
 assert.equal(next.basis,'none');
 const stressed=history({emotionalLoad:'heavy'},{sleep:1},{sleep:1});
 assert.equal(contextualNextStep(stressed,'pt',now).kind,'stress');
 assert.equal(contextualNextStep(stressed,'pt',now).basis,'today-self-report');
 const challenge=history({challenge:'work'},{energy:1},{energy:1});
 assert.equal(contextualNextStep(challenge,'pt',now).kind,'reflection');
});
test('old feedback stops influencing suggestions without deleting user data',()=>{
 const negatives=[feedback('not-helpful',40),feedback('not-helpful',39)];
 assert.equal(mindfulFeedbackPreference(negatives).offerAlternative,true);
 assert.equal(mindfulFeedbackPreference(negatives,{now}).offerAlternative,false);
 assert.equal(contextualNextStep({mindfulFeedback:negatives},'pt',now).kind,'mindful');
 const recent=[feedback('not-helpful',1),feedback('not-helpful',2)];
 assert.equal(contextualNextStep({mindfulFeedback:recent},'pt',now).kind,'alternative');
 assert.equal(contextualNextStep({mindfulFeedback:recent,...history({energy:1})},'pt',now).kind,'recovery');
});
