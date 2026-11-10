import Employee from "../employee/employee.model.js";
import Company from "../company/company.model.js";

class AuthRepository {
  async findByEmail(email, companySlug = null) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const query = {
      email: normalizedEmail,
      active: true,
      isActive: true,
      loginEnabled: true,
      employmentStatus: "Active",
      deletedAt: null,
    };

    if (companySlug) {
      const company = await Company.findOne({
        slug: String(companySlug).trim().toLowerCase(),
        isActive: true,
        deletedAt: null,
      }).select("_id").lean();
      if (!company) return null;
      query.company = company._id;
    }

    // A bare platform/local login must never choose an arbitrary tenant when
    // the same email exists in more than one company.
    const matches = await Employee.find(query)
      .select("+password")
      .populate({ path: "company", match: { isActive: true, deletedAt: null } })
      .populate("role")
      .populate("position")
      .limit(2);

    const validMatches = matches.filter((employee) => employee.company);
    if (validMatches.length !== 1) return null;
    return validMatches[0];
  }

  async updateLastLogin(id, companyId) {
    return Employee.findOneAndUpdate(
      { _id: id, company: companyId, active: true, isActive: true, deletedAt: null },
      { lastLogin: new Date() },
      { new: true }
    );
  }

  async findById(id, companyId) {
    if (!companyId) return null;
    return Employee.findOne({
      _id: id,
      company: companyId,
      active: true,
      isActive: true,
      loginEnabled: true,
      employmentStatus: "Active",
      deletedAt: null,
    })
      .populate("company")
      .populate("role")
      .populate("position")
      .select("-password");
  }
}

export default new AuthRepository();
