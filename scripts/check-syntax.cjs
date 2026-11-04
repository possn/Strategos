const {readdirSync}=require('node:fs');
const {join}=require('node:path');
const {execFileSync}=require('node:child_process');
function visit(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){const path=join(dir,entry.name);if(entry.isDirectory())visit(path);else if(/\.(js|cjs|mjs)$/.test(path))execFileSync(process.execPath,['--check',path],{stdio:'inherit'});}}
for(const dir of ['src','tests','scripts'])visit(dir);
console.log('All JavaScript files passed syntax validation.');
