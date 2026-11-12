<template>
<div class="signature-page">
  <div class="page-head">
    <div>
      <div class="eyebrow">
        BUSINESS TOOL
      </div>
      <h1>
        Email Signature
      </h1>
      <p>
        Create a professional signature using your company's configured identity.
      </p>
    </div>
    <RouterLink class="back" to="/services">
      ← Services
    </RouterLink>
  </div>
  <div class="signature-grid">
    <section class="card editor">
      <div class="card-head">
        <div>
          <h2>
            Signature details
          </h2>
          <p>
            Your company identity is managed by your workspace administrator.
          </p>
        </div>
      </div>
      <div v-if="company.previewUrl" class="company-banner">
        <img v-if="previewBanner" :src="previewBanner" :alt="company.name + ' email banner'" @error="previewFailed = true" />
      </div>
      <div class="fields">
        <label>
          Company
          <input :value="company.name" readonly />
        </label>
        <label>
          Full name
          <input v-model.trim="form.name" autocomplete="name" placeholder="Your full name" />
        </label>
        <label>
          Job title
          <input v-model.trim="form.title" placeholder="Your job title" />
        </label>
        <label>
          Phone number
          <input v-model.trim="form.phone" type="tel" placeholder="+234…" />
        </label>
        <label>
          Email address
          <input v-model.trim="form.email" type="email" placeholder="name@company.com" />
        </label>
        <label>
          Address
          <input :value="company.address" readonly />
        </label>
        <label>
          Website
          <input :value="company.website" readonly />
        </label>
      </div>
      <div class="actions">
        <button class="primary" @click="generate">
          Generate signature
        </button>
        <button @click="copyHtml" :disabled="!html">
          Copy HTML
        </button>
        <button @click="copyRendered" :disabled="!html">
          Copy signature
        </button>
      </div>
      <p v-if="copied" class="success" role="status">
        {{ copied }}
      </p>
      <p v-if="loadError" class="load-error" role="alert">
        {{ loadError }}
      </p>
    </section>
    <section class="card preview-card">
      <div class="card-head">
        <div>
          <h2>
            Live preview
          </h2>
          <p>
            Copy the rendered signature into your email client.
          </p>
        </div>
      </div>
      <div class="preview-shell">
        <div class="signature-render" v-html="html || previewHtml">
        </div>
      </div>
      <details class="html-details">
        <summary>
          View generated HTML
        </summary>
        <textarea readonly :value="html">
        </textarea>
      </details>
    </section>
  </div>
</div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { api, assetUrl, getSavedEmployee } from '../../services/api';
const employee = getSavedEmployee();
const company = ref({ id: '', name: 'Your company', website: '', address: '', bannerUrl: '', previewUrl: '', socials: {} });
const form = ref({
    name: '',
    title: '',
    phone: '',
    email: ''
});
const html = ref('');
const copied = ref('');
const loadError = ref('');
const previewFailed = ref(false);
const previewBanner = computed(() => {
    if (previewFailed.value || !company.value.previewUrl)
        return '';
    return company.value.previewUrl.startsWith('/') ? company.value.previewUrl : assetUrl(company.value.previewUrl);
});
const storageKey = computed(() => `memoflo_signature_form:${company.value.id || 'tenant'}:${employee?._id || employee?.id || 'employee'}`);
function esc(value) {
return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function cleanPhone(value) { return String(value || '').replace(/\s+/g, '').replace(/[^0-9+]/g, ''); }
function link(url, label) {
    if (!url)
        return '';
    return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" style="margin-right:8px;text-decoration:none;color:#0f766e;font-family:Arial,sans-serif;font-size:12px;">${esc(label)}</a>`;
}
function generate() {
    const c = company.value;
    const phone = cleanPhone(form.value.phone);
    const phoneLine = phone ? `📞 <a href="https://wa.me/${esc(phone.replace(/^\+/, ''))}" style="color:#111827;text-decoration:none;">${esc(form.value.phone)}</a><br>` : '';
    const emailLine = form.value.email ? `✉️ <a href="mailto:${esc(form.value.email)}" style="color:#111827;text-decoration:none;">${esc(form.value.email)}</a><br>` : '';
    const socials = [link(c.website, 'Website'), link(c.socials?.facebook, 'Facebook'), link(c.socials?.x, 'X'), link(c.socials?.instagram,
        'Instagram'), link(c.socials?.linkedin, 'LinkedIn')].join('');
    const banner = c.bannerUrl ? `<td style="width:48%;vertical-align:top;"><img src="${esc(c.bannerUrl)}" style="width:100%;max-width:100%;height:auto;max-height:150px;object-fit:contain;display:block;border-radius:8px;" alt="${esc(c.name)}" /></td>` : '';
    const leftWidth = c.bannerUrl ? '52%' : '100%';
    html.value = `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:14px;width:100%;max-width:700px;color:#111827;table-layout:fixed;border-collapse:collapse;"><tr><td style="vertical-align:top;padding-right:16px;width:${leftWidth};overflow-wrap:anywhere;"><strong>${esc(form.value.name)}</strong><br>${esc(form.value.title)}<br>${esc(c.name)}<br>${phoneLine}${emailLine}${c.address ? `<br><div>📍 <span style="color:#0f766e;">${esc(c.address)}</span></div>` : ''}${socials ? `<div style="margin-top:10px;">${socials}</div>` : ''}</td>${banner}</tr></table>`;
    try {
        localStorage.setItem(storageKey.value, JSON.stringify(form.value));
    }
    catch { }
    copied.value = '';
}
const previewHtml = computed(() => `<div style="font-family:Arial,sans-serif;padding:14px;color:#111827;"><strong>${esc(form.value.name || 'Your Name')}</strong><br>${esc(form.value.title || 'Your Job Title')}<br>${esc(company.value.name)}<br>${esc(form.value.phone || 'Phone number')}<br>${esc(form.value.email || 'Email address')}${company.value.address ? `<br>${esc(company.value.address)}` : ''}</div>`);
async function copyText(value, message) {
    try {
        await navigator.clipboard.writeText(value);
        copied.value = message;
    }
    catch {
        copied.value = 'Clipboard access failed — open View generated HTML and copy it manually.';
    }
}
function copyHtml() { return copyText(html.value, 'HTML copied to clipboard.'); }
async function copyRendered() {
    const box = document.createElement('div');
    box.innerHTML = html.value;
    try {
        await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html.value], { type: 'text/html' }),
            'text/plain': new Blob([box.innerText], { type: 'text/plain' }) })]);
        copied.value = 'Signature copied — paste it directly into your mail client.';
    }
    catch {
        await copyText(html.value, 'HTML copied to clipboard.');
    }
}
onMounted(async () => {
    try {
        const result = await api.getCompanyWorkspace();
        const workspace = result?.data || result;
        const c = workspace?.company || {};
        const identity = workspace?.signature || {};
        company.value = {
            id: c._id || c.id || employee?.company?._id || '',
            name: c.name || employee?.company?.name || 'Your company',
            website: identity.website || c.website || '',
            address: identity.address || [c.address, c.city, c.state, c.country].filter(Boolean).join(', '),
            bannerUrl: identity.bannerUrl || '',
            previewUrl: identity.previewUrl || '',
            socials: identity.socials || {},
        };
        form.value = {
            name: [employee?.firstName, employee?.lastName].filter(Boolean).join(' '),
            title: employee?.position?.title || employee?.designation?.name || employee?.jobTitle || '',
            phone: employee?.phone || '',
            email: employee?.email || '',
        };
        try {
            const saved = JSON.parse(localStorage.getItem(storageKey.value) || 'null');
            if (saved)
                form.value = { ...form.value, ...saved };
        }
        catch { }
        generate();
    }
    catch (error) {
        loadError.value = error?.message || 'Unable to load your company signature settings.';
        company.value.name = employee?.company?.name || 'Your company';
        generate();
    }
});
watch(form, generate, { deep: true });
</script>

<style scoped>
.signature-page {
  width: 100%;
  max-width: 1280px;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 26px clamp(14px,2.5vw,30px) 48px;
  color: var(--mf-text,#10213a);
}
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 22px;
}
.eyebrow {
  font-size: 10px;
  letter-spacing: .15em;
  font-weight: 800;
  color: var(--mf-muted,#71819a);
}
.page-head h1 {
  font-size: clamp(25px,3vw,32px);
  line-height: 1.15;
  margin: 7px 0 9px;
}
.page-head p,.card-head p {
  margin: 0;
  color: var(--mf-muted,#708099);
  font-size: 13px;
  line-height: 1.55;
}
.back {
  flex: none;
  border: 1px solid var(--mf-border,#dce3ec);
  border-radius: 10px;
  padding: 10px 13px;
  text-decoration: none;
  color: var(--mf-text,#20334f);
  background: var(--mf-surface,#fff);
}
.signature-grid {
  display: grid;
  grid-template-columns: minmax(0,1fr) minmax(0,1fr);
  align-items: start;
  gap: 18px;
}
.card {
  min-width: 0;
  box-sizing: border-box;
  background: var(--mf-surface,#fff);
  color: var(--mf-text,#10213a);
  border: 1px solid var(--mf-border,#e4e9f0);
  border-radius: 17px;
  box-shadow: var(--mf-shadow,0 8px 25px rgba(16,33,58,.05));
  padding: clamp(16px,2vw,23px);
}
.card-head {
  margin-bottom: 16px;
}
.card-head h2 {
  margin: 0 0 5px;
  font-size: 18px;
}
.company-banner {
  background: var(--mf-surface-soft,#f5f7fa);
  border-radius: 12px;
  padding: 7px;
  margin-bottom: 17px;
}
.company-banner img {
  display: block;
  width: 100%;
  height: auto;
  max-height: 125px;
  object-fit: contain;
  border-radius: 8px;
}
.fields {
  display: grid;
  grid-template-columns: repeat(2,minmax(0,1fr));
  gap: 13px;
}
.fields label {
  min-width: 0;
  font-size: 12px;
  font-weight: 700;
  color: var(--mf-muted,#42546d);
}
.fields label:nth-child(2),.fields label:nth-child(6),.fields label:nth-child(7) {
  grid-column: 1/-1;
}
.fields input,.fields select {
  display: block;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  margin-top: 6px;
  border: 1px solid var(--mf-border,#d9e0e9);
  border-radius: 9px;
  padding: 10px 11px;
  font: inherit;
  color: var(--mf-text,#17283f);
  background: var(--mf-surface,#fff);
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}
.actions button {
  border: 1px solid var(--mf-border,#d9e0e9);
  color: var(--mf-text,#17283f);
  background: var(--mf-surface,#fff);
  border-radius: 9px;
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 750;
  cursor: pointer;
}
.actions .primary {
  background: var(--mf-primary,#142b4d);
  color: #fff;
  border-color: var(--mf-primary,#142b4d);
}
.actions button:disabled {
  opacity: .45;
  cursor: not-allowed;
}
.success {
  font-size: 12px;
  color: #18794e;
  margin: 12px 0 0;
}
.preview-shell {
  min-width: 0;
  min-height: 260px;
  box-sizing: border-box;
  border: 1px dashed var(--mf-border,#cfd8e5);
  border-radius: 12px;
  padding: clamp(10px,1.6vw,18px);
  background: var(--mf-surface-soft,#fbfcfe);
  overflow: auto;
}
.signature-render {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-wrap: anywhere;
}
.signature-render :deep(table) {
  width: 100% !important;
  max-width: 100% !important;
  table-layout: fixed !important;
}
.signature-render :deep(td) {
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.signature-render :deep(img) {
  max-width: 100% !important;
  height: auto !important;
  object-fit: contain;
}
.signature-render :deep(a) {
  overflow-wrap: anywhere;
}
.html-details {
  margin-top: 15px;
}
.html-details summary {
  cursor: pointer;
  font-size: 12px;
  font-weight: 750;
  color: var(--mf-muted,#41546d);
}
.html-details textarea {
  width: 100%;
  height: 170px;
  margin-top: 9px;
  border: 1px solid var(--mf-border,#d9e0e9);
  border-radius: 9px;
  padding: 10px;
  box-sizing: border-box;
  font: 11px/1.5 ui-monospace,monospace;
  color: var(--mf-text,#17283f);
  background: var(--mf-surface-soft,#f8fafc);
}
.preview-card {
  min-width: 0;
}
@media (max-width:900px) {
  .signature-grid {
    grid-template-columns: minmax(0,1fr);
  }
  .page-head {
    align-items: flex-start;
    flex-direction: column;
  }
}
@media (max-width:520px) {
  .fields {
    grid-template-columns: minmax(0,1fr);
  }
  .fields label:nth-child(n) {
    grid-column: 1;
  }
  .signature-page {
    padding: 20px 12px 36px;
  }
  .actions button {
    flex: 1 1 auto;
  }
}
</style>
