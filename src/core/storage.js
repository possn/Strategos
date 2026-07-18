const KEY='onearete.strategos.v06';
const LEGACY_KEYS=['onearete.strategos.v05','onearete.strategos.v03'];
export const ONBOARDING_VERSION=3;
const initial=()=>({profile:null,history:[],judgements:[],current:null,deltaTotal:0,onboardingVersion:0,settings:{sound:true,voice:'minimal',voiceName:'auto',voicePace:'calm',haptics:true,keepAwake:true}});
export function loadState(){
  try{
    let raw=localStorage.getItem(KEY);
    if(!raw){for(const k of LEGACY_KEYS){raw=localStorage.getItem(k);if(raw)break}}
    const parsed=raw?JSON.parse(raw):{};const base=initial();
    const state={...base,...parsed,judgements:parsed.judgements||[],settings:{...base.settings,...(parsed.settings||{})}};
    localStorage.setItem(KEY,JSON.stringify(state));return state;
  }catch(e){console.warn('Strategos state reset.',e);return initial()}
}
export function saveState(s){try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){console.warn('Could not persist Strategos state.',e)}}
export function resetState(){try{localStorage.removeItem(KEY);for(const k of LEGACY_KEYS)localStorage.removeItem(k)}catch(_){}}
