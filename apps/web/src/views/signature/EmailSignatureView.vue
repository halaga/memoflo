<template>
  <div class="signature-page">
    <div class="page-head">
      <div>
        <div class="eyebrow">BUSINESS TOOL</div>
        <h1>Email Signature</h1>
        <p>Create a professional signature using your company identity.</p>
      </div>
      <RouterLink class="back" to="/services">← Services</RouterLink>
    </div>

    <div class="signature-grid">
      <section class="card editor">
        <div class="card-head"><div><h2>Signature details</h2><p>These fields are used to generate your email signature.</p></div></div>
        <div class="company-banner"><img :src="company.bannerPreview" alt="Ringo banner" @error="useFallbackBanner" /></div>
        <div class="fields">
          <label>Company<select v-model="companyKey" @change="loadCompany"><option value="ringo">Ringo Telecommunications Limited</option><option value="approot">Approot Technologies</option></select></label>
          <label>Full name<input v-model.trim="form.name" placeholder="David Dabo" /></label>
          <label>Job title<input v-model.trim="form.title" placeholder="IT Specialist" /></label>
          <label>Phone number<input v-model.trim="form.phone" placeholder="+2349036792601" /></label>
          <label>Email address<input v-model.trim="form.email" type="email" placeholder="name@company.com" /></label>
          <label>Address<input v-model.trim="company.address" /></label>
          <label>Website<input v-model.trim="company.website" /></label>
        </div>
        <div class="actions"><button class="primary" @click="generate">Generate signature</button><button @click="copyHtml" :disabled="!html">Copy HTML</button><button @click="copyRendered" :disabled="!html">Copy signature</button></div>
        <p v-if="copied" class="success">{{ copied }}</p>
      </section>

      <section class="card preview-card">
        <div class="card-head"><div><h2>Live preview</h2><p>What the generated signature looks like.</p></div></div>
        <div class="preview-shell"><div class="signature-render" v-html="html || previewHtml"></div></div>
        <details class="html-details"><summary>View generated HTML</summary><textarea readonly :value="html"></textarea></details>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const root = '/signatures/';
const companies = {
  ringo: { name:'Ringo Telecommunications Limited', website:'https://ringo.ng', address:'75, Allen Avenue, Ikeja, Lagos, Nigeria', banner:'https://ringo.ng/assets/ringo-banner.png?v=1.1', bannerPreview:root+'ringo-banner.gif', socials:{facebook:'https://www.facebook.com/share/1HourvExG4/', x:'https://x.com/ringotelcomLtd', instagram:'https://www.instagram.com/ringotelecommunicationsltd'} },
  approot: { name:'Approot Technologies', website:'https://approot.ng', address:'Lekki Phase 1, Lagos', banner:'https://ringo.ng/assets/approot-banner.gif?v=1.1', bannerPreview:root+'approot-banner.gif', socials:{} }
};
const companyKey=ref(localStorage.getItem('memoflo_signature_company')||'ringo');
const company=ref({...companies[companyKey.value], socials:{...companies[companyKey.value].socials}});
const form=ref({name:'',title:'',phone:'',email:''}); const html=ref(''); const copied=ref('');
function loadCompany(){company.value={...companies[companyKey.value],socials:{...companies[companyKey.value].socials}}; localStorage.setItem('memoflo_signature_company',companyKey.value); generate();}
function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function phoneClean(v){return String(v||'').replace(/\s+/g,'').replace(/[^0-9+]/g,'');}
function social(url,icon,label){if(!url)return '';return `<a href="${esc(url)}" target="_blank" style="margin-right:8px;text-decoration:none;"><span style="font-family:Arial;font-size:12px;">${esc(label)}</span></a>`;}
function generate(){
 const c=company.value, p=phoneClean(form.value.phone), email=form.value.email;
 html.value=`<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:14px;width:100%;max-width:700px;color:#111827;table-layout:fixed;overflow-wrap:anywhere;">\n<tr>\n<td style="vertical-align:top;padding-right:16px;width:52%;overflow-wrap:anywhere;">\n<strong>${esc(form.value.name)}</strong><br>${esc(form.value.title)}<br>${esc(c.name)}<br>📞 <a href="https://wa.me/${esc(p)}" style="color:#111827;">${esc(p)}</a><br>✉️ <a href="mailto:${esc(email)}" style="color:#111827;">${esc(email)}</a><br><br>\n<div>📍 <span style="color:#0f766e;">${esc(c.address)}</span></div>\n<div style="margin-top:10px;">${social(c.website,'','Website')}${social(c.socials.facebook,'','Facebook')}${social(c.socials.x,'','X')}${social(c.socials.instagram,'','Instagram')}</div>\n</td>\n<td style="width:50%;vertical-align:top;"><img src="${esc(c.banner)}" style="width:100%;max-width:100%;height:auto;max-height:150px;object-fit:contain;display:block;border-radius:8px;" alt="${esc(c.name)}" /></td>\n</tr>\n</table>`;
 localStorage.setItem('memoflo_signature_form',JSON.stringify(form.value)); localStorage.setItem('memoflo_signature_company',companyKey.value); copied.value='';
}
const previewHtml=computed(()=>`<div style="font-family:Arial,sans-serif;padding:18px;border:1px solid #e5e7eb;border-radius:12px;"><img src="${company.value.bannerPreview}" style="width:100%;max-height:150px;object-fit:cover;border-radius:8px;margin-bottom:18px;"/><strong>${esc(form.value.name||'Your Name')}</strong><br>${esc(form.value.title||'Your Job Title')}<br>${esc(company.value.name)}<br>📞 ${esc(form.value.phone||'+234...')}<br>✉️ ${esc(form.value.email||'you@company.com')}<br><br>📍 <span style="color:#0f766e">${esc(company.value.address)}</span></div>`);
async function copyText(text,msg){try{await navigator.clipboard.writeText(text);copied.value=msg;}catch(e){copied.value='Copy failed — select the HTML manually.';}}
function copyHtml(){copyText(html.value,'HTML copied to clipboard.');}
async function copyRendered(){const box=document.createElement('div');box.innerHTML=html.value;try{await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([html.value],{type:'text/html'}),'text/plain':new Blob([box.innerText],{type:'text/plain'})})]);copied.value='Signature copied — paste it directly into your mail client.';}catch(e){copyText(html.value,'HTML copied to clipboard.');}}
function useFallbackBanner(e){e.target.src=root+'ringo-banner.gif';}
try{const saved=JSON.parse(localStorage.getItem('memoflo_signature_form')||'null');if(saved)form.value={...form.value,...saved};}catch{}
watch(form,generate,{deep:true});
generate();
</script>

<style scoped>
.signature-page { width:100%; max-width:1280px; box-sizing:border-box; margin:0 auto; padding:26px clamp(14px,2.5vw,30px) 48px; color:var(--mf-text,#10213a); }
.page-head { display:flex; justify-content:space-between; align-items:flex-end; gap:20px; margin-bottom:22px; }
.eyebrow { font-size:10px; letter-spacing:.15em; font-weight:800; color:var(--mf-muted,#71819a); }
.page-head h1 { font-size:clamp(25px,3vw,32px); line-height:1.15; margin:7px 0 9px; }
.page-head p,.card-head p { margin:0; color:var(--mf-muted,#708099); font-size:13px; line-height:1.55; }
.back { flex:none; border:1px solid var(--mf-border,#dce3ec); border-radius:10px; padding:10px 13px; text-decoration:none; color:var(--mf-text,#20334f); background:var(--mf-surface,#fff); }
.signature-grid { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); align-items:start; gap:18px; }
.card { min-width:0; box-sizing:border-box; background:var(--mf-surface,#fff); color:var(--mf-text,#10213a); border:1px solid var(--mf-border,#e4e9f0); border-radius:17px; box-shadow:var(--mf-shadow,0 8px 25px rgba(16,33,58,.05)); padding:clamp(16px,2vw,23px); }
.card-head { margin-bottom:16px; } .card-head h2 { margin:0 0 5px; font-size:18px; }
.company-banner { background:var(--mf-surface-soft,#f5f7fa); border-radius:12px; padding:7px; margin-bottom:17px; }
.company-banner img { display:block; width:100%; height:auto; max-height:125px; object-fit:contain; border-radius:8px; }
.fields { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:13px; }
.fields label { min-width:0; font-size:12px; font-weight:700; color:var(--mf-muted,#42546d); }
.fields label:nth-child(2),.fields label:nth-child(6),.fields label:nth-child(7) { grid-column:1/-1; }
.fields input,.fields select { display:block; width:100%; min-width:0; box-sizing:border-box; margin-top:6px; border:1px solid var(--mf-border,#d9e0e9); border-radius:9px; padding:10px 11px; font:inherit; color:var(--mf-text,#17283f); background:var(--mf-surface,#fff); }
.actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:18px; }
.actions button { border:1px solid var(--mf-border,#d9e0e9); color:var(--mf-text,#17283f); background:var(--mf-surface,#fff); border-radius:9px; padding:10px 12px; font-size:12px; font-weight:750; cursor:pointer; }
.actions .primary { background:var(--mf-primary,#142b4d); color:#fff; border-color:var(--mf-primary,#142b4d); }
.actions button:disabled { opacity:.45; cursor:not-allowed; } .success { font-size:12px; color:#18794e; margin:12px 0 0; }
.preview-shell { min-width:0; min-height:260px; box-sizing:border-box; border:1px dashed var(--mf-border,#cfd8e5); border-radius:12px; padding:clamp(10px,1.6vw,18px); background:var(--mf-surface-soft,#fbfcfe); overflow:auto; }
.signature-render { width:100%; max-width:100%; min-width:0; overflow-wrap:anywhere; }
.signature-render :deep(table) { width:100% !important; max-width:100% !important; table-layout:fixed !important; }
.signature-render :deep(td) { max-width:100%; overflow-wrap:anywhere; word-break:break-word; }
.signature-render :deep(img) { max-width:100% !important; height:auto !important; object-fit:contain; }
.signature-render :deep(a) { overflow-wrap:anywhere; }
.html-details { margin-top:15px; } .html-details summary { cursor:pointer; font-size:12px; font-weight:750; color:var(--mf-muted,#41546d); }
.html-details textarea { width:100%; height:170px; margin-top:9px; border:1px solid var(--mf-border,#d9e0e9); border-radius:9px; padding:10px; box-sizing:border-box; font:11px/1.5 ui-monospace,monospace; color:var(--mf-text,#17283f); background:var(--mf-surface-soft,#f8fafc); }
.preview-card { min-width:0; }
@media(max-width:900px) { .signature-grid { grid-template-columns:minmax(0,1fr); } .page-head { align-items:flex-start; flex-direction:column; } }
@media(max-width:520px) { .fields { grid-template-columns:minmax(0,1fr); } .fields label:nth-child(n) { grid-column:1; } .signature-page { padding:20px 12px 36px; } .actions button { flex:1 1 auto; } }
</style>
