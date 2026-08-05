import AuthRepository from "./auth.repository.js";
import { comparePassword } from "./password.js";
import { generateToken } from "./jwt.js";

class AuthService {
  async login(email, password) {
    console.log("========== LOGIN ==========");
    console.log("Email:", email);
    console.log("Password Received:", password);

    const employee = await AuthRepository.findByEmail(email);

    console.log("Employee Found:", !!employee);

    if (!employee) {
      throw new Error("Invalid credentials");
    }

    console.log("Stored Hash:", employee.password);

    const valid = await comparePassword(
      password,
      employee.password
    );

    console.log("Password Match:", valid);

    if (!valid) {
      throw new Error("Invalid credentials");
    }

    await AuthRepository.updateLastLogin(employee._id);

    const token = generateToken({
      id: employee._id,
      company: employee.company?._id,
      role: employee.role?._id,
    });

    return {
      success: true,
      token,
      employee,
    };
  }
}

export default new AuthService();