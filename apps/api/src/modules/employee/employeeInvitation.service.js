import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import Company from "../company/company.model.js";
import Employee from "./employee.model.js";
import Position from "../position/position.model.js";
import EmployeeService from "./employee.service.js";
import EmployeeInvitation from "./employeeInvitation.model.js";

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
function publicInvitation(invitation, employee, company) {
  return {
    email: invitation.email,
    firstName: employee.firstName,
    lastName: employee.lastName,
    companyName: company?.name || "your company",
    expiresAt: invitation.expiresAt,
  };
}

class EmployeeInvitationService {
  async create(companyId, invitedBy, payload) {
    const email = String(payload.email || "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fail("Enter a valid employee email.");
    const existing = await Employee.findOne({ email }).select("_id");
    if (existing) throw fail("An employee account already uses this email.", 409);

    const employeeResult = await EmployeeService.createEmployee(companyId, {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email,
      phone: payload.phone || "",
      role: payload.role || null,
      position: payload.position || null,
      reportsTo: payload.reportsTo || null,
      createLogin: false,
    });
    const employee = employeeResult.employee;
    const rawToken = crypto.randomBytes(32).toString("hex");
    try {
      const invitation = await EmployeeInvitation.create({
        company: companyId,
        employee: employee._id,
        email,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
        invitedBy,
      });
      const company = await Company.findById(companyId).select("name slug").lean();
      const origin = String(payload.origin || "").replace(/\/$/, "");
      const invitationUrl = `${origin}/accept-invitation?token=${rawToken}`;
      return {
        employee,
        invitation: publicInvitation(invitation, employee, company),
        invitationUrl,
      };
    } catch (error) {
      if (employee.position) {
        await Position.updateOne(
          { _id: employee.position, company: companyId, occupant: employee._id },
          { $set: { occupant: null } }
        ).catch(() => {});
      }
      await Employee.deleteOne({ _id: employee._id, company: companyId });
      throw error;
    }
  }

  async inspect(token) {
    if (!/^[a-f0-9]{64}$/i.test(String(token || ""))) throw fail("This invitation link is invalid.", 404);
    const invitation = await EmployeeInvitation.findOne({
      tokenHash: hashToken(token),
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }).select("+tokenHash").lean();
    if (!invitation) throw fail("This invitation has expired, been used, or is no longer valid.", 410);
    const [employee, company] = await Promise.all([
      Employee.findOne({ _id: invitation.employee, company: invitation.company, active: true, deletedAt: null }).select("firstName lastName email loginEnabled").lean(),
      Company.findById(invitation.company).select("name slug").lean(),
    ]);
    if (!employee || employee.loginEnabled) throw fail("This employee invitation is no longer active.", 410);
    return publicInvitation(invitation, employee, company);
  }

  async accept(token, password, confirmation) {
    if (!/^[a-f0-9]{64}$/i.test(String(token || ""))) throw fail("This invitation link is invalid.", 404);
    if (typeof password !== "string" || password.length < 10 || password.length > 128) {
      throw fail("Choose a password between 10 and 128 characters.");
    }
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      throw fail("Use at least one uppercase letter, one lowercase letter, one number and one special character.");
    }
    if (password !== confirmation) throw fail("The password confirmation does not match.");
    const tokenHash = hashToken(token);
    const invitation = await EmployeeInvitation.findOne({
      tokenHash,
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }).select("+tokenHash");
    if (!invitation) throw fail("This invitation has expired, been used, or is no longer valid.", 410);

    const employee = await Employee.findOne({
      _id: invitation.employee,
      company: invitation.company,
      email: invitation.email,
      active: true,
      deletedAt: null,
      loginEnabled: false,
    });
    if (!employee) throw fail("The invited employee account is unavailable.", 410);

    // Claim the invitation before enabling the account so a token cannot be reused.
    const claimed = await EmployeeInvitation.updateOne(
      { _id: invitation._id, acceptedAt: null, revokedAt: null, expiresAt: { $gt: new Date() } },
      { $set: { acceptedAt: new Date() } }
    );
    if (claimed.modifiedCount !== 1) throw fail("This invitation has already been used.", 409);

    try {
      employee.password = await bcrypt.hash(password, 12);
      employee.loginEnabled = true;
      await employee.save();
      return { success: true, email: employee.email };
    } catch (error) {
      await EmployeeInvitation.updateOne(
        { _id: invitation._id, acceptedAt: { $ne: null } },
        { $set: { acceptedAt: null } }
      ).catch(() => {});
      throw error;
    }
  }
}

export default new EmployeeInvitationService();
