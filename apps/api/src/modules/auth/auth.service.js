import AuthRepository from "./auth.repository.js";
import { comparePassword } from "./password.js";
import { generateToken } from "./jwt.js";

class AuthService {
  async login(email, password, companySlug = null) {
    const employee = await AuthRepository.findByEmail(
      email,
      companySlug
    );

    if (!employee) {
      throw new Error("Invalid credentials");
    }

    const valid = await comparePassword(
      password,
      employee.password
    );

    if (!valid) {
      throw new Error("Invalid credentials");
    }

    if (
      !employee.active ||
      employee.employmentStatus !== "Active"
    ) {
      throw new Error("This employee account is inactive");
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

  async me(id) {
    const employee = await AuthRepository.findById(id);

    if (!employee) {
      throw new Error("Employee not found");
    }

    if (
      !employee.active ||
      employee.employmentStatus !== "Active"
    ) {
      throw new Error("This employee account is inactive");
    }

    return employee;
  }
}

export default new AuthService();
