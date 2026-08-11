import WorkflowService from "./workflow.service.js";

class WorkflowController {
  async create(req, res, next) {
    try {
      const workflow =
        await WorkflowService.createWorkflow(
          req.user.company,
          req.body
        );

      res.status(201).json({
        success: true,
        data: workflow,
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req, res, next) {
    try {
      const workflows =
        await WorkflowService.listWorkflows(
          req.user.company
        );

      res.json({
        success: true,
        data: workflows,
      });
    } catch (err) {
      next(err);
    }
  }

  async show(req, res, next) {
    try {
      const workflow =
        await WorkflowService.getWorkflow(
          req.user.company,
          req.params.id
        );

      res.json({
        success: true,
        data: workflow,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const workflow =
        await WorkflowService.updateWorkflow(
          req.user.company,
          req.params.id,
          req.body
        );

      res.json({
        success: true,
        data: workflow,
      });
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      await WorkflowService.deleteWorkflow(
        req.user.company,
        req.params.id
      );

      res.json({
        success: true,
        message: "Workflow deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  }

  async addStep(req, res, next) {
    try {
      const step =
        await WorkflowService.addStep(
          req.user.company,
          req.params.id,
          req.body
        );

      res.status(201).json({
        success: true,
        data: step,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new WorkflowController();