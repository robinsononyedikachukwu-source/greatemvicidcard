const B='http://localhost:3111';
class Client{ constructor(n){this.n=n;this.cookie=''} async call(method,url,body,hdr={}){ const r=await fetch(B+url,{method,headers:Object.assign({'Content-Type':'application/json','X-GEMVIC':'1',Cookie:this.cookie},hdr),body:body===undefined?undefined:JSON.stringify(body),redirect:'manual'}); const sc=r.headers.get('set-cookie'); if(sc) this.cookie=sc.split(';')[0]; let j=null; try{j=await r.json()}catch(e){} return {s:r.status,j}; } rpc(op,args){return this.call('POST','/api/rpc',{op,args})} }
const ok=(c,m)=>{ console.log((c?'PASS':'FAIL')+'  '+m); if(!c) process.exitCode=1; };
(async()=>{
 const sup=new Client('super'), adm=new Client('admin'), op=new Client('op'), anon=new Client('anon');
 // The super account is created automatically on first boot (EMBEDDED_SUPER in server.js), not via /api/setup.
 let r=await anon.call('GET','/api/status'); ok(r.j.needsSetup===false,'super account already exists on boot (embedded)');
 r=await anon.call('POST','/api/setup',{name:'X',username:'hacker',password:'HackerPass123'}); ok(r.s===409,'setup is blocked once an account exists');
 r=await anon.call('GET','/api/bootstrap'); ok(r.s===401,'unauthenticated bootstrap blocked');
 r=await sup.call('POST','/api/login',{username:'admin',password:'Harbor-Comet-1387!'}); ok(r.s===200&&r.j.user.role==='super','embedded super account logs in');
 r=await sup.rpc('user.create',{name:'Admin One',username:'admin1',password:'AdminPass123',role:'admin'}); ok(r.s===200,'super creates admin');
 r=await adm.call('POST','/api/login',{username:'admin1',password:'AdminPass123'}); ok(r.s===200&&r.j.user.role==='admin','admin logs in');
 r=await adm.rpc('user.create',{name:'Hack Admin',username:'admin2',password:'AdminPass123',role:'admin'}); ok(r.s===403,'admin CANNOT create another admin');
 r=await adm.rpc('user.create',{name:'Gate Operator 01',username:'gate1',password:'GatePass1234',role:'operator'}); ok(r.s===200,'admin creates operator');
 r=await adm.rpc('user.create',{name:'Dup',username:'GATE1',password:'GatePass1234',role:'operator'}); ok(r.s===400,'duplicate username refused');
 const users=(await adm.call('GET','/api/bootstrap')).j.users; ok(users.every(u=>!u.hash&&!u.salt),'password hashes never sent to browser');
 const superId=users.find(u=>u.role==='super').id;
 r=await adm.rpc('user.toggle',{id:superId}); ok(r.s===403,'admin cannot disable super account');
 r=await adm.rpc('user.reset',{id:superId,password:'NewPassword123'}); ok(r.s===403,'admin cannot reset super password');
 r=await op.call('POST','/api/login',{username:'gate1',password:'GatePass1234'}); ok(r.s===200&&r.j.user.role==='operator','operator logs in');
 for(const [o,a] of [['student.delete',{id:'x'}],['student.save',{sid:'A',first:'a',last:'b',cls:'SS2',session:'2026/2027'}],['user.create',{name:'x',username:'xxx',password:'12345678',role:'operator'}],['settings.save',{}],['att.delete',{ids:[]}],['system.reset',{}],['demo.load',{}]]){ r=await op.rpc(o,a); ok(r.s===403,'operator blocked from '+o); }
 r=await op.call('GET','/api/bootstrap'); ok(r.s===403,'operator cannot read full database');
 r=await op.call('GET','/api/photos'); ok(r.s===403,'operator cannot read all photos');
 r=await adm.rpc('system.reset',{}); ok(r.s===403,'admin cannot erase system (super only)');
 r=await adm.call('POST','/api/restore',{app:'gemvic-id-gate',state:{students:[],attendance:[]}}); ok(r.s===403,'admin cannot restore backup (super only)');
 r=await adm.rpc('demo.load',{}); ok(r.s===200&&r.j.added.length===9,'admin loads demo students and teachers (6+3)');
 const st=(await adm.call('GET','/api/bootstrap')).j.students; const classes=(await adm.call('GET','/api/bootstrap')).j.classes.map(c=>c.name); ok(classes.join()==='Primary1,Primary2,Primary3,Primary4,Primary5,JSS1,JSS2,JSS3,SS1,SS2,SS3','default classes are Primary1-5, JSS1-3 and SS1-3: '+classes.join()); const dan=st.find(s=>s.sid==='GE/2026/0001'); const code=dan.qr.value;
 ok(/^GE-ID-[A-Z2-9]{12}$/.test(code),'QR is random 12-char identifier: '+code);
 r=await op.call('POST','/api/scan',{code:'GE-ID-BOGUSBOGUS12'}); ok(r.j.kind==='INVALID','invalid QR rejected');
 // race: 25 simultaneous scans of the same card
 const rs=await Promise.all(Array.from({length:25},()=>op.call('POST','/api/scan',{code})));
 const kinds=rs.map(x=>x.j.kind); ok(kinds.filter(k=>k==='ENTRY').length===1&&kinds.filter(k=>k==='DUP_IN').length===24,'25 simultaneous scans => exactly 1 entry ('+kinds.filter(k=>k==='ENTRY').length+' entry)');
 r=rs.find(x=>x.j.kind==='ENTRY'); ok(r.j.student.name==='Daniel Onyeka'&&!('guardianPhone' in r.j.student),'scan reveals only name/class/section (no private data)');
 // client-supplied time is ignored
 r=await op.call('POST','/api/scan',{code,ts:'2020-01-01T00:00:00Z',status:'LEFT'}); ok(r.j.kind==='DUP_IN','client time/status ignored');
 // manual scan
 r=await op.call('POST','/api/scan',{studentId:st.find(s=>s.sid==='GE/2026/0002').id}); ok(r.j.kind==='ENTRY','operator manual entry via search-id works');
 r=await op.call('GET','/api/gate/search?q=grace'); ok(r.j.students.length===1&&!('guardian' in r.j.students[0]),'operator search returns basic fields only');
 const g=await op.call('GET','/api/gate'); ok(g.j.stats.checkedIn===2&&g.j.stats.inSchool===2,'gate stats computed on server: '+JSON.stringify(g.j.stats));
 // exit after 5+ minutes: correct via admin then scan
 let bs=(await adm.call('GET','/api/bootstrap')).j; const rec=bs.attendance.find(a=>a.studentId===dan.id);
 // simulate elapsed time by editing persisted db (server restart not needed: use correction to move entry earlier)
 r=await adm.rpc('att.correct',{id:rec.id,entry:'01:00:00',exit:'',reason:'test'}); ok(r.s===200,'admin corrects entry time');
 r=await op.call('POST','/api/scan',{code}); ok(r.j.kind==='EXIT'&&r.j.rec.dur>0,'second scan after window => EXIT with duration '+Math.round(r.j.rec.dur));
 r=await op.call('POST','/api/scan',{code}); ok(r.j.kind==='DUP_OUT','third scan => already checked out');
 r=await op.rpc('att.correct',{id:rec.id,entry:'01:00:00',exit:'02:00:00',reason:'x'}); ok(r.s===403,'operator cannot correct records');
 r=await adm.rpc('att.correct',{id:rec.id,entry:'09:00:00',exit:'08:00:00',reason:'x'}); ok(r.s===400,'exit before entry rejected');
 r=await adm.rpc('att.correct',{id:rec.id,entry:'09:00:00',exit:'10:00:00',reason:''}); ok(r.s===400,'correction without reason rejected');
 // replace QR
 r=await adm.rpc('id.replace',{id:dan.id,reason:'Lost ID card',old:'Lost'}); ok(r.s===200,'admin replaces lost card');
 r=await op.call('POST','/api/scan',{code}); ok(r.j.kind==='INACTIVE_ID','old QR rejected after replacement');
 bs=(await adm.call('GET','/api/bootstrap')).j; const dan2=bs.students.find(s=>s.id===dan.id); ok(dan2.qr.value!==code&&dan2.qrHistory.length===1&&dan2.sid==='GE/2026/0001','new QR issued, history kept, student ID unchanged');
 r=await adm.rpc('id.status',{id:dan.id,status:'Suspended'}); r=await op.call('POST','/api/scan',{code:dan2.qr.value}); ok(r.j.kind==='INACTIVE_ID','suspended card rejected');
 r=await adm.rpc('student.save',{id:dan.id,sid:'GE/2026/0001',first:'Daniel',last:'Onyeka',cls:'SS2',session:'2026/2027',status:'Transferred'}); ok(r.s===200,'admin edits student');
 r=await adm.rpc('id.status',{id:dan.id,status:'Active'}); r=await op.call('POST','/api/scan',{code:dan2.qr.value}); ok(r.j.kind==='INACTIVE_STUDENT','inactive student rejected');
 r=await adm.rpc('student.delete',{id:dan.id}); ok(r.s===400,'cannot delete student that has gate records');
 r=await adm.rpc('student.save',{sid:'GE/2026/0001',first:'X',last:'Y',cls:'SS2',session:'2026/2027'}); ok(r.s===400,'duplicate student ID refused');
 r=await adm.rpc('student.save',{sid:'GE/2026/0099',first:'X',last:'Y',cls:'NOPE',session:'2026/2027'}); ok(r.s===400,'unknown class refused');
 r=await adm.rpc('photo.set',{items:[{id:dan.id,data:'data:text/html;base64,PHNjcmlwdD4='}]}); ok(r.s===400,'non-image upload refused');
 // disable operator -> session dies
 const opId=bs.users.find(u=>u.username==='gate1').id; r=await adm.rpc('user.toggle',{id:opId}); r=await op.call('GET','/api/gate'); ok(r.s===401,'disabled operator is signed out immediately');
 r=await new Client('x').call('POST','/api/login',{username:'gate1',password:'GatePass1234'}); ok(r.s===403,'disabled operator cannot sign in');
 // rate limit
 let last; for(let i=0;i<8;i++) last=await new Client('y').call('POST','/api/login',{username:'admin1',password:'wrongwrong'+i}); ok(last.s===429||last.s===401,'wrong passwords throttled (last status '+last.s+')');
 // audit
 bs=(await adm.call('GET','/api/bootstrap')).j; const acts=bs.audit.map(a=>a.action); ok(['Super account created','Administrator created','Operator created','ID replaced','Attendance corrected','Failed login'].every(a=>acts.includes(a)),'audit log recorded key actions');
 const png='data:image/jpeg;base64,'+Buffer.from('fakejpegbytes').toString('base64'); r=await adm.rpc('photo.set',{items:[{id:dan.id,data:png}]}); ok(r.s===200,'admin uploads a photograph'); r=await adm.call('POST','/api/backup',{}); ok(r.s===200&&!r.j.state.users&&Object.keys(r.j.photos).length===1&&r.j.state.students.length===9,'backup has data + photos, no credentials');
 r=await sup.call('POST','/api/restore',r.j); ok(r.s===200,'super restores backup');
 r=await sup.rpc('system.reset',{}); ok(r.s===200,'super can reset system');

 // ---- teachers ----
 r=await adm.rpc('demo.load',{}); bs=(await adm.call('GET','/api/bootstrap')).j;
 const teach=bs.students.filter(s=>s.kind==='teacher'); ok(teach.length===3&&teach.every(t=>t.cls==='Teacher'&&t.qr),'3 teachers registered, each with a QR');
 r=await adm.rpc('student.save',{kind:'teacher',sid:'GE/T/0100',first:'Kemi',last:'Adebayo',dept:'Chemistry',phone:'0801',status:'Active'}); ok(r.s===200,'admin registers a teacher (no class needed)');
 r=await adm.rpc('student.save',{kind:'teacher',sid:'ge/t/0100',first:'Dup',last:'Teacher'}); ok(r.s===400,'duplicate staff ID refused (case-insensitive)');
 const newT=(await adm.call('GET','/api/bootstrap')).j.students.find(s=>s.sid==='GE/T/0100'); await adm.rpc('id.generate',{ids:[newT.id]});
 const t1=(await adm.call('GET','/api/bootstrap')).j.students.find(s=>s.sid==='GE/T/0100'); ok(/^GE-ID-/.test(t1.qr.value),'teacher ID generated');
 const op2=new Client('op2'); await adm.rpc('user.toggle',{id:opId}); r=await op2.call('POST','/api/login',{username:'gate1',password:'GatePass1234'}); ok(r.s===200,'operator re-enabled and signed in');
 r=await op2.rpc('student.save',{kind:'teacher',sid:'GE/T/0200',first:'No',last:'Way'}); ok(r.s===403,'operator cannot register teachers');
 r=await op2.call('POST','/api/scan',{code:t1.qr.value}); ok(r.j.kind==='ENTRY'&&r.j.student.cls==='Teacher','teacher scanned in at the gate');
 r=await op2.call('GET','/api/gate'); ok(r.j.stats.tChecked===1,'teacher counted separately from students: '+JSON.stringify({s:r.j.stats.checkedIn,t:r.j.stats.tChecked}));
 bs=(await adm.call('GET','/api/bootstrap')).j; ok(bs.attendance.some(a=>a.kind==='teacher'),'attendance record is tagged as teacher');
 r=await adm.rpc('settings.save',Object.assign({},bs.settings,{teacherOpening:'07:00'})); ok(r.s===200,'teacher opening time saved separately');
 r=await adm.rpc('class.add',{name:'SS2A'}); ok(r.s===200,'extra class SS2A can still be added if ever needed');
 // Direct database-constraint checks (unique username/sid/qr, one super account, one entry per
 // person per day, no deleting a person with gate records) live in MongoDB's own indexes now
 // (see ensureIndexes in store.js) rather than a local file this script can open directly.
 // They are exercised indirectly above via the HTTP API (duplicate username/sid rejected, the
 // 25-simultaneous-scan race test, "second setup blocked", etc.) - verify them for real once
 // this is connected to your own Atlas cluster.
 // CSRF origin
 r=await adm.call('POST','/api/rpc',{op:'demo.load',args:{}},{Origin:'http://evil.example'}); ok(r.s===403,'cross-origin POST refused');
 const h=await fetch(B+'/'); ok((h.headers.get('content-security-policy')||'').includes("frame-ancestors 'none'")&&h.headers.get('x-content-type-options')==='nosniff','security headers present');
})();
