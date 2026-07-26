import { migrateState, STATE_SCHEMA_VERSION, PRODUCT_VERSION } from './state-schema.js?v=0476p1';

export const STATE_EXPORT_FORMAT = 'onearete-strategos-state';
export const STATE_EXPORT_VERSION = 1;

export function createStateExport(state,{now=new Date()}={}){
  const payload=migrateState(state);
  return {
    format:STATE_EXPORT_FORMAT,
    exportVersion:STATE_EXPORT_VERSION,
    schemaVersion:STATE_SCHEMA_VERSION,
    productVersion:PRODUCT_VERSION,
    exportedAt:now.toISOString(),
    state:payload,
    checksum:checksum(JSON.stringify(payload))
  };
}

export function serializeStateExport(state,options){
  return JSON.stringify(createStateExport(state,options),null,2);
}

export function validateStateImport(value){
  const parsed=typeof value==='string'?safeParse(value):value;
  if(!parsed||typeof parsed!=='object')return {ok:false,error:'The selected file is not valid JSON.'};
  if(parsed.format!==STATE_EXPORT_FORMAT)return {ok:false,error:'This is not a Strategos state export.'};
  if(parsed.exportVersion!==STATE_EXPORT_VERSION)return {ok:false,error:'This Strategos export format is not supported.'};
  if(!parsed.state||typeof parsed.state!=='object')return {ok:false,error:'The export does not contain a valid state.'};
  const expected=checksum(JSON.stringify(parsed.state));
  if(parsed.checksum!==expected)return {ok:false,error:'The export failed its integrity check.'};
  try{
    const state=migrateState(parsed.state);
    return {ok:true,error:null,state,metadata:{exportedAt:parsed.exportedAt,productVersion:parsed.productVersion,schemaVersion:parsed.schemaVersion}};
  }catch(_){
    return {ok:false,error:'The exported state could not be migrated safely.'};
  }
}

export function createImportPreview(state,metadata={}){
  return {
    profileName:state.profile?.name||'No profile name',
    historyCount:Array.isArray(state.history)?state.history.length:0,
    judgementCount:Array.isArray(state.judgements)?state.judgements.length:0,
    advisorMemoryCount:Object.keys(state.advisorMemories||{}).length,
    hasActivePractice:Boolean(state.current),
    exportedAt:metadata.exportedAt||null,
    sourceProductVersion:metadata.productVersion||null
  };
}

export function exportFilename(now=new Date()){
  return `strategos-state-${now.toISOString().slice(0,10)}.json`;
}

function safeParse(value){try{return JSON.parse(value)}catch(_){return null}}
function checksum(text){
  let hash=2166136261;
  for(let i=0;i<text.length;i++){
    hash^=text.charCodeAt(i);
    hash=Math.imul(hash,16777619);
  }
  return (hash>>>0).toString(16).padStart(8,'0');
}
