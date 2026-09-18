import AuditService from "./audit.service.js";

export async function listAuditLogs(req, res, next) {
  try {
    const result = await AuditService.list(req.user.company, req.query);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
