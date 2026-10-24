(function(){
const C=window.SITE_CONFIG,D=window.SITE_DATA,$=(s,e=document)=>e.querySelector(s),$$=(s,e=document)=>[...e.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const S=C.social,has=k=>!!S[k];
const link=(k,fallback="#/contact")=>S[k]||fallback;
const ext=k=>has(k)?' target="_blank" rel="noopener"':'';
const btnWA=(c="")=>`<a class="btn btn-wa ${c}" href="${link('whatsapp')}"${ext('whatsapp')}>💬 WhatsApp Us</a>`;
const btnTG=(c="")=>`<a class="btn btn-t ${c}" href="${link('telegram')}"${ext('telegram')}>✈️ Telegram Us</a>`;
const btnVB=(c="")=>`<a class="btn btn-o ${c}" href="${link('viber')}"${ext('viber')}>📞 Viber Us</a>`;
const btnMS=(c="")=>`<a class="btn btn-m ${c}" href="${link('messenger')}"${ext('messenger')}>💭 Messenger</a>`;
const countryOpts=(sel="")=>`<option value="">Select country</option>`+D.countries.map(c=>`<option ${c.slug===sel?'selected':''}>${c.name}</option>`).join('')+`<option>Not sure yet</option>`;

/* ---------- forms ---------- */
function formHTML(type,pref=""){
 const visa=type==='visa';
 return `<form class="f" data-type="${type}" novalidate>
  <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
  <div class="r2"><label>Full Name *<input name="name" required maxlength="100" autocomplete="name"></label>
  <label>WhatsApp Number *<input name="whatsapp" required maxlength="30" inputmode="tel" placeholder="+countrycode number" autocomplete="tel"></label></div>
  <div class="r2"><label>Email<input name="email" type="email" maxlength="120" autocomplete="email"></label>
  <label>Nationality *<input name="nationality" required maxlength="60"></label></div>
  <div class="r2"><label>Current Country *<input name="currentCountry" required maxlength="60"></label>
  <label>Preferred Country<select name="preferredCountry">${countryOpts(pref)}</select></label></div>
  <div class="r2"><label>Profession *<input name="profession" required maxlength="80" placeholder="e.g. Welder, Driver, Cook"></label>
  <label>Years of Experience<input name="experience" type="number" min="0" max="60"></label></div>
  <label>Message<textarea name="message" rows="4" maxlength="2000" placeholder="${visa?'Tell us what you need help understanding about the permit or visa process.':'Anything else we should know?'}"></textarea></label>
  <label class="consent"><input type="checkbox" name="consent" required> I agree that EuroWork Hub may contact me about my enquiry and store my details as described in the <a href="#/privacy">Privacy Policy</a>.</label>
  <div class="msg" role="status"></div>
  <button class="btn btn-p" type="submit">${visa?'Request Visa Assistance':'Send Enquiry'}</button></form>`;
}
function wireForms(root){
 $$('form.f',root).forEach(f=>f.addEventListener('submit',async e=>{
  e.preventDefault();const m=$('.msg',f),b=$('button',f);m.className='msg';m.textContent='';
  const d=Object.fromEntries(new FormData(f));d.consent=f.consent.checked;d.type=f.dataset.type;
  if(!d.name||!d.whatsapp||!d.nationality||!d.currentCountry||!d.profession||!d.consent){m.className='msg err';m.textContent='Please fill in all fields marked * and accept the consent box.';return}
  if(d.email&&!/^\S+@\S+\.\S+$/.test(d.email)){m.className='msg err';m.textContent='Please enter a valid email address.';return}
  b.disabled=true;b.textContent='Sending…';
  try{
   const r=await fetch('/api/inquiry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});
   const j=await r.json().catch(()=>({}));
   if(!r.ok)throw new Error(j.error||'Something went wrong. Please try again.');
   f.reset();m.className='msg ok';
   m.innerHTML=`<b>Thank you. We have received your request.</b> Please contact us directly through WhatsApp for faster assistance.<br><br>${btnWA()}`;
  }catch(err){m.className='msg err';m.textContent=err.message}
  finally{b.disabled=false;b.textContent=f.dataset.type==='visa'?'Request Visa Assistance':'Send Enquiry'}
 }));
}

/* ---------- reusable blocks ---------- */
const countryCard=c=>`<a class="card ccard" href="#/country/${c.slug}"><div class="im"><img loading="lazy" src="${c.img}" style="object-position:${c.pos||'center'}" alt="Job placement in ${c.name}"></div><div class="bd"><h3>${c.flag} ${c.name}</h3><p>${c.tagline}</p>${c.jobs.slice(0,4).map(j=>`<span class="tag">${j}</span>`).join('')}</div></a>`;
const catCards=()=>D.categories.map(c=>`<div class="card pcard"><img loading="lazy" src="${c.img}" style="object-position:${c.pos||'center'}" alt="${c.name} workers"><div class="bd"><h3>${c.icon} ${c.name}</h3><p>${c.text}</p></div></div>`).join('');
const jobGallery=names=>`<div class="gal">${names.map(n=>D.categories.find(c=>c.name===n)).filter(Boolean).map(c=>`<div class="photo"><img loading="lazy" src="${c.img}" style="object-position:${c.pos||'center'}" alt="${c.name}"><div class="cap">${c.icon} ${c.name}</div></div>`).join('')}</div>`;
const faq=()=>D.faqs.map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join('');
const cta=(t="Looking for Work in Europe?",p="Tell us which country you are interested in and we'll explain the available opportunities.")=>`<section class="cta"><div class="wrap"><h2>${t}</h2><p>${p}</p><div class="row">${btnWA()}${btnTG()}${btnVB()}${btnMS()}<a class="btn btn-g" href="#/contact">✉️ Contact Us</a></div></div></section>`;
const hero=(img,t,p,crumb="",cls="")=>`<section class="page-hero ${cls}"><img src="${img}" alt=""><div class="wrap">${crumb}<h1>${t}</h1><p>${p}</p></div></section>`;

/* ---------- pages ---------- */
const pages={
home(){
 return `<section class="slider" id="slider" aria-roledescription="carousel">
 ${C.slides.map((s,i)=>`<div class="slide a-${s.align||'left'}${i?'':' on'}">${s.type==='video'?`<video class="bg" src="${s.src}" poster="${s.poster||''}" muted loop playsinline ${i?'':'autoplay'} preload="metadata"></video>`:`<img class="bg" src="${s.src}" alt="" ${i?'loading="lazy"':''}>`}
 <div class="wrap"><span class="eyebrow">🧳 EUROPE • CAREERS • RELOCATION</span><h1>${s.title}</h1><p>${s.text}</p><div class="row"><a class="btn btn-g" href="${s.cta[1]}">${s.cta[0]}</a><a class="btn btn-o" href="#/contact">Contact Us</a></div></div></div>`).join('')}
 <button class="arr l" aria-label="Previous slide">‹</button><button class="arr r" aria-label="Next slide">›</button>
 <div class="s-ctl">${C.slides.map((_,i)=>`<button class="dot${i?'':' on'}" aria-label="Slide ${i+1}"></button>`).join('')}</div></section>
 <section class="sec"><div class="wrap"><div class="grid g4">
  <div class="card"><div class="ic">🌍</div><h3>European Opportunities</h3><p>Job placement opportunities in selected European countries.</p></div>
  <div class="card"><div class="ic">💼</div><h3>Job Placement</h3><p>We connect candidates with available employment opportunities.</p></div>
  <div class="card"><div class="ic">📄</div><h3>Work Permit</h3><p>Guidance regarding employment-related permit processes.</p></div>
  <div class="card"><div class="ic">✈️</div><h3>Visa Assistance</h3><p>Support and general guidance for work visa applications.</p></div></div></div></section>
 <section class="sec alt" id="countries"><div class="wrap"><div class="hd"><h2>Countries Where We Provide Job Placement</h2><p>Select a country to learn more or contact us about currently available opportunities.</p></div>
  <div class="grid g4">${D.countries.map(countryCard).join('')}</div></div></section>
 <section class="sec"><div class="wrap"><div class="hd"><h2>Job Categories</h2><p>Positions we are commonly asked about. Availability changes — contact us for current openings.</p></div><div class="grid g4">${catCards()}</div></div></section>
 <section class="sec alt"><div class="wrap"><div class="hd"><h2>How It Works</h2></div><div class="grid g3 steps">
  <div class="card step"><h3>Choose Your Country</h3><p>See where we currently provide job placement.</p></div>
  <div class="card step"><h3>Contact Us</h3><p>Tell us your profession, experience and preferred country.</p></div>
  <div class="card step"><h3>Discuss Opportunities</h3><p>We explain currently available opportunities and the next steps.</p></div></div></div></section>
 <section class="sec"><div class="wrap"><div class="banner"><div><span class="eyebrow">🛂 PASSPORT • PERMIT • VISA</span><h2>Visa &amp; Work Permit Assistance</h2><p>Unsure about the work permit or visa process? We provide general guidance and help you understand the next steps. Visa approval is not guaranteed.</p><br><a class="btn btn-g" href="#/visa">Request Visa Assistance</a></div><img loading="lazy" src="images/visa.webp" alt="Visa consultant helping a candidate with passport and documents"></div></div></section>
 <section class="sec alt"><div class="wrap"><div class="hd"><h2>Why Choose Us</h2></div><div class="grid g4">
  <div class="card"><div class="ic">🌍</div><h3>European Job Opportunities</h3><p>Access employment opportunities in selected European countries.</p></div>
  <div class="card"><div class="ic">⚡</div><h3>Simple Process</h3><p>We make the initial process easy to understand.</p></div>
  <div class="card"><div class="ic">💬</div><h3>Direct Communication</h3><p>Contact us directly through WhatsApp and other platforms.</p></div>
  <div class="card"><div class="ic">🧭</div><h3>Visa Guidance</h3><p>General information about work permits and visa processes.</p></div></div></div></section>
 <section class="sec"><div class="wrap split"><div class="photo"><img loading="lazy" src="images/team.webp" alt="EuroWork Hub international team"></div><div><span class="tag">INTERNATIONAL TEAM • RECRUITMENT</span><h2 style="color:var(--navy);margin:10px 0">Real people, with you at every step</h2><p style="color:var(--mut)">Our team explains the available opportunities, the documents you may need and the next steps, in simple language and on the apps you already use.</p><br><a class="btn btn-p" href="#/about">About Us</a></div></div></section>
 <section class="sec alt"><div class="wrap split"><div><span class="tag">DIRECT COMMUNICATION</span><h2 style="color:var(--navy);margin:10px 0">Questions? Talk to us directly</h2><p style="color:var(--mut)">Message us on WhatsApp, Telegram or Viber, or send an enquiry through the form.</p><br><a class="btn btn-p" href="#/contact">Contact Us</a></div><div class="photo"><img loading="lazy" src="images/contact.webp" alt="Support team helping candidates"></div></div></section>
 <section class="sec"><div class="wrap prose" style="margin:auto"><div class="hd"><h2>Frequently Asked Questions</h2></div>${faq()}</div></section>
 ${cta()}`},
countries(){
 return hero('images/team.webp','Job Placement Countries','Select a country to learn more or contact us about currently available opportunities.')+
 `<section class="sec"><div class="wrap"><div class="grid g4">${D.countries.map(countryCard).join('')}</div></div></section>
 <section class="sec alt"><div class="wrap"><div class="hd"><h2>Job Categories</h2><p>Tell us your profession and we will let you know if something matches.</p></div><div class="grid g4">${catCards()}</div></div></section>${cta()}`},
country(slug){
 const c=D.countries.find(x=>x.slug===slug);if(!c)return pages.notfound();
 return hero(c.img,`${c.flag} Work in ${c.name}`,c.tagline,`<a class="crumb" href="#/countries">← All countries</a>`,"bright")+
 `<section class="sec"><div class="wrap two"><div>
  <div class="card"><h3>Overview</h3><p>${c.overview}</p></div><br>
  <div class="card"><h3>Job categories</h3><p style="margin-bottom:14px">Positions commonly requested in ${c.name}:</p>${jobGallery(c.jobs)}</div><br>
  <div class="card"><h3>Work permit &amp; visa (general information)</h3><p>${c.permit}</p><br><div class="note">This is general information only and rules change. Always confirm requirements with the official immigration authority of ${c.name}. Visa approval is not guaranteed.</div><br><a class="btn btn-p" href="#/visa">Ask About Visa Assistance</a></div><br>
  <div class="card"><h3>Quick facts</h3><ul class="list">${c.living.map(l=>`<li>${l}</li>`).join('')}</ul></div></div>
  <aside class="card" style="position:sticky;top:90px"><h3>Ask about ${c.name}</h3><p style="margin-bottom:16px">Tell us about yourself and we'll explain currently available opportunities.</p>${formHTML('inquiry',c.name)}</aside></div></section>
 <section class="sec alt"><div class="wrap"><div class="hd"><h2>Other countries</h2></div><div class="grid g4">${D.countries.filter(x=>x!==c).map(countryCard).join('')}</div></div></section>${cta()}`},
visa(){
 return hero('images/visa.webp','Work Visa & Permit Assistance','Looking for work in Europe but unsure about the work permit or visa process? We provide general guidance and help you understand the next steps.')+
 `<section class="sec"><div class="wrap"><div class="grid g4 steps">
  <div class="card step"><h3>Choose a Country</h3><p>Select a country where job placement is available.</p></div>
  <div class="card step"><h3>Tell Us About Yourself</h3><p>Provide your nationality, profession and experience.</p></div>
  <div class="card step"><h3>Review Opportunities</h3><p>We explain the available employment options.</p></div>
  <div class="card step"><h3>Understand the Process</h3><p>Get general guidance about work permits and visa procedures.</p></div></div></div></section>
 <section class="sec alt"><div class="wrap two"><div><h2 style="color:var(--navy);margin-top:0">Documents you may need</h2><p style="color:var(--mut)">Requirements depend on the country, your nationality and the type of job. This is a general checklist only.</p><ul class="list">${D.documents.map(d=>`<li>${d}</li>`).join('')}</ul><br><div class="note"><b>Important:</b> Visa approval is not guaranteed. Decisions are made by government authorities, not by EuroWork Hub.</div></div>
  <div class="card" id="visaform"><h3>Request Visa Assistance</h3><p style="margin-bottom:16px">Fill in the form and we'll get back to you. For faster help, message us on WhatsApp.</p>${formHTML('visa')}</div></div></section>
 <section class="sec"><div class="wrap prose" style="margin:auto"><div class="hd"><h2>Visa FAQ</h2></div>${faq()}</div></section>${cta()}`},
about(){
 return hero('images/team.webp','Helping People Find Opportunities in Europe','EuroWork Hub is an independent job placement and information platform focused on connecting international candidates with employment opportunities in selected European countries.')+
 `<section class="sec"><div class="wrap two"><div class="prose"><h2 style="margin-top:0">Who we are</h2><p>We help international candidates understand which opportunities are currently available, which country may suit their profession, and what the general work permit and visa steps look like.</p><h2>What we do</h2><ul class="list"><li>Job placement</li><li>Country information</li><li>Work permit guidance</li><li>Visa assistance</li><li>Candidate support</li></ul><br><div class="note">We are not affiliated with any government. We do not guarantee employment or visa approval.</div></div>
 <div class="card"><h3>Stay safe when job hunting abroad</h3><ul class="list"><li>Ask for a written job offer or contract</li><li>Check the employer's company name and registration</li><li>Confirm permit rules on the official government website</li><li>Be careful with anyone promising guaranteed visas</li><li>Keep copies of everything you sign or pay for</li></ul></div></div></section>
 <section class="sec alt"><div class="wrap"><div class="hd"><h2>Opportunities across industries</h2><p>From building sites to hotels and factories.</p></div><div class="grid g4">${catCards()}</div></div></section>
 <section class="sec"><div class="wrap"><div class="hd"><h2>Our values</h2></div><div class="grid g4">
 <div class="card"><div class="ic">🤝</div><h3>Honesty</h3><p>Clear information about what we can and cannot do.</p></div>
 <div class="card"><div class="ic">💬</div><h3>Communication</h3><p>Direct, fast replies on the apps you already use.</p></div>
 <div class="card"><div class="ic">🧭</div><h3>Clarity</h3><p>Plain explanations of the process and next steps.</p></div>
 <div class="card"><div class="ic">🔒</div><h3>Privacy</h3><p>Your personal details are handled with care.</p></div></div></div></section>${cta()}`},
contact(){
 const row=(ic,t,v)=>`<li style="padding-left:0;border:0">${ic} <b>${t}:</b> ${v}</li>`;
 return hero('images/contact.webp','Contact Us','Tell us which country you are interested in and we will explain the available opportunities.')+
 `<section class="sec"><div class="wrap two"><div class="card"><h3>Send us a message</h3><p style="margin-bottom:16px">We usually reply fastest on WhatsApp.</p>${formHTML('contact')}</div>
 <div><div class="card"><h3>Reach us directly</h3><div class="row" style="display:grid;gap:10px;margin:14px 0">${btnWA()}${btnTG()}${btnVB()}${btnMS()}</div>
 <ul class="list" style="margin-top:10px">${C.email?row('✉️','Email',`<a href="mailto:${esc(C.email)}">${esc(C.email)}</a>`):''}${C.phoneDisplay?row('📞','Phone',esc(C.phoneDisplay)):''}${row('🌍','Countries','Serbia, Albania, Montenegro, Poland')}</ul></div><br>
 <div class="photo" style="margin-bottom:20px"><img loading="lazy" src="images/roadmap.webp" alt="Your career journey in Europe"></div><div class="card"><h3>Follow us</h3><div class="socials" style="margin-top:10px" id="contactSocials"></div></div></div></div></section>`},
privacy(){return hero('images/roadmap.webp','Privacy Policy','How EuroWork Hub handles your information.')+`<section class="sec"><div class="wrap prose"><p><i>Template — please have it reviewed by a qualified professional and adapt it to the laws that apply to your business (for example GDPR).</i></p>
 <h2>What we collect</h2><p>When you submit a form we collect the details you provide: name, WhatsApp number, email, nationality, current and preferred country, profession, years of experience and your message.</p>
 <h2>How we use it</h2><p>We use your information only to respond to your enquiry, explain available opportunities and provide general guidance on work permits and visas.</p>
 <h2>Sharing</h2><p>We may share relevant candidate details with employers or partners only in connection with your enquiry and with your agreement. We do not sell your data.</p>
 <h2>Retention &amp; your rights</h2><p>We keep your details only as long as needed. You may ask us to access, correct or delete your data by contacting us.</p>
 <h2>Security</h2><p>We take reasonable steps to protect submitted information, but no online system is completely secure.</p>
 <h2>Contact</h2><p>Use the <a href="#/contact">Contact page</a> for any privacy request.</p></div></section>`},
terms(){return hero('images/roadmap.webp','Terms of Use','Please read before using this website.')+`<section class="sec"><div class="wrap prose"><p><i>Template — have it reviewed by a qualified professional before relying on it.</i></p>
 <h2>Information only</h2><p>Content on this website is general information and not legal or immigration advice. Immigration rules change; always confirm with the official authority of the country concerned.</p>
 <h2>No guarantees</h2><p>We do not guarantee employment, a specific salary, or the approval of any work permit or visa. We are not affiliated with any government.</p>
 <h2>Availability</h2><p>Job opportunities depend on employers and may change or end at any time without notice.</p>
 <h2>Your responsibilities</h2><p>You agree to provide accurate information and genuine documents. Providing false information may lead to refusal of services.</p>
 <h2>Liability</h2><p>To the extent permitted by law, EuroWork Hub is not liable for losses arising from decisions made by employers or government authorities.</p></div></section>`},
notfound(){return `<section class="sec"><div class="wrap" style="text-align:center"><h1>Page not found</h1><p>The page you are looking for does not exist.</p><a class="btn btn-p" href="#/">Back to Home</a></div></section>`}
};

/* ---------- slider ---------- */
let timer;
function initSlider(){
 const sl=$('#slider');if(!sl)return;const slides=$$('.slide',sl),dots=$$('.dot',sl);let i=0;
 const go=n=>{i=(n+slides.length)%slides.length;slides.forEach((s,k)=>{s.classList.toggle('on',k===i);const v=$('video',s);if(v){k===i?v.play().catch(()=>{}):v.pause()}});dots.forEach((d,k)=>d.classList.toggle('on',k===i))};
 const start=()=>{clearInterval(timer);if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;timer=setInterval(()=>go(i+1),6500)};
 $('.arr.l',sl).onclick=()=>{go(i-1);start()};$('.arr.r',sl).onclick=()=>{go(i+1);start()};
 dots.forEach((d,k)=>d.onclick=()=>{go(k);start()});
 let x0=null;sl.addEventListener('touchstart',e=>x0=e.touches[0].clientX,{passive:true});
 sl.addEventListener('touchend',e=>{if(x0===null)return;const dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>50){go(i+(dx<0?1:-1));start()}x0=null});
 sl.addEventListener('mouseenter',()=>clearInterval(timer));sl.addEventListener('mouseleave',start);start();
}

/* ---------- socials ---------- */
function socialsHTML(){
 const items=[['whatsapp','WhatsApp'],['telegram','Telegram'],['viber','Viber'],['messenger','Messenger'],['facebook','Facebook'],['instagram','Instagram']];
 const on=items.filter(([k])=>has(k));
 return on.length?on.map(([k,n])=>`<a href="${S[k]}" target="_blank" rel="noopener">${n}</a>`).join(''):'<span style="opacity:.7;font-size:.9rem">Social links coming soon</span>';
}


/* ---------- side contact widget ---------- */
function initWidget(){
 const ICON={"whatsapp": "💬", "telegram": "✈️", "viber": "📞", "messenger": "💭"};
 const W=C.widget||{};
 const ch=[
  {k:'whatsapp',n:'WhatsApp',d:'Fastest reply',cls:'wa'},
  {k:'telegram',n:'Telegram',d:'Chat on Telegram',cls:'tg'},
  {k:'viber',n:'Viber',d:'Message or call on Viber',cls:'vb'},
  {k:'messenger',n:'Messenger',d:'Chat on Facebook Messenger',cls:'ms'}
 ];
 const mail=C.email?`<a class="wl em" href="mailto:${esc(C.email)}"><span class="wi">✉️</span><span class="wt"><b>Email</b><small>${esc(C.email)}</small></span></a>`:'';
 const root=document.createElement('div');root.className='cw';root.id='cw';
 root.innerHTML=`<button class="cw-tab" id="cwTab" aria-expanded="false" aria-controls="cwPanel" aria-label="Open contact options"><span class="cw-ic">💬</span><span class="cw-lbl">Contact us</span><span class="cw-pulse"></span></button>
 <div class="cw-panel" id="cwPanel" role="dialog" aria-label="Contact options" hidden>
  <div class="cw-head"><div><b>${esc(W.title||'Chat with us')}</b><small>${esc(W.subtitle||'')}</small></div><button class="cw-x" id="cwX" aria-label="Close">×</button></div>
  <div class="cw-body">
   ${ch.map(c=>`<a class="wl ${c.cls}" href="${link(c.k)}"${ext(c.k)} data-ch="${c.k}"><span class="wi" aria-hidden="true">${ICON[c.k]}</span><span class="wt"><b>${c.n}</b><small>${c.d}</small></span><span class="go">›</span></a>`).join('')}
   ${mail}
   <a class="wl fm" href="#/contact"><span class="wi">📝</span><span class="wt"><b>Send an enquiry</b><small>Fill in the contact form</small></span><span class="go">›</span></a>
  </div></div>`;
 document.body.appendChild(root);
 const tab=$('#cwTab'),panel=$('#cwPanel');
 const open=o=>{root.classList.toggle('open',o);panel.hidden=!o;tab.setAttribute('aria-expanded',o);if(o)root.classList.add('seen')};
 tab.onclick=()=>open(panel.hidden);$('#cwX').onclick=()=>{open(false);tab.focus()};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){open(false);tab.focus()}});
 document.addEventListener('click',e=>{if(!panel.hidden&&!root.contains(e.target))open(false)});
 panel.addEventListener('click',e=>{const a=e.target.closest('a');if(a&&a.getAttribute('href').startsWith('#'))open(false)});
 if(W.openOnLoadDelay>0)setTimeout(()=>{if(!sessionStorage.getItem('cwSeen')){open(true);sessionStorage.setItem('cwSeen','1')}},W.openOnLoadDelay*1000);
}

/* ---------- router ---------- */
function route(){
 clearInterval(timer);
 const h=(location.hash||'#/').replace(/^#/,'');const p=h.split('/').filter(Boolean);
 let key=p[0]||'home',html;
 if(key==='country')html=pages.country(p[1]);
 else if(pages[key]&&key!=='notfound'&&key!=='country')html=pages[key]();
 else if(key==='countries'||key==='home')html=pages[key]();
 else{key='';html=pages.notfound()}
 const m=$('#main');m.innerHTML=html;wireForms(m);initSlider();
 $$('#menu a[data-r]').forEach(a=>a.classList.toggle('on',a.dataset.r===(key==='country'?'countries':key)));
 const t={home:'EuroWork Hub — Job Opportunities in Europe',countries:'Job Placement Countries',country:'Work in '+(p[1]||''),visa:'Visa Assistance',about:'About Us',contact:'Contact Us',privacy:'Privacy Policy',terms:'Terms of Use'}[key]||'Page not found';
 document.title=key==='home'?t:`${t} | EuroWork Hub`;
 $('#menu').classList.remove('open');$('#burger').setAttribute('aria-expanded','false');
 $$('#contactSocials').forEach(e=>e.innerHTML=socialsHTML());
 if(!(h==='/'&&location.hash==='#countries'))window.scrollTo(0,0);
}
document.addEventListener('DOMContentLoaded',()=>{
 $('#yr').textContent=new Date().getFullYear();
 $('#footSocials').innerHTML=socialsHTML();
 $$('[data-social]').forEach(a=>{const k=a.dataset.social;if(has(k)){a.href=S[k];a.target='_blank';a.rel='noopener'}});
 $('#burger').onclick=()=>{const o=$('#menu').classList.toggle('open');$('#burger').setAttribute('aria-expanded',o)};
 initWidget();
 // support old "#countries" anchor
 if(location.hash==='#countries'){location.hash='#/';setTimeout(()=>$('#countries')&&$('#countries').scrollIntoView(),50)}
 window.addEventListener('hashchange',route);route();
});
})();
