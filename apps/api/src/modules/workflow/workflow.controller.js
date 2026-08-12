import WorkflowService from "./workflow.service.js";
import WorkflowEngine from "./workflow.engine.js";

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
      const result =
        await WorkflowService.getWorkflow(
          req.user.company,
          req.params.id
        );

      res.json({
        success: true,
        data: result,
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
      const workflow =
        await WorkflowService.deleteWorkflow(
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

  async resolvePosition(
    req,
    res,
    next
  ) {
    try {
      const result =
        await WorkflowService.resolvePosition(
          req.params.positionId,
          req.user.company
        );

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async start(req, res, next) {
    try {
      const {
        resourceType,
        resourceId,
      } = req.body;

      const instance =
        await WorkflowEngine.start(
          req.user.company,
          req.params.id,
          resourceType,
          resourceId,
          req.user._id
        );

      res.status(201).json({
        success: true,
        data: instance,
      });
    } catch (err) {
      next(err);
    }
  }

  async instance(req, res, next) {
    try {
      const instance =
        await WorkflowService.getWorkflowInstance(
          req.user.company,
          req.params.instanceId
        );

      res.json({
        success: true,
        data: instance,
      });
    } catch (err) {
      next(err);
    }
  }

  async currentStep(req, res, next) {
    try {
      const result =
        await WorkflowService.resolveCurrentStep(
          req.user.company,
          req.params.instanceId
        );

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async advance(req, res, next) {
    try {
      const instance =
        await WorkflowEngine.advance(
          req.user.company,
          req.params.instanceId,
          req.user._id
        );

      res.json({
        success: true,
        data: instance,
      });
    } catch (err) {
      next(err);
    }
  }

  async reject(req, res, next) {
    try {
      const instance =
        await WorkflowEngine.reject(
          req.user.company,
          req.params.instanceId,
          req.user._id
        );

      res.json({
        success: true,
        data: instance,
      });
    } catch (err) {
      next(err);
    }
  }

  async cancel(req, res, next) {
    try {
      const instance =
        await WorkflowEngine.cancel(
          req.user.company,
          req.params.instanceId,
          req.user._id
        );

      res.json({
        success: true,
        data: instance,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new WorkflowController();