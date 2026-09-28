import AuditLog from "./audit.model.js";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function cleanMetadata(metadata = {}) {
  const blockedKeys = new Set([
    "password",
    "currentPassword",
    "newPassword",
    "token",
    "accessToken",
    "refreshToken",
    "authorization",
  ]);

  return Object.fromEntries(
    Object.entries(metadata).filter(([key]) => !blockedKeys.has(key))
  );
}

function inferResourceType(path = "") {
  const segments = path.split("/").filter(Boolean);
  const apiIndex = segments.indexOf("api");
  const resource = segments[apiIndex + 1] || "system";

  return resource
    .replace(/s$/, "")
    .replace(/[-_](.)/g, (_, char) => char.toUpperCase());
}

function inferModule(resourceType) {
  const value = String(resourceType || "system");
  if (value.startsWith("memo")) return "Memo Management";
  if (value.startsWith("leave")) return "Leave Management";
  if (value.startsWith("employee") || value.startsWith("position") || value.startsWith("department") || value.startsWith("designation") || value.startsWith("sbu")) return "People & Organization";
  if (value.startsWith("workflow")) return "Workflow";
  if (value.startsWith("notification")) return "Notifications";
  if (value.startsWith("company")) return "Company Administration";
  return "MemoFlo Platform";
}

function safeFields(body = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return [];
  const blocked = new Set(["password", "currentPassword", "newPassword", "token", "accessToken", "refreshToken", "authorization"]);
  return Object.keys(body).filter((key) => !blocked.has(key)).slice(0, 30);
}

function inferAction(method, path) {
  const actionByMethod = {
    POST: "create",
    PUT: "update",
    PATCH: "update",
    DELETE: "delete",
  };

  const resource = inferResourceType(path);
  return `${resource}.${actionByMethod[method] || method.toLowerCase()}`;
}

class AuditService {
  async record(event) {
    if (!event.company) {
      return null;
    }

    return AuditLog.create({
      ...event,
      metadata: cleanMetadata(event.metadata),
    });
  }

  async recordRequest(req, res) {
    if (!req.user?.company || !MUTATING_METHODS.has(req.method)) {
      return;
    }

    const statusCode = res.statusCode;

    try {
      await this.record({
        company: req.user.company,
        actor: req.user.id || null,
        action: inferAction(req.method, req.originalUrl),
        resourceType: inferResourceType(req.originalUrl),
        module: inferModule(inferResourceType(req.originalUrl)),
        summary: `${req.method} ${req.originalUrl.split("?")[0]}`,
        resourceId: req.params?.id || null,
        method: req.method,
        path: req.route?.path || req.originalUrl.split("?")[0],
        outcome: statusCode >= 400 ? "failure" : "success",
        statusCode,
        ipAddress: req.ip || null,
        userAgent: req.get("user-agent") || null,
        requestId: req.requestId || null,
        metadata: {
          fields: safeFields(req.body),
          queryKeys: Object.keys(req.query || {}).slice(0, 20),
        },
      });
    } catch (error) {
      console.error("Audit log write failed:", error.message);
    }
  }

  async list(companyId, filters = {}) {
    const {
      page = 1,
      limit = 50,
      actor,
      action,
      resourceType,
      outcome,
      search,
      from,
      to,
    } = filters;

    const query = { company: companyId };

    if (actor) query.actor = actor;
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;
    if (outcome) query.outcome = outcome;

    if (search) {
      query.$or = [
        { action: { $regex: search, $options: "i" } },
        { resourceType: { $regex: search, $options: "i" } },
        { resourceId: { $regex: search, $options: "i" } },
        { path: { $regex: search, $options: "i" } },
      ];
    }

    if (from || to) {
      query.occurredAt = {};
      if (from) query.occurredAt.$gte = new Date(from);
      if (to) query.occurredAt.$lte = new Date(to);
    }

    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
      AuditLog.find(query)
        .populate("actor", "_id firstName lastName email")
        .sort({ occurredAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return {
      items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit),
      },
    };
  }
}

export { MUTATING_METHODS };
export default new AuditService();
