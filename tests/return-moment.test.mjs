import test from 'node:test';
import assert from 'node:assert/strict';
import {recentActivityDays,returnMoment,dailyReflectionQuestion} from '../src/core/return-moment.js';
import {renderTodayPaths} from '../src/components/today-paths.js';
const now=new Date(2026,10,6,12);
test('return moment counts only recorded events in last seven local dates and deduplicates same day',()=>{
 const state={dailyStories:[{day:'2026-11-06',stage:'opened'}],dailyCheckIns:[{day:'2026-11-06'},{day:'2026-11-05'},{day:'2026-10-01'}],history:[{completedAt:'2026-11-05T10:00:00'},{completedAt:'2026-11-04T11:00:00'}],emotionalJournalEntries:[{entryDate:'2026-11-04'}]};
 assert.equal(recentActivityDays(state,now),3);
 assert.equal(recentActivityDays({dailyStories:[{day:'2026-11-06'}]},now),0);
 assert.equal(recentActivityDays({dailyCheckIns:[{day:'2026-10-31'}]},now),0);
 for(const language of ['pt','en']){
  const moment=returnMoment(state,language,now);
  assert.equal(moment.days,3);
  assert.ok(moment.eyebrow.includes('3'));
  assert.ok(moment.journey.length>30);
  assert.ok(moment.question.length>12);
  const html=renderTodayPaths({language,eyebrow:moment.eyebrow});
  assert.equal((html.match(/class="today-path"/g)||[]).length,3);
 }
});
test('daily prompts vary by weekday without pressure or a streak count',()=>{
 const one=dailyReflectionQuestion('pt',new Date(2026,10,6,12));
 const two=dailyReflectionQuestion('pt',new Date(2026,10,7,12));
 assert.notEqual(one,two);
 assert.notEqual(one,dailyReflectionQuestion('en',new Date(2026,10,6,12)));
 assert.match(returnMoment({},'pt',now).journey,/Ainda não há registos/);
});
