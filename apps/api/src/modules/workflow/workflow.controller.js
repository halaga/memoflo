import WorkflowResolver from "./workflow.resolver.js";

class WorkflowController {
  async resolvePosition(req, res, next) {
    try {
      const result =
        await WorkflowResolver.resolvePosition(
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
}

export default new WorkflowController();