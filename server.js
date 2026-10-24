/* EuroWork Hub — zero-dependency Node.js server (Node 18+)
   - serves /public
   - POST /api/inquiry  (stores submissions in data/submissions.json)
   - GET  /admin        (password protected list)  GET /admin/export.csv  POST /admin/delete
   - GET  /api/health
   Env: PORT, ADMIN_USER, ADMIN_PASSWORD (required for /admin), NOTIFY_WEBHOOK_URL (optional), TRUST_PROXY=1 */
const http=require('http'),fs=require('fs'),path=require('path'),zlib=require('zlib'),crypto=require('crypto');
const PORT=process.env.PORT||3000,PUB=path.join(__dirname,'public'),DATA_DIR=process.env.DATA_DIR||path.join(__dirname,'data'),DB=path.join(DATA_DIR,'submissions.json');
const ADMIN_USER=process.env.ADMIN_USER||'admin',ADMIN_PASSWORD=process.env.ADMIN_PASSWORD||'';
fs.mkdirSync(DATA_DIR,{recursive:true});if(!fs.existsSync(DB))fs.writeFileSync(DB,'[]');
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.mp4':'video/mp4','.webm':'video/webm','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8','.xml':'application/xml','.woff2':'font/woff2'};
const SEC={'X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(),microphone=(),geolocation=()','Strict-Transport-Security':'max-age=31536000; includeSubDomains','Content-Security-Policy':"default-src 'self'; img-src 'self' data: https:; media-src 'self' https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'"};
const clean=(v,n)=>String(v==null?'':v).replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,n);
const ip=req=>process.env.TRUST_PROXY?String(req.headers['x-forwarded-for']||'').split(',')[0].trim()||req.socket.remoteAddress:req.socket.remoteAddress;
const hits=new Map();
function limited(k,max,win){const n=Date.now(),a=(hits.get(k)||[]).filter(t=>n-t<win);a.push(n);hits.set(k,a);return a.length>max}
setInterval(()=>{const n=Date.now();for(const[k,a]of hits){if(!a.some(t=>n-t<3600e3))hits.delete(k)}},600e3).unref();
function send(res,code,body,type='text/plain; charset=utf-8',extra={}){res.writeHead(code,{'Content-Type':type,...SEC,...extra});res.end(body)}
const json=(res,code,o)=>send(res,code,JSON.stringify(o),'application/json');
function readBody(req,max=50e3){return new Promise((ok,no)=>{let b='',n=0;req.on('data',c=>{n+=c.length;if(n>max){no(new Error('too large'));req.destroy()}else b+=c});req.on('end',()=>ok(b));req.on('error',no)})}
let writing=Promise.resolve();
const load=()=>{try{return JSON.parse(fs.readFileSync(DB,'utf8'))}catch{return[]}};
const save=a=>{writing=writing.then(()=>fs.promises.writeFile(DB+'.tmp',JSON.stringify(a,null,1)).then(()=>fs.promises.rename(DB+'.tmp',DB)));return writing};
async function notify(s){const u=process.env.NOTIFY_WEBHOOK_URL;if(!u||typeof fetch!=='function')return;
 const text=`📩 New ${s.type} enquiry\n${s.name} (${s.nationality}) • WhatsApp ${s.whatsapp}\n${s.profession}, ${s.experience||'?'} yrs → ${s.preferredCountry||'any'}\n${s.message||''}`;
 try{await fetch(u,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,content:text})})}catch(e){console.error('notify failed',e.message)}}
async function inquiry(req,res){
 if(limited('i:'+ip(req),8,3600e3))return json(res,429,{error:'Too many requests. Please try again later or contact us on WhatsApp.'});
 let d;try{d=JSON.parse(await readBody(req))}catch{return json(res,400,{error:'Invalid request.'})}
 if(d.website)return json(res,200,{ok:true}); // honeypot: pretend success
 const s={id:crypto.randomUUID(),createdAt:new Date().toISOString(),type:['visa','contact','inquiry'].includes(d.type)?d.type:'inquiry',
  name:clean(d.name,100),whatsapp:clean(d.whatsapp,30),email:clean(d.email,120),nationality:clean(d.nationality,60),currentCountry:clean(d.currentCountry,60),
  preferredCountry:clean(d.preferredCountry,60),profession:clean(d.profession,80),experience:clean(d.experience,3),message:clean(d.message,2000),ip:ip(req)};
 if(!s.name||!s.whatsapp||!s.nationality||!s.currentCountry||!s.profession||d.consent!==true)return json(res,400,{error:'Please fill in all required fields.'});
 if(!/^[+\d][\d\s().-]{5,}$/.test(s.whatsapp))return json(res,400,{error:'Please enter a valid WhatsApp number.'});
 if(s.email&&!/^\S+@\S+\.\S+$/.test(s.email))return json(res,400,{error:'Please enter a valid email.'});
 const all=load();all.push(s);try{await save(all)}catch(e){console.error(e);return json(res,500,{error:'Could not save your request. Please contact us on WhatsApp.'})}
 notify(s);json(res,200,{ok:true});
}
/* admin */
function auth(req,res){
 if(!ADMIN_PASSWORD){send(res,503,'Admin disabled. Set the ADMIN_PASSWORD environment variable.');return false}
 if(limited('a:'+ip(req),30,600e3)){send(res,429,'Too many attempts');return false}
 const h=req.headers.authorization||'';const [u,...p]=Buffer.from(h.replace(/^Basic /,''),'base64').toString().split(':');
 const eq=(a,b)=>{const x=crypto.createHash('sha256').update(a).digest(),y=crypto.createHash('sha256').update(b).digest();return crypto.timingSafeEqual(x,y)};
 if(h.startsWith('Basic ')&&eq(u||'',ADMIN_USER)&&eq(p.join(':'),ADMIN_PASSWORD))return true;
 send(res,401,'Authentication required','text/plain',{'WWW-Authenticate':'Basic realm="EuroWork Admin", charset="UTF-8"'});return false}
const h=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function adminPage(res){
 const rows=load().slice().reverse();
 const body=`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Admin — EuroWork Hub</title>
<style>body{font-family:system-ui;margin:0;background:#f4f6fb;color:#1b2437}header{background:#0b1f4d;color:#fff;padding:16px 24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}a.b,button{background:#1f5fd6;color:#fff;border:0;border-radius:8px;padding:8px 14px;text-decoration:none;cursor:pointer;font:inherit}button.d{background:#c0392b}main{padding:20px;overflow:auto}table{border-collapse:collapse;width:100%;background:#fff;border-radius:10px;overflow:hidden;font-size:14px}th,td{padding:10px 12px;border-bottom:1px solid #e5eaf4;text-align:left;vertical-align:top}th{background:#eaf0ff;position:sticky;top:0}.t{background:#eaf0ff;border-radius:99px;padding:2px 10px;font-size:12px}</style>
<header><b>📩 Enquiries (${rows.length})</b><span><a class=b href="/admin/export.csv">Export CSV</a></span></header><main>
<table><tr><th>Date</th><th>Type</th><th>Name</th><th>WhatsApp</th><th>Email</th><th>Nationality</th><th>From</th><th>Wants</th><th>Profession</th><th>Exp</th><th>Message</th><th></th></tr>
${rows.map(r=>`<tr><td>${h(r.createdAt.replace('T',' ').slice(0,16))}</td><td><span class=t>${h(r.type)}</span></td><td>${h(r.name)}</td><td><a href="https://wa.me/${h(r.whatsapp.replace(/\D/g,''))}" target=_blank>${h(r.whatsapp)}</a></td><td>${h(r.email)}</td><td>${h(r.nationality)}</td><td>${h(r.currentCountry)}</td><td>${h(r.preferredCountry)}</td><td>${h(r.profession)}</td><td>${h(r.experience)}</td><td>${h(r.message)}</td><td><form method=post action="/admin/delete" onsubmit="return confirm('Delete this enquiry?')"><input type=hidden name=id value="${h(r.id)}"><button class=d>Delete</button></form></td></tr>`).join('')||'<tr><td colspan=12>No enquiries yet.</td></tr>'}
</table></main>`;
 send(res,200,body,'text/html; charset=utf-8',{'Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src 'self' data:; form-action 'self'"})}
function csv(res){
 const cols=['createdAt','type','name','whatsapp','email','nationality','currentCountry','preferredCountry','profession','experience','message'];
 const q=(v,c)=>{v=String(v==null?'':v);if(/^[=\-@]/.test(v)||(c!=='whatsapp'&&v[0]==='+'))v="'"+v;return '"'+v.replace(/"/g,'""')+'"'};
 const out='\ufeff'+cols.join(',')+'\n'+load().map(r=>cols.map(c=>q(r[c],c)).join(',')).join('\n');
 send(res,200,out,'text/csv; charset=utf-8',{'Content-Disposition':'attachment; filename="enquiries.csv"','Cache-Control':'no-store'})}
/* static */
function serve(req,res,url){
 let p=decodeURIComponent(url.pathname);if(p.endsWith('/'))p+='index.html';
 const f=path.normalize(path.join(PUB,p));
 if(!f.startsWith(PUB+path.sep)&&f!==PUB)return send(res,403,'Forbidden');
 fs.stat(f,(e,st)=>{
  if(e||!st.isFile()){ // 404
   if(path.extname(p))return send(res,404,'Not found');
   return send(res,404,fs.readFileSync(path.join(PUB,'index.html')),'text/html; charset=utf-8')}
  const ext=path.extname(f).toLowerCase(),type=MIME[ext]||'application/octet-stream';
  const etag='"'+st.size.toString(16)+'-'+st.mtimeMs.toString(16)+'"';
  const cache=ext==='.html'?'no-cache':(['.js','.css'].includes(ext)?'public, max-age=3600':'public, max-age=604800');
  if(req.headers['if-none-match']===etag){res.writeHead(304,{ETag:etag,...SEC});return res.end()}
  const hd={'Content-Type':type,ETag:etag,'Cache-Control':cache,...SEC};
  if(req.method==='HEAD'){res.writeHead(200,hd);return res.end()}
  const gz=/\bgzip\b/.test(req.headers['accept-encoding']||'')&&/^(text|application\/(javascript|json|xml))|svg/.test(type);
  if(gz){res.writeHead(200,{...hd,'Content-Encoding':'gzip',Vary:'Accept-Encoding'});fs.createReadStream(f).pipe(zlib.createGzip()).pipe(res)}
  else{res.writeHead(200,hd);fs.createReadStream(f).pipe(res)}})}
http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://x');
  if(url.pathname==='/api/health')return json(res,200,{ok:true});
  if(url.pathname==='/api/inquiry'){if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});return await inquiry(req,res)}
  if(url.pathname.startsWith('/admin')){
   if(!auth(req,res))return;
   if(url.pathname==='/admin'&&req.method==='GET')return adminPage(res);
   if(url.pathname==='/admin/export.csv')return csv(res);
   if(url.pathname==='/admin/delete'&&req.method==='POST'){const id=new URLSearchParams(await readBody(req)).get('id');await save(load().filter(r=>r.id!==id));res.writeHead(303,{Location:'/admin'});return res.end()}
   return send(res,404,'Not found')}
  if(req.method!=='GET'&&req.method!=='HEAD')return send(res,405,'Method not allowed');
  serve(req,res,url);
 }catch(e){console.error(e);if(!res.headersSent)send(res,500,'Server error')}
}).listen(PORT,()=>console.log(`EuroWork Hub running on http://localhost:${PORT}`+(ADMIN_PASSWORD?'':'  (admin disabled: set ADMIN_PASSWORD)')));
