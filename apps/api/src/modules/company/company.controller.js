import CompanyService from "./company.service.js";
class CompanyController {
  async public(req, res, next) { try { res.json({ success: true, data: await CompanyService.getPublicBySlug(req.params.slug) }); } catch (error) { next(error); } }
  async workspace(req, res, next) { try { res.json({ success: true, data: await CompanyService.getWorkspace(req.user.company) }); } catch (error) { next(error); } }
  async updateModules(req, res, next) { try { res.json({ success: true, data: await CompanyService.updateModules(req.user.company, req.body.modules) }); } catch (error) { next(error); } }
  async updateBranding(req, res, next) { try { res.json({ success: true, data: await CompanyService.updateBranding(req.user.company, req.body.branding) }); } catch (error) { next(error); } }
}
export default new CompanyController();
