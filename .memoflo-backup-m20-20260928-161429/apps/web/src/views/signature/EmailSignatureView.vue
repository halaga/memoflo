<script setup>
import { computed, ref, watch } from "vue";

const assetBase = "/signatures/";
const bannerWidth = 320;

const companies = {
  ringo: {
    name: "Ringo Telecommunications Limited",
    website: "https://ringo.ng",
    address: "75, Allen Avenue, Ikeja, Lagos, Nigeria",
    banner: "https://ringo.ng/assets/ringo-banner.png?v=1.1",
    bannerPreview: `${assetBase}ringo-banner.gif`,
    socials: {
      facebook: "https://www.facebook.com/share/1HourvExG4/",
      x: "https://x.com/ringotelcomLtd",
      instagram: "https://www.instagram.com/ringotelecommunicationsltd",
    },
  },
  approot: {
    name: "Approot Technologies",
    website: "https://approot.ng",
    address: "Lekki Phase 1, Lagos",
    banner: "https://ringo.ng/assets/approot-banner.gif?v=1.1",
    bannerPreview: `${assetBase}approot-banner.gif`,
    socials: {},
  },
};

const savedCompany = localStorage.getItem("memoflo_signature_company") || "ringo";
const companyKey = ref(companies[savedCompany] ? savedCompany : "ringo");
const company = ref(cloneCompany(companies[companyKey.value]));
const form = ref({ name: "", title: "", phone: "", email: "" });
const html = ref("");
const copied = ref("");

const socialIcons = {
  website: "https://img.icons8.com/ios-filled/20/1E90FF/domain.png",
  facebook: "https://img.icons8.com/ios-filled/20/1877F2/facebook-new.png",
  x: "https://img.icons8.com/ios-filled/20/000000/twitterx.png",
  instagram: "https://img.icons8.com/ios-filled/20/E4405F/instagram-new.png",
};

function cloneCompany(value) {
  return {
    ...value,
    socials: { ...value.socials },
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cleanPhone(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .replace(/[^0-9+]/g, "");
}

function socialLink(url, icon, alt) {
  if (!url) return "";

  return `
    <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-right:8px;text-decoration:none;">
      <img src="${escapeHtml(icon)}" width="20" height="20" alt="${escapeHtml(alt)}" style="display:block;width:20px;height:20px;border:0;" />
    </a>
  `;
}

function loadCompany() {
  company.value = cloneCompany(companies[companyKey.value]);
  localStorage.setItem("memoflo_signature_company", companyKey.value);
  generate();
}

function generate() {
  const currentCompany = company.value;
  const phone = cleanPhone(form.value.phone);
  const email = form.value.email.trim();
  const name = form.value.name.trim();
  const title = form.value.title.trim();

  html.value = `
<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#111827;width:100%;max-width:700px;">
  <tr>
    <td style="vertical-align:top;padding:0 22px 0 0;width:55%;">
      <p style="margin:0 0 10px 0;">
        Kind regards,<br />
        <strong>${escapeHtml(name)}</strong><br />
        ${escapeHtml(title)}<br />
        ${escapeHtml(currentCompany.name)}<br />
        📞 <a href="https://wa.me/${escapeHtml(phone)}" target="_blank" style="text-decoration:none;color:#0f766e;">${escapeHtml(phone)}</a><br />
        ✉️ <a href="mailto:${escapeHtml(email)}" style="text-decoration:none;color:#0f766e;">${escapeHtml(email)}</a>
      </p>

      <div style="margin-top:10px;">
        <span style="color:#0f766e;">📍 ${escapeHtml(currentCompany.address)}</span>
      </div>

      <div style="margin-top:12px;">
        ${socialLink(currentCompany.website, socialIcons.website, "Website")}
        ${socialLink(currentCompany.socials.facebook, socialIcons.facebook, "Facebook")}
        ${socialLink(currentCompany.socials.x, socialIcons.x, "X")}
        ${socialLink(currentCompany.socials.instagram, socialIcons.instagram, "Instagram")}
      </div>
    </td>

    <td style="vertical-align:middle;width:45%;padding:0;">
      <a href="${escapeHtml(currentCompany.website)}" target="_blank" rel="noopener noreferrer" style="display:block;text-decoration:none;">
        <img
          src="${escapeHtml(currentCompany.banner)}"
          width="${bannerWidth}"
          alt="${escapeHtml(currentCompany.name)}"
          style="display:block;width:${bannerWidth}px;max-width:100%;height:auto;border:0;"
        />
      </a>
    </td>
  </tr>
</table>`.trim();

  localStorage.setItem("memoflo_signature_form", JSON.stringify(form.value));
  localStorage.setItem("memoflo_signature_company", companyKey.value);
  copied.value = "";
}

const previewHtml = computed(() => {
  const currentCompany = company.value;

  return `
    <div style="font-family:Arial,sans-serif;padding:18px;border:1px solid #e5e7eb;border-radius:12px;">
      <div style="font-size:14px;line-height:1.5;color:#111827;">
        Kind regards,<br>
        <strong>${escapeHtml(form.value.name || "Your Name")}</strong><br>
        ${escapeHtml(form.value.title || "Your Job Title")}<br>
        ${escapeHtml(currentCompany.name)}<br>
        📞 ${escapeHtml(form.value.phone || "+234...")}<br>
        ✉️ ${escapeHtml(form.value.email || "you@company.com")}<br><br>
        <span style="color:#0f766e;">📍 ${escapeHtml(currentCompany.address)}</span>
      </div>
    </div>
  `;
});

async function copyText(text, message) {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = message;
  } catch {
    copied.value = "Copy failed — select the HTML manually.";
  }
}

function copyHtml() {
  copyText(html.value, "HTML copied to clipboard.");
}

async function copyRendered() {
  const box = document.createElement("div");
  box.innerHTML = html.value;

  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html.value], { type: "text/html" }),
        "text/plain": new Blob([box.innerText], { type: "text/plain" }),
      }),
    ]);
    copied.value = "Signature copied — paste it directly into your mail client.";
  } catch {
    copyHtml();
  }
}

function useFallbackBanner(event) {
  event.target.src = companyKey.value === "approot"
    ? `${assetBase}approot-banner.gif`
    : `${assetBase}ringo-banner.gif`;
}

try {
  const saved = JSON.parse(localStorage.getItem("memoflo_signature_form") || "null");

  if (saved) {
    form.value = { ...form.value, ...saved };
  }
} catch {
  // Ignore invalid saved signature data.
}

watch(form, generate, { deep: true });
generate();
</script>

<template>
  <div class="signature-page">
    <div class="page-head">
      <div>
        <div class="eyebrow">BUSINESS TOOL</div>
        <h1>Email Signature</h1>
        <p>Create a professional signature using your company identity.</p>
      </div>

      <RouterLink class="back" to="/modules">
        ← Module Hub
      </RouterLink>
    </div>

    <div class="signature-grid">
      <section class="card editor">
        <div class="card-head">
          <div>
            <h2>Signature details</h2>
            <p>
              These fields are used to generate your email signature.
            </p>
          </div>
        </div>

        <div class="company-banner" aria-label="Company signature banner">
          <div class="company-banner-label">Company banner</div>
          <img
            :src="company.bannerPreview"
            :alt="`${company.name} banner`"
            @error="useFallbackBanner"
          />
        </div>

        <div class="fields">
          <label>
            Company
            <select v-model="companyKey" @change="loadCompany">
              <option value="ringo">
                Ringo Telecommunications Limited
              </option>
              <option value="approot">Approot Technologies</option>
            </select>
          </label>

          <label>
            Full name
            <input
              v-model.trim="form.name"
              placeholder="David Dabo"
            />
          </label>

          <label>
            Job title
            <input
              v-model.trim="form.title"
              placeholder="IT Specialist"
            />
          </label>

          <label>
            Phone number
            <input
              v-model.trim="form.phone"
              placeholder="+2349036792601"
            />
          </label>

          <label>
            Email address
            <input
              v-model.trim="form.email"
              type="email"
              placeholder="name@company.com"
            />
          </label>

          <label>
            Address
            <input v-model.trim="company.address" />
          </label>

          <label>
            Website
            <input v-model.trim="company.website" />
          </label>
        </div>

        <div class="actions">
          <button class="primary" type="button" @click="generate">
            Generate signature
          </button>
          <button
            type="button"
            :disabled="!html"
            @click="copyHtml"
          >
            Copy HTML
          </button>
          <button
            type="button"
            :disabled="!html"
            @click="copyRendered"
          >
            Copy signature
          </button>
        </div>

        <p v-if="copied" class="success">{{ copied }}</p>
      </section>

      <section class="card preview-card">
        <div class="card-head">
          <div>
            <h2>Live preview</h2>
            <p>What the generated signature looks like.</p>
          </div>
        </div>

        <div
          class="preview-shell"
          v-html="html || previewHtml"
        ></div>

        <details class="html-details">
          <summary>View generated HTML</summary>
          <textarea readonly :value="html"></textarea>
        </details>
      </section>
    </div>
  </div>
</template>

<style scoped>
.signature-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 34px 30px 60px;
  color: #10213a;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  margin-bottom: 28px;
}

.eyebrow {
  font-size: 11px;
  letter-spacing: 0.18em;
  font-weight: 800;
  color: #71819a;
}

.page-head h1 {
  font-size: 34px;
  line-height: 1;
  margin: 7px 0 9px;
}

.page-head p,
.card-head p {
  margin: 0;
  color: #708099;
}

.back {
  border: 1px solid #dce3ec;
  border-radius: 12px;
  padding: 11px 15px;
  text-decoration: none;
  color: #20334f;
  background: #fff;
}

.signature-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  gap: 22px;
}

.card {
  background: #fff;
  border: 1px solid #e4e9f0;
  border-radius: 20px;
  box-shadow: 0 10px 35px rgba(16, 33, 58, 0.06);
  padding: 24px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.card-head h2 {
  margin: 0 0 5px;
  font-size: 20px;
}

.company-banner {
  background: #f5f7fa;
  border: 1px solid #e4e9f0;
  border-radius: 14px;
  padding: 12px;
  margin-bottom: 20px;
}

.company-banner-label {
  margin-bottom: 9px;
  color: #71819a;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.company-banner img {
  width: 100%;
  height: auto;
  max-height: 220px;
  object-fit: contain;
  object-position: center;
  border-radius: 9px;
  display: block;
}

.fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.fields label {
  font-size: 12px;
  font-weight: 750;
  color: #42546d;
}

.fields label:nth-child(2),
.fields label:nth-child(6),
.fields label:nth-child(7) {
  grid-column: 1 / -1;
}

.fields input,
.fields select {
  display: block;
  width: 100%;
  margin-top: 7px;
  box-sizing: border-box;
  border: 1px solid #d9e0e9;
  border-radius: 10px;
  padding: 12px 13px;
  font: inherit;
  color: #17283f;
  background: #fff;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 20px;
}

.actions button {
  border: 1px solid #d9e0e9;
  background: #fff;
  border-radius: 10px;
  padding: 11px 14px;
  font-weight: 750;
  cursor: pointer;
}

.actions .primary {
  background: #142b4d;
  color: #fff;
  border-color: #142b4d;
}

.actions button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.success {
  font-size: 13px;
  color: #18794e;
  margin: 13px 0 0;
}

.preview-shell {
  min-height: 300px;
  border: 1px dashed #cfd8e5;
  border-radius: 14px;
  padding: 20px;
  background: #fbfcfe;
  overflow: auto;
}

.html-details {
  margin-top: 18px;
}

.html-details summary {
  cursor: pointer;
  font-weight: 750;
  color: #41546d;
}

.html-details textarea {
  width: 100%;
  height: 180px;
  margin-top: 10px;
  border: 1px solid #d9e0e9;
  border-radius: 10px;
  padding: 12px;
  box-sizing: border-box;
  font: 12px/1.5 ui-monospace, monospace;
  background: #f8fafc;
}

.preview-card {
  min-width: 0;
}

@media (max-width: 900px) {
  .signature-grid {
    grid-template-columns: 1fr;
  }

  .page-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .fields {
    grid-template-columns: 1fr;
  }

  .fields label:nth-child(n) {
    grid-column: 1;
  }

  .signature-page {
    padding: 22px 16px;
  }
}
</style>
