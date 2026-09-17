<script setup>
import { computed, ref, watch } from "vue";

const assetBase = "/signatures/";

const companies = {
  ringo: {
    name: "Ringo Telecommunications Limited",
    website: "https://ringo.ng",
    address: "75, Allen Avenue, Ikeja, Lagos, Nigeria",
    banner:
      "https://ringo.ng/assets/ringo-banner.png?v=1.1",
    bannerPreview: `${assetBase}ringo-banner.gif`,
    logoPreview: `${assetBase}ringologo.png`,
    socials: {
      facebook: "https://www.facebook.com/share/1HourvExG4/",
      x: "https://x.com/ringotelcomLtd",
      instagram:
        "https://www.instagram.com/ringotelecommunicationsltd",
    },
  },
  approot: {
    name: "Approot Technologies",
    website: "https://approot.ng",
    address: "Lekki Phase 1, Lagos",
    banner:
      "https://ringo.ng/assets/approot-banner.gif?v=1.1",
    bannerPreview: `${assetBase}approot-banner.gif`,
    logoPreview: `${assetBase}ringologo.png`,
    socials: {},
  },
};

const savedCompany =
  localStorage.getItem("memoflo_signature_company") || "ringo";

const companyKey = ref(
  companies[savedCompany] ? savedCompany : "ringo"
);
const company = ref(cloneCompany(companies[companyKey.value]));
const form = ref({
  name: "",
  title: "",
  phone: "",
  email: "",
});
const html = ref("");
const copied = ref("");

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

function socialLink(url, label) {
  if (!url) {
    return "";
  }

  return `
    <a
      href="${escapeHtml(url)}"
      target="_blank"
      rel="noopener noreferrer"
      style="margin-right:8px;text-decoration:none;color:#142b4d;"
    >
      ${escapeHtml(label)}
    </a>
  `;
}

function loadCompany() {
  company.value = cloneCompany(companies[companyKey.value]);
  localStorage.setItem(
    "memoflo_signature_company",
    companyKey.value
  );
  generate();
}

function generate() {
  const currentCompany = company.value;
  const phone = cleanPhone(form.value.phone);
  const email = form.value.email.trim();

  html.value = `
<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:14px;max-width:700px;color:#111827;">
  <tr>
    <td style="vertical-align:top;padding-right:20px;width:50%;">
      <img
        src="${escapeHtml(currentCompany.logoPreview)}"
        width="120"
        alt="${escapeHtml(currentCompany.name)} logo"
        style="display:block;max-width:120px;margin-bottom:12px;"
      />
      <strong>${escapeHtml(form.value.name)}</strong><br>
      ${escapeHtml(form.value.title)}<br>
      ${escapeHtml(currentCompany.name)}<br>
      📞 <a href="https://wa.me/${escapeHtml(phone)}" style="color:#111827;">${escapeHtml(phone)}</a><br>
      ✉️ <a href="mailto:${escapeHtml(email)}" style="color:#111827;">${escapeHtml(email)}</a><br><br>
      <div>📍 <span style="color:#0f766e;">${escapeHtml(currentCompany.address)}</span></div>
      <div style="margin-top:10px;">
        ${socialLink(currentCompany.website, "Website")}
        ${socialLink(currentCompany.socials.facebook, "Facebook")}
        ${socialLink(currentCompany.socials.x, "X")}
        ${socialLink(currentCompany.socials.instagram, "Instagram")}
      </div>
    </td>
    <td style="width:50%;vertical-align:top;">
      <img
        src="${escapeHtml(currentCompany.banner)}"
        width="450"
        alt="${escapeHtml(currentCompany.name)}"
        style="width:450px;max-width:100%;height:150px;display:block;border-radius:8px;"
      />
    </td>
  </tr>
</table>`.trim();

  localStorage.setItem(
    "memoflo_signature_form",
    JSON.stringify(form.value)
  );
  localStorage.setItem(
    "memoflo_signature_company",
    companyKey.value
  );
  copied.value = "";
}

const previewHtml = computed(() => {
  const currentCompany = company.value;

  return `
    <div style="font-family:Arial,sans-serif;padding:18px;border:1px solid #e5e7eb;border-radius:12px;">
      <img
        src="${escapeHtml(currentCompany.logoPreview)}"
        style="width:120px;max-height:70px;object-fit:contain;object-position:left;margin-bottom:12px;"
        alt="Company logo"
      />
      <br>
      <strong>${escapeHtml(form.value.name || "Your Name")}</strong><br>
      ${escapeHtml(form.value.title || "Your Job Title")}<br>
      ${escapeHtml(currentCompany.name)}<br>
      📞 ${escapeHtml(form.value.phone || "+234...")}<br>
      ✉️ ${escapeHtml(form.value.email || "you@company.com")}<br><br>
      📍 <span style="color:#0f766e">${escapeHtml(currentCompany.address)}</span>
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
        "text/html": new Blob([html.value], {
          type: "text/html",
        }),
        "text/plain": new Blob([box.innerText], {
          type: "text/plain",
        }),
      }),
    ]);
    copied.value =
      "Signature copied — paste it directly into your mail client.";
  } catch {
    copyHtml();
  }
}

function useFallbackBanner(event) {
  event.target.src = `${assetBase}ringo-banner.gif`;
}

try {
  const saved = JSON.parse(
    localStorage.getItem("memoflo_signature_form") || "null"
  );

  if (saved) {
    form.value = {
      ...form.value,
      ...saved,
    };
  }
} catch {
  // Ignore invalid local signature data and use the defaults.
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

        <div class="company-banner">
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
  border-radius: 14px;
  padding: 8px;
  margin-bottom: 20px;
}

.company-banner img {
  width: 100%;
  height: 130px;
  object-fit: cover;
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
