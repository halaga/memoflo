import BusinessServiceService from "./businessService.service.js";

class BusinessServiceController {
  async create(req, res, next) {
    try {
      const businessService =
        await BusinessServiceService.createBusinessService(
          req.user.company,
          req.body
        );

      res.status(201).json({
        success: true,
        data: businessService,
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req, res, next) {
    try {
      const businessServices =
        await BusinessServiceService.listBusinessServices(
          req.user.company
        );

      res.json({
        success: true,
        data: businessServices,
      });
    } catch (err) {
      next(err);
    }
  }

  async show(req, res, next) {
    try {
      const businessService =
        await BusinessServiceService.getBusinessService(
          req.user.company,
          req.params.id
        );

      res.json({
        success: true,
        data: businessService,
      });
    } catch (err) {
      next(err);
    }
  }

  async showBySlug(req, res, next) {
    try {
      const businessService =
        await BusinessServiceService.getBusinessServiceBySlug(
          req.user.company,
          req.params.slug
        );

      res.json({
        success: true,
        data: businessService,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const businessService =
        await BusinessServiceService.updateBusinessService(
          req.user.company,
          req.params.id,
          req.body
        );

      res.json({
        success: true,
        data: businessService,
      });
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      const businessService =
        await BusinessServiceService.deleteBusinessService(
          req.user.company,
          req.params.id
        );

      res.json({
        success: true,
        data: businessService,
      });
    } catch (err) {
      next(err);
    }
  }

  async assignWorkflow(req, res, next) {
    try {
      const businessService =
        await BusinessServiceService.assignWorkflow(
          req.user.company,
          req.params.id,
          req.body.workflowId
        );

      res.json({
        success: true,
        data: businessService,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new BusinessServiceController();