import AuthRepository from "./auth.repository.js";
import { generateToken } from "./jwt.js";
import { comparePassword } from "./password.js";

function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

class AuthService {
  async login(email, password, companySlug = null) {
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!normalizedEmail || !password) {
      throw createError("Email and password are required.", 400);
    }

    const employee = await AuthRepository.findByEmail(
      normalizedEmail,
      companySlug
    );

    if (!employee) {
      throw createError("Invalid credentials", 401);
    }

    const validPassword = await comparePassword(
      password,
      employee.password
    );

    if (!validPassword) {
      throw createError("Invalid credentials", 401);
    }

    if (
      !employee.active ||
      employee.loginEnabled === false ||
      employee.employmentStatus !== "Active"
    ) {
      throw createError("This employee account is inactive", 403);
    }

    await AuthRepository.updateLastLogin(employee._id);

    const token = generateToken({
      id: employee._id,
      company: employee.company?._id,
      role: employee.role?._id,
    });

    const employeeObject = employee.toObject();
    delete employeeObject.password;

    return {
      success: true,
      token,
      employee: employeeObject,
    };
  }

  async me(id, companyId = null) {
    const employee = await AuthRepository.findById(id);

    if (!employee) {
      throw createError("Session is no longer valid", 401);
    }

    if (
      companyId &&
      employee.company?._id?.toString() !== companyId.toString()
    ) {
      throw createError("Session is no longer valid", 401);
    }

    if (
      !employee.active ||
      employee.loginEnabled === false ||
      employee.employmentStatus !== "Active"
    ) {
      throw createError("This employee account is inactive", 403);
    }

    return employee;
  }
}

export default new AuthService();
