import AuthService from "./auth.service.js";

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password, companySlug } = req.body;

      const result = await AuthService.login(
        email,
        password,
        companySlug
      );

      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }

  async me(req, res, next) {
    try {
      const employee = await AuthService.me(
        req.user.id,
        req.user.company
      );

      return res.json({
        success: true,
        employee,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default new AuthController();
