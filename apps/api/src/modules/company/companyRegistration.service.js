import bcrypt from "bcryptjs";
import crypto from "crypto";

import Company from "./company.model.js";
import Employee from "../employee/employee.model.js";
import Role from "../auth/role.model.js";
import { seedRoles } from "../auth/role.seed.js";
import { generateToken } from "../auth/jwt.js";

const DEFAULT_MODULES = [
  "hr",
  "it",
  "workplace",
  "communication",
  "memos",
  "leave",
  "procurement",
];

function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36);
}

function clean(value, max = 120) {
  return String(value || "").trim().slice(0, max);
}

function validatePayload(payload = {}) {
  const companyName = clean(payload.companyName, 120);
  const firstName = clean(payload.firstName, 80);
  const lastName = clean(payload.lastName, 80);
  const email = clean(payload.email, 254).toLowerCase();
  const password = String(payload.password || "");

  if (companyName.length < 2) throw createError("Company name must be at least 2 characters.");
  if (!firstName || !lastName) throw createError("Administrator first and last names are required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw createError("Enter a valid work email address.");
  if (password.length < 10 || password.length > 128) throw createError("Password must be between 10 and 128 characters.");

  return {
    companyName,
    firstName,
    lastName,
    email,
    password,
    phone: clean(payload.phone, 40),
    industry: clean(payload.industry, 80),
    website: clean(payload.website, 200),
  };
}

class CompanyRegistrationService {
  async register(payload) {
    const data = validatePayload(payload);

    const existingEmployee = await Employee.findOne({ email: data.email }).select("_id").lean();
    if (existingEmployee) throw createError("An account with this email already exists.", 409);

    const baseSlug = slugify(data.companyName);
    if (!baseSlug) throw createError("Please provide a company name containing letters or numbers.");

    // A random suffix avoids leaking whether a company name has already been claimed
    // and prevents concurrent signups from racing on the same slug/code.
    let company;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const suffix = crypto.randomBytes(3).toString("hex");
      const slug = `${baseSlug}-${suffix}`;
      const code = `MF-${suffix.toUpperCase()}`;
      try {
        company = await Company.create({
          name: data.companyName,
          code,
          slug,
          email: data.email,
          phone: data.phone,
          industry: data.industry,
          website: data.website,
          country: "Nigeria",
          timezone: "Africa/Lagos",
          settings: {
            modules: DEFAULT_MODULES,
            branding: {
              primaryColor: "#2563EB",
              secondaryColor: "#1E293B",
              tagline: "Workflow, simplified.",
            },
          },
        });
        break;
      } catch (error) {
        if (error?.code === 11000 && attempt < 4) continue;
        throw error;
      }
    }

    if (!company) throw createError("Unable to create the company workspace. Please try again.", 500);

    try {
      // Reuse the existing permission catalogue and role definitions so onboarding
      // does not create a parallel or divergent authorization system.
      await seedRoles(company);
      const adminRole = await Role.findOne({
        company: company._id,
        code: "COMPANY_ADMIN",
        isActive: true,
        deletedAt: null,
      });
      if (!adminRole) throw createError("Company administrator role could not be initialized.", 500);

      const passwordHash = await bcrypt.hash(data.password, 12);
      const employeeNo = `MFADMIN-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
      const employee = await Employee.create({
        company: company._id,
        employeeNo,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: passwordHash,
        loginEnabled: true,
        active: true,
        employmentStatus: "Active",
        role: adminRole._id,
      });

      const hydratedEmployee = await Employee.findById(employee._id)
        .populate("company")
        .populate("role")
        .populate("position")
        .select("-password");

      const token = generateToken({
        id: employee._id,
        company: company._id,
        role: adminRole._id,
      });

      return {
        success: true,
        token,
        employee: hydratedEmployee,
        company: {
          id: company._id,
          name: company.name,
          code: company.code,
          slug: company.slug,
        },
      };
    } catch (error) {
      // Mongo transactions are not guaranteed on local standalone MongoDB. Compensate
      // for partial onboarding by removing tenant-owned records if a later step fails.
      await Employee.deleteMany({ company: company._id }).catch(() => {});
      await Role.deleteMany({ company: company._id }).catch(() => {});
      await Company.deleteOne({ _id: company._id }).catch(() => {});
      throw error;
    }
  }
}

export default new CompanyRegistrationService();
