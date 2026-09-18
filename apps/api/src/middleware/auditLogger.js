import AuditService from "../modules/audit/audit.service.js";

export default function auditLogger(req, res, next) {
  res.on("finish", () => {
    AuditService.recordRequest(req, res).catch((error) => {
      console.error("Audit logger failed:", error.message);
    });
  });

  next();
}
