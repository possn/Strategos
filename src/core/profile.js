export const PROFILE_EXPERIENCE=['beginner','intermediate','advanced'];

export function normaliseProfile(input={}){
  const profile=input&&typeof input==='object'?input:{};
  return {
    name:String(profile.name||'Friend').trim().slice(0,80)||'Friend',
    age:numberOrNull(profile.age,13,120),
    heightCm:numberOrNull(profile.heightCm,100,230),
    weightKg:numberOrNull(profile.weightKg,25,350,1),
    experience:PROFILE_EXPERIENCE.includes(profile.experience)?profile.experience:null,
    limitations:String(profile.limitations||'').trim().slice(0,500)
  };
}

export function profileCompleteness(profile={}){
  const p=normaliseProfile(profile);
  const fields=['age','heightCm','weightKg','experience','limitations'];
  const completed=fields.filter(key=>p[key]!==null&&p[key]!=='').length;
  return {completed,total:fields.length,ratio:completed/fields.length};
}

export function profileSummary(profile={}){
  const p=normaliseProfile(profile);
  const details=[p.age?`${p.age} years`:null,p.heightCm?`${p.heightCm} cm`:null,p.weightKg?`${p.weightKg} kg`:null,p.experience?experienceLabel(p.experience):null].filter(Boolean);
  return details.length?`${p.name} · ${details.join(' · ')}`:`${p.name} · profile still forming`;
}

export function experienceLabel(value){return {beginner:'Beginning',intermediate:'Some experience',advanced:'Experienced'}[value]||'Not specified'}

function numberOrNull(value,min,max,decimals=0){
  if(value===null||value===undefined||value==='')return null;
  const number=Number(value);
  if(!Number.isFinite(number)||number<min||number>max)return null;
  return Number(number.toFixed(decimals));
}
