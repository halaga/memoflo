import CompanyRepository from "./company.repository.js";
import { ALL_MODULE_IDS, MODULE_CATALOGUE, } from "./module.catalogue.js";
const DEFAULT_BRANDING = {
    primaryColor: "#2563EB",
    secondaryColor: "#1E293B",
};
// Preserve the signature Ringo already uses. These defaults are deliberately
// restricted to the RINGO tenant; no other company inherits Ringo assets or links.
const RINGO_SIGNATURE_DEFAULTS = {
    bannerUrl: "https://ringo.ng/assets/ringo-banner.png?v=1.1",
    previewUrl: "/signatures/ringo-banner.gif",
    address: "75, Allen Avenue, Ikeja, Lagos, Nigeria",
    website: "https://ringo.ng",
    socials: {
        facebook: "https://www.facebook.com/share/1HourvExG4/",
        x: "https://x.com/ringotelcomLtd",
        instagram: "https://www.instagram.com/ringotelecommunicationsltd",
    },
};
function resolveSignature(company) {
    const configured = company.settings?.signature || {};
    const isRingo = String(company.code || "").toUpperCase() === "RINGO";
    const defaults = isRingo ? RINGO_SIGNATURE_DEFAULTS : {};
const value = (source, key, fallback = "") => Object.prototype.hasOwnProperty.call(source || {}, key) ? source[key] : fallback;
    return {
        bannerUrl: value(configured, "bannerUrl", defaults.bannerUrl || ""),
        previewUrl: value(configured, "previewUrl", defaults.previewUrl || ""),
        address: value(configured, "address", defaults.address || company.address || ""),
        website: value(configured, "website", defaults.website || company.website || ""),
        socials: {
            facebook: value(configured.socials, "facebook", defaults.socials?.facebook || ""),
            x: value(configured.socials, "x", defaults.socials?.x || ""),
            instagram: value(configured.socials, "instagram", defaults.socials?.instagram || ""),
            linkedin: value(configured.socials, "linkedin", defaults.socials?.linkedin || ""),
        },
    };
}
function validateOptionalUrl(value, label, { allowRelative = false } = {}) {
    const text = String(value ?? "").trim();
    if (!text)
        return "";
    if (allowRelative && text.startsWith("/") && !text.startsWith("//"))
        return text;
    let parsed;
    try {
        parsed = new URL(text);
    }
    catch {
        throw new Error(`${label} must be a valid HTTP(S) URL${allowRelative ? " or a site-relative path" : ""}`);
    }
    if (!["http:", "https:"].includes(parsed.protocol))
        throw new Error(`${label} must use HTTP or HTTPS`);
    return text;
}
class CompanyService {
    async getWorkspace(companyId) {
        const companyDoc = await CompanyRepository.findById(companyId);
        if (!companyDoc) {
            throw new Error("Company not found");
        }
        const company = companyDoc.toObject
            ? companyDoc.toObject()
            : companyDoc;
        const enabledModules = Array.isArray(company.settings?.modules)
            ? company.settings.modules
            : [];
        const configuredBranding = company.settings?.branding || {};
        const branding = {
            logo: configuredBranding.logo || company.logo || "",
            wallpaper: configuredBranding.wallpaper || "",
            primaryColor: configuredBranding.primaryColor ||
                company.primaryColor ||
                DEFAULT_BRANDING.primaryColor,
            secondaryColor: configuredBranding.secondaryColor ||
                company.secondaryColor ||
                DEFAULT_BRANDING.secondaryColor,
            tagline: configuredBranding.tagline || "Workflow, simplified.",
        };
        return {
            company: {
                ...company,
                branding,
            },
            signature: resolveSignature(company),
            modules: MODULE_CATALOGUE.map((module) => ({
                ...module,
                enabled: enabledModules.includes(module.id),
            })),
        };
    }
    async getPublicBySlug(slug) {
        const company = await CompanyRepository.findBySlug(slug);
        if (!company) {
            throw new Error("Company tenant not found");
        }
        const object = company.toObject ? company.toObject() : company;
        const configuredBranding = object.settings?.branding || {};
        return {
            name: object.name,
            code: object.code,
            slug: object.slug,
            logo: configuredBranding.logo || object.logo || "",
            wallpaper: configuredBranding.wallpaper || "",
            primaryColor: configuredBranding.primaryColor ||
                object.primaryColor ||
                DEFAULT_BRANDING.primaryColor,
            secondaryColor: configuredBranding.secondaryColor ||
                object.secondaryColor ||
                DEFAULT_BRANDING.secondaryColor,
            tagline: configuredBranding.tagline || "Workflow, simplified.",
        };
    }
    async updateProfile(companyId, profile = {}) {
const allowed = ["name", "email", "phone", "website", "industry", "address", "city", "state", "country", "timezone"];
        const cleaned = {};
        for (const key of allowed) {
            if (profile[key] === undefined)
                continue;
            const value = String(profile[key] ?? "").trim();
            const limits = { name: 120, email: 254, phone: 40, website: 200, industry: 80, address: 240, city: 80, state: 80,
                country: 80, timezone: 80 };
            if (value.length > limits[key])
                throw new Error(`${key} is too long`);
            cleaned[key] = value;
        }
        if ("name" in cleaned && cleaned.name.length < 2)
            throw new Error("Company name must be at least 2 characters");
        if (cleaned.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned.email))
            throw new Error("Enter a valid company email address");
        if (cleaned.website && !/^https?:\/\//i.test(cleaned.website))
            throw new Error("Website must start with http:// or https://");
        if (cleaned.timezone) {
            try {
                new Intl.DateTimeFormat("en", { timeZone: cleaned.timezone });
            }
            catch {
                throw new Error("Choose a valid time zone");
            }
        }
        const updated = await CompanyRepository.updateProfile(companyId, cleaned);
        if (!updated)
            throw new Error("Company not found");
        return this.getWorkspace(companyId);
    }
    async updateModules(companyId, requestedModules = []) {
        if (!Array.isArray(requestedModules)) {
            throw new Error("Modules must be an array");
        }
        const invalidModules = requestedModules.filter((id) => !ALL_MODULE_IDS.includes(id));
        if (invalidModules.length) {
            throw new Error(`Unknown modules: ${invalidModules.join(", ")}`);
        }
        await CompanyRepository.updateModules(companyId, [...new Set(requestedModules)]);
        return this.getWorkspace(companyId);
    }
    async updateBranding(companyId, branding = {}) {
        const allowedKeys = [
            "logo",
            "wallpaper",
            "primaryColor",
            "secondaryColor",
            "tagline",
        ];
        const cleanedBranding = {};
        for (const key of allowedKeys) {
            if (branding[key] !== undefined) {
                cleanedBranding[key] = String(branding[key] || "").trim();
            }
        }
        await CompanyRepository.updateBranding(companyId, cleanedBranding);
        return this.getWorkspace(companyId);
    }
    async updateSignature(companyId, signature = {}) {
        const allowed = ["bannerUrl", "previewUrl", "address", "website"];
        const cleaned = {};
        for (const key of allowed) {
            if (signature[key] === undefined)
                continue;
            const value = String(signature[key] ?? "").trim();
            if (value.length > (key === "address" ? 240 : 500))
                throw new Error(`${key} is too long`);
cleaned[key] = key === "address" ? value : validateOptionalUrl(value, key, { allowRelative: key === "previewUrl" });
        }
        if (signature.socials !== undefined) {
            if (!signature.socials || typeof signature.socials !== "object" || Array.isArray(signature.socials))
                throw new Error("Social links must be an object");
            const socials = {};
            for (const key of ["facebook", "x", "instagram", "linkedin"]) {
                if (signature.socials[key] !== undefined)
                    socials[key] = validateOptionalUrl(signature.socials[key], `${key} URL`);
            }
            cleaned.socials = socials;
        }
        const updated = await CompanyRepository.updateSignature(companyId, cleaned);
        if (!updated)
            throw new Error("Company not found");
        return this.getWorkspace(companyId);
    }
}
export default new CompanyService();
