const PRIORITIES = new Set(["Low", "Normal", "High", "Urgent", "Critical"]);

function validationError(message) {
    const error = new Error(message);
    error.status = 400;
    return error;
}

export function normalizeMemoType(value) {
    // Existing records using "request" remain readable; all new writes normalize to Approval Memo.
    return value === "request" ? "approval" : value || "simple";
}

export function validateCreateMemo(data) {
    if (!String(data.title || "").trim()) {
        throw validationError("Title is required.");
    }
    if (!String(data.body || "").trim()) {
        throw validationError("Memo content is required.");
    }

    const memoType = normalizeMemoType(data.memoType);
    if (!["simple", "approval"].includes(memoType)) {
        throw validationError("Select Basic Memo or Approval Memo.");
    }
    if (!PRIORITIES.has(data.priority || "Normal")) {
        throw validationError("Select a valid priority.");
    }

    if (memoType === "simple") {
        const recipients = Array.isArray(data.recipients) ? data.recipients : [];
        if (!recipients.length && !data.saveAsDraft) {
            throw validationError("Select at least one recipient.");
        }
        return;
    }

    if (data.saveAsDraft) return;
    if (!data.businessService) {
        throw validationError("Select a Business Service.");
    }
    if (!String(data.requisitionType || "").trim()) {
        throw validationError("Select a Requisition Type.");
    }
    if (!String(data.businessJustification || "").trim()) {
        throw validationError("Business justification is required.");
    }

    const financial = data.financialDetails || {};
    if (financial.estimatedAmount !== undefined && financial.estimatedAmount !== null && financial.estimatedAmount !== "") {
        const amount = Number(financial.estimatedAmount);
        if (!Number.isFinite(amount) || amount < 0) {
            throw validationError("Estimated amount must be a valid non-negative number.");
        }
    }
}
