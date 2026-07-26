import { createInitialState, migrateState, STATE_SCHEMA_VERSION, PRODUCT_VERSION } from './state-schema.js?v=0476p1';

const KEY='onearete.strategos.v090';
const BACKUP_KEY='onearete.strategos.v090.backup';
const LEGACY_KEYS=['onearete.strategos.v081','onearete.strategos.v080','onearete.strategos.v070','onearete.strategos.v061','onearete.strategos.v06','onearete.strategos.v05','onearete.strategos.v03'];
export const ONBOARDING_VERSION=3;
export { STATE_SCHEMA_VERSION, PRODUCT_VERSION };

export function loadState(){
  try{
    let raw=localStorage.getItem(KEY);
    let sourceKey=KEY;
    if(!raw){
      for(const key of LEGACY_KEYS){
        raw=localStorage.getItem(key);
        if(raw){sourceKey=key;break}
      }
    }
    const parsed=raw?JSON.parse(raw):{};
    const state=migrateState(parsed);
    const result=saveState(state);
    if(!result.ok) return {...state,persistenceWarning:result.error};
    if(sourceKey!==KEY){
      try{localStorage.removeItem(sourceKey)}catch(_){}
    }
    return state;
  }catch(error){
    console.warn('Strategos state could not be loaded.',error);
    const recovered=loadBackup();
    if(recovered.ok)return {...recovered.state,persistenceWarning:'The primary state could not be read. Strategos restored the most recent local backup.'};
    return {...createInitialState(),persistenceWarning:'Stored data could not be read. A new local state was opened.'};
  }
}

export function saveState(state,{backup=false}={}){
  try{
    const payload={...state,schemaVersion:STATE_SCHEMA_VERSION,productVersion:PRODUCT_VERSION};
    delete payload.persistenceWarning;
    if(backup){
      const existing=localStorage.getItem(KEY);
      if(existing)localStorage.setItem(BACKUP_KEY,existing);
    }
    localStorage.setItem(KEY,JSON.stringify(payload));
    return {ok:true,error:null};
  }catch(error){
    console.warn('Could not persist Strategos state.',error);
    return {ok:false,error:'Strategos could not save this change in the browser.'};
  }
}

export function createLocalBackup(){
  try{
    const existing=localStorage.getItem(KEY);
    if(existing)localStorage.setItem(BACKUP_KEY,existing);
    return {ok:true,error:null};
  }catch(_){return {ok:false,error:'Strategos could not create a local backup.'}}
}

export function loadBackup(){
  try{
    const raw=localStorage.getItem(BACKUP_KEY);
    if(!raw)return {ok:false,error:'No local backup is available.'};
    return {ok:true,error:null,state:migrateState(JSON.parse(raw))};
  }catch(_){return {ok:false,error:'The local backup could not be read.'}}
}

export function resetState(){
  try{
    const current=localStorage.getItem(KEY);
    if(current)localStorage.setItem(BACKUP_KEY,current);
    localStorage.removeItem(KEY);
    for(const key of LEGACY_KEYS)localStorage.removeItem(key);
    return {ok:true,error:null};
  }catch(error){
    return {ok:false,error:'Strategos could not erase all local data.'};
  }
}
