import BusinessService from "../business-service/businessService.model.js";
import Employee from "../employee/employee.model.js";
import NotificationService from "../notification/notification.service.js";
import MemoEventService from "../memo-event/memoEvent.service.js";
import MemoRepository from "./memo.repository.js";
import { validateCreateMemo } from "./memo.validator.js";

function serviceError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

class MemoService {
  async generateReferenceNo() {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `MEM-${year}-${random}`;
  }

  async createMemo(payload) {
    validateCreateMemo(payload);

    const memoType = payload.memoType || "simple";
    const isSimple = memoType === "simple";
    let businessService = null;

    if (!isSimple) {
      businessService = await BusinessService.findOne({
        _id: payload.businessService,
        company: payload.company,
        active: true,
        isActive: true,
        deletedAt: null,
      }).lean();
      if (!businessService) throw serviceError("Business service not found.", 404);
    }

    const requestedRecipients = Array.isArray(payload.recipients)
      ? payload.recipients
      : payload.recipient
        ? [payload.recipient]
        : [];
    const recipientIds = [...new Set(requestedRecipients.map(String))];
    let recipients = [];

    if (isSimple) {
      if (!recipientIds.length) throw serviceError("Select at least one recipient.");
      recipients = await Employee.find({
        _id: { $in: recipientIds },
        company: payload.company,
        active: true,
        isActive: true,
        employmentStatus: "Active",
        deletedAt: null,
      }).select("_id firstName lastName");
      if (recipients.length !== recipientIds.length) {
        throw serviceError("One or more recipients do not belong to this company.");
      }
    }

    const memo = await MemoRepository.create({
      ...payload,
      memoType,
      businessService: isSimple ? null : payload.businessService,
      recipient: isSimple ? recipients[0]?._id || null : null,
      recipients: isSimple ? recipients.map((recipient) => recipient._id) : [],
      referenceNo: await this.generateReferenceNo(),
      workflow: isSimple ? null : (payload.workflow || businessService?.workflow || null),
      status: isSimple ? "Completed" : "Draft",
      currentStep: 0,
    });

    await MemoEventService.record({
      company: payload.company,
      memo: memo._id,
      actor: payload.createdBy,
      type: "memo.created",
      title: "Memo created",
      description: `Memo ${memo.referenceNo} was created.`,
      toStatus: memo.status,
      metadata: { referenceNo: memo.referenceNo, memoType, recipientCount: recipients.length },
    });

    if (isSimple) {
      await Promise.all(recipients.map((recipient) => NotificationService.create({
        company: payload.company,
        recipient: recipient._id,
        type: "memo",
        title: `New memo: ${memo.title}`,
        message: `You received ${memo.referenceNo} from your colleague.`,
        link: `/memos/${memo._id}`,
        data: { resourceType: "memo", resourceId: String(memo._id) },
        createdBy: payload.createdBy,
      })));
      await MemoEventService.record({
        company: payload.company,
        memo: memo._id,
        actor: payload.createdBy,
        type: "memo.delivered",
        title: "Memo delivered",
        description: `Memo ${memo.referenceNo} was delivered to ${recipients.length} recipient(s).`,
        toStatus: "Completed",
        metadata: { recipients: recipients.map((recipient) => String(recipient._id)) },
      });
    }

    return memo;
  }

  async listMemos(companyId) {
    return MemoRepository.findAll(companyId);
  }

  async getMemo(id, companyId) {
    const memo = await MemoRepository.findById(id, companyId);
    if (!memo) throw serviceError("Memo not found.", 404);
    return memo;
  }

  async updateMemo(id, companyId, payload, actorId) {
    const existing = await MemoRepository.findById(id, companyId);
    if (!existing) throw serviceError("Memo not found.", 404);

    const allowed = ["title", "body", "category", "priority", "beneficiarySBU"];
    const updates = Object.fromEntries(Object.entries(payload).filter(([key]) => allowed.includes(key)));
    const memo = await MemoRepository.update(id, companyId, updates);
    const changedFields = Object.keys(updates).filter(
      (field) => String(existing[field] ?? "") !== String(memo[field] ?? "")
    );

    if (changedFields.length) {
      await MemoEventService.record({
        company: companyId,
        memo: memo._id,
        actor: actorId,
        type: "memo.updated",
        title: "Memo updated",
        description: `Memo ${memo.referenceNo} was updated.`,
        metadata: { referenceNo: memo.referenceNo, changedFields },
      });
    }
    return memo;
  }
}

export default new MemoService();
