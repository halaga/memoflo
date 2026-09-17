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

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      const employee = await AuthService.me(req.user.id);

      res.json({
        success: true,
        employee,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
