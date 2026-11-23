import BusinessService from "../business-service/businessService.model.js";
import Employee from "../employee/employee.model.js";
import NotificationService from "../notification/notification.service.js";
import MemoEventService from "../memo-event/memoEvent.service.js";
import WorkflowEngine from "../workflow/workflow.engine.js";
import Workflow from "../workflow/workflow.model.js";
import WorkflowStep from "../workflow/workflowStep.model.js";
import MemoRepository from "./memo.repository.js";
import Memo from "./memo.model.js";
import { normalizeMemoType, validateCreateMemo } from "./memo.validator.js";

function serviceError(message, status = 400) {
    const error = new Error(message);
    error.status = status;
    return error;
}

class MemoService {
    async generateReferenceNo(companyId) {
        const year = new Date().getFullYear();
        const random = Math.floor(100000 + Math.random() * 900000);
        return `MEM-${year}-${random}`;
    }

    async resolvePeople(ids, companyId, label) {
        const uniqueIds = [...new Set((ids || []).filter(Boolean).map(String))];
        if (!uniqueIds.length) return [];
        const people = await Employee.find({
            _id: { $in: uniqueIds },
            company: companyId,
            active: true,
            isActive: true,
            employmentStatus: "Active",
            deletedAt: null,
        }).select("_id firstName lastName");
        if (people.length !== uniqueIds.length) {
            throw serviceError(`One or more ${label} do not belong to this company or are inactive.`);
        }
        return people;
    }

    validateServiceFields(service, values = {}) {
        const fields = Array.isArray(service.formSchema) ? service.formSchema : [];
        for (const field of fields) {
            if (!field.required) continue;
            const value = values[field.key];
            const missing = value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0) || (typeof value === "string" && !value.trim());
            if (missing) throw serviceError(`${field.label} is required.`);
        }
    }

    async createMemo(payload) {
        const memoType = normalizeMemoType(payload.memoType);
        const saveAsDraft = Boolean(payload.saveAsDraft);
        const normalizedPayload = { ...payload, memoType };
        validateCreateMemo({ ...normalizedPayload, saveAsDraft });

        const isBasic = memoType === "simple";
        let businessService = null;
        let workflowId = null;

        if (!isBasic && payload.businessService) {
            businessService = await BusinessService.findOne({
                _id: payload.businessService,
                company: payload.company,
                active: true,
                isActive: true,
                deletedAt: null,
            }).lean();
            if (!businessService) throw serviceError("Business Service not found.", 404);

            const allowedTypes = businessService.allowedRequisitionTypes || businessService.requisitionTypes || [];
            if (allowedTypes.length && !allowedTypes.includes(payload.requisitionType)) {
                throw serviceError("The selected Requisition Type is not available for this Business Service.");
            }
            if (!saveAsDraft) {
                this.validateServiceFields(businessService, payload.submissionDetails?.serviceFields || {});
                if (businessService.financialRequired && !payload.financialDetails?.required) {
                    throw serviceError("This Business Service requires financial information.");
                }
                if (businessService.financialRequired && (payload.financialDetails?.estimatedAmount === undefined ||
                    payload.financialDetails?.estimatedAmount === null || payload.financialDetails?.estimatedAmount === "")) {
                    throw serviceError("Enter the estimated amount required by this Business Service.");
                }
            }
            workflowId = businessService.requisitionWorkflowMap?.[payload.requisitionType] || businessService.workflow?._id || businessService.workflow || null;
            if (!saveAsDraft && !workflowId) {
                throw serviceError("This Business Service has no active workflow configured. Save as draft or contact your administrator.");
            }
            if (workflowId && !saveAsDraft) {
                const workflow = await Workflow.findOne({
                    _id: workflowId,
                    company: payload.company,
                    active: true,
                    isActive: true,
                }).lean();
                if (!workflow) throw serviceError("The configured workflow is unavailable or inactive.");
                const firstStep = await WorkflowStep.findOne({
                    company: payload.company,
                    workflow: workflowId,
                    isActive: true,
                }).sort({ order: 1 }).lean();
                if (!firstStep) throw serviceError("The configured workflow has no active approval stages.");
            }
        }

        let requestingSbu = payload.requestingSbu || null;
        let beneficiarySBU = payload.beneficiarySBU || payload.beneficiarySbu || null;
        if (!isBasic && (!requestingSbu || !beneficiarySBU)) {
            const requester = await Employee.findOne({
                _id: payload.createdBy,
                company: payload.company,
                active: true,
                isActive: true,
                deletedAt: null,
            }).populate({ path: "position", select: "sbu" }).select("position").lean();
            const profileSbu = requester?.position?.sbu || null;
            requestingSbu = requestingSbu || profileSbu;
            beneficiarySBU = beneficiarySBU || requestingSbu;
        }

        const recipients = isBasic
            ? await this.resolvePeople(payload.recipients || [], payload.company, "recipients")
            : [];
        const ccRecipients = await this.resolvePeople(payload.ccRecipients || [], payload.company, "CC recipients");

        const memo = await MemoRepository.create({
            ...payload,
            requestingSbu,
            beneficiarySBU,
            memoType,
            submissionType: "",
            requisitionType: isBasic ? "" : String(payload.requisitionType || "").trim(),
            submissionDetails: isBasic ? {} : (payload.submissionDetails || {}),
            businessJustification: isBasic ? "" : String(payload.businessJustification || "").trim(),
            requiredCompletionDate: isBasic ? null : (payload.requiredCompletionDate || null),
            financialDetails: isBasic ? {} : (payload.financialDetails || {}),
            ccRecipients: ccRecipients.map((person) => person._id),
            acknowledgementRequired: isBasic ? Boolean(payload.acknowledgementRequired) : false,
            businessService: isBasic ? null : payload.businessService,
            recipient: isBasic ? recipients[0]?._id || null : null,
            recipients: recipients.map((person) => person._id),
            referenceNo: await this.generateReferenceNo(payload.company),
            workflow: isBasic ? null : workflowId,
            status: saveAsDraft ? "Draft" : (isBasic ? "Draft" : "Draft"),
            currentStep: 0,
        });

        await MemoEventService.record({
            company: payload.company,
            memo: memo._id,
            actor: payload.createdBy,
            type: "memo.created",
            title: saveAsDraft ? "Memo draft saved" : "Memo created",
            description: `Memo ${memo.referenceNo} was created.`,
            toStatus: "Draft",
            metadata: { referenceNo: memo.referenceNo, memoType, recipientCount: recipients.length },
        });

        if (!saveAsDraft) {
            return this.submitMemo(memo._id, payload.company, payload.createdBy);
        }
        return memo;
    }

    async submitMemo(id, companyId, actorId) {
        const memo = await Memo.findOne({
            _id: id,
            company: companyId,
            isActive: true,
            deletedAt: null,
        });
        if (!memo) throw serviceError("Memo not found.", 404);
        if (memo.status !== "Draft") {
            if (memo.workflowInstance) return MemoRepository.findById(id, companyId);
            throw serviceError("This memo has already been submitted.");
        }

        if (memo.memoType === "simple" || memo.memoType === "request") {
            const recipients = await this.resolvePeople(memo.recipients, companyId, "recipients");
            if (!recipients.length) throw serviceError("Select at least one recipient before submitting.");
            memo.status = "Completed";
            await memo.save();
            const ccRecipients = await this.resolvePeople(memo.ccRecipients, companyId, "CC recipients");
            await Promise.all([
                ...recipients.map((recipient) => NotificationService.create({
                    company: companyId,
                    recipient: recipient._id,
                    type: "memo",
                    title: `New memo: ${memo.title}`,
                    message: `You received ${memo.referenceNo} from your colleague.`,
                    link: `/memos/${memo._id}`,
                    data: { resourceType: "memo", resourceId: String(memo._id), deliveryType: "to" },
                    createdBy: actorId,
                })),
                ...ccRecipients.map((recipient) => NotificationService.create({
                    company: companyId,
                    recipient: recipient._id,
                    type: "memo",
                    title: `Copied on memo: ${memo.title}`,
                    message: `You were copied on ${memo.referenceNo}.`,
                    link: `/memos/${memo._id}`,
                    data: { resourceType: "memo", resourceId: String(memo._id), deliveryType: "cc" },
                    createdBy: actorId,
                })),
            ]);
            await MemoEventService.record({
                company: companyId,
                memo: memo._id,
                actor: actorId,
                type: "memo.delivered",
                title: "Memo delivered",
                description: `Memo ${memo.referenceNo} was delivered to ${recipients.length} recipient(s).`,
                fromStatus: "Draft",
                toStatus: "Completed",
                metadata: { recipients: recipients.map((person) => String(person._id)) },
            });
            return MemoRepository.findById(id, companyId);
        }

        if (!memo.businessService) throw serviceError("Select a Business Service before submitting this Approval Memo.");
        if (!memo.requisitionType) throw serviceError("Select a Requisition Type before submitting this Approval Memo.");
        if (!String(memo.businessJustification || "").trim()) throw serviceError("Business justification is required.");
        const service = await BusinessService.findOne({
            _id: memo.businessService,
            company: companyId,
            active: true,
            isActive: true,
            deletedAt: null,
        }).lean();
        if (!service) throw serviceError("Business Service not found or inactive.", 404);
        const allowedTypes = service.allowedRequisitionTypes || service.requisitionTypes || [];
        if (allowedTypes.length && !allowedTypes.includes(memo.requisitionType)) {
            throw serviceError("The selected Requisition Type is not available for this Business Service.");
        }
        this.validateServiceFields(service, memo.submissionDetails?.serviceFields || {});
        if (service.financialRequired && !memo.financialDetails?.estimatedAmount) {
            throw serviceError("Financial information and an estimated amount are required for this service.");
        }
        const workflowId = service.requisitionWorkflowMap?.[memo.requisitionType] || service.workflow?._id || service.workflow || memo.workflow;
        if (!workflowId) throw serviceError("No workflow is configured for this Business Service.");
        memo.workflow = workflowId;
        const instance = await WorkflowEngine.start(companyId, workflowId, "memo", memo._id, actorId);
        memo.workflowInstance = instance._id;
        memo.status = instance.status === "completed" ? "Approved" : "Pending";
        await memo.save();
        return MemoRepository.findById(id, companyId);
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
        if (existing.status !== "Draft") throw serviceError("Only drafts can be edited.");
        const allowed = [
            "title", "body", "priority", "recipients", "ccRecipients",
            "businessService", "requisitionType", "requestingSbu", "beneficiarySBU",
            "submissionDetails", "businessJustification", "requiredCompletionDate", "financialDetails",
        ];
        const updates = Object.fromEntries(Object.entries(payload).filter(([key]) => allowed.includes(key)));
        if (existing.memoType === "simple") {
            updates.recipients = (await this.resolvePeople(updates.recipients || existing.recipients, companyId, "recipients")).map((person) => person._id);
            updates.ccRecipients = (await this.resolvePeople(updates.ccRecipients || existing.ccRecipients, companyId, "CC recipients")).map((person) => person._id);
        }
        const memo = await MemoRepository.update(id, companyId, updates);
        await MemoEventService.record({
            company: companyId,
            memo: memo._id,
            actor: actorId,
            type: "memo.updated",
            title: "Draft updated",
            description: `Draft ${memo.referenceNo} was updated.`,
            metadata: { changedFields: Object.keys(updates) },
        });
        return memo;
    }
}
export default new MemoService();
