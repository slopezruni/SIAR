'use strict';
const fs=require('fs'),path=require('path');const {spawnSync}=require('child_process');
const root=path.resolve(__dirname,'..'),temporary=path.join(root,'coverage/tmp');
fs.rmSync(temporary,{recursive:true,force:true});fs.mkdirSync(temporary,{recursive:true});
const env={...process.env,NODE_V8_COVERAGE:temporary,SIAR_EVIDENCE_DIR:path.join(root,'docs/evidencias')};
function run(args,variables=env){const r=spawnSync(process.execPath,args,{cwd:root,env:variables,stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
run(['--test',...fs.readdirSync(path.join(root,'tests')).filter(n=>n.endsWith('.test.js')).map(n=>'tests/'+n)]);
run(['tests/browser.cjs']);
run(['node_modules/c8/bin/c8.js','report','--check-coverage','--lines','70'],process.env);
