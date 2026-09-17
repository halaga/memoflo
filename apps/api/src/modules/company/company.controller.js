import CompanyService from "./company.service.js";

class CompanyController {
  async public(req, res, next) {
    try {
      const company = await CompanyService.getPublicBySlug(
        req.params.slug
      );

      res.json({
        success: true,
        data: company,
      });
    } catch (error) {
      next(error);
    }
  }

  async workspace(req, res, next) {
    try {
      const workspace = await CompanyService.getWorkspace(
        req.user.company
      );

      res.json({
        success: true,
        data: workspace,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateModules(req, res, next) {
    try {
      const workspace = await CompanyService.updateModules(
        req.user.company,
        req.body.modules
      );

      res.json({
        success: true,
        data: workspace,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateBranding(req, res, next) {
    try {
      const workspace = await CompanyService.updateBranding(
        req.user.company,
        req.body.branding
      );

      res.json({
        success: true,
        data: workspace,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CompanyController();
