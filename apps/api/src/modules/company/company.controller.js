import CompanyService from "./company.service.js";

class CompanyController {
  async workspace(req, res, next) {
    try { res.json({ success: true, data: await CompanyService.getWorkspace(req.user.company) }); }
    catch (error) { next(error); }
  }

  async updateModules(req, res, next) {
    try { res.json({ success: true, data: await CompanyService.updateModules(req.user.company, req.body.modules) }); }
    catch (error) { next(error); }
  }
}

export default new CompanyController();
