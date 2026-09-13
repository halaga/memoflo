import AuthRepository from "./auth.repository.js";
import { comparePassword } from "./password.js";
import { generateToken } from "./jwt.js";

class AuthService {
  async login(email, password) {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const employee = await AuthRepository.findByEmail(email);

    if (!employee || !employee.active || employee.employmentStatus !== "Active") {
      throw new Error("Invalid credentials");
    }

    const valid = await comparePassword(password, employee.password);
    if (!valid) throw new Error("Invalid credentials");

    await AuthRepository.updateLastLogin(employee._id);

    const token = generateToken({
      id: employee._id,
      company: employee.company?._id,
      role: employee.role?._id,
    });

    const employeeObject = employee.toObject();
    delete employeeObject.password;

    return { success: true, token, employee: employeeObject };
  }

  async me(id) {
    return await AuthRepository.findById(id);
  }
}

export default new AuthService();