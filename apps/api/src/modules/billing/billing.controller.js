import Bill from "./bill.model.js";
import Payment from "./payment.model.js";

const actor = (req) => String(req.user?.employee || req.user?.id || req.user?._id || "system");
const company = (req) => req.user.company;
const fail = (res, status, message) => res.status(status).json({ success: false, message });

export async function listBills(req, res, next) {
  try {
    const filter = { company: company(req), isActive: true };
    if (req.query.status) filter.paymentStatus = req.query.status;
    const data = await Bill.find(filter).populate("memo department requester assignedFinanceOfficer").sort({ dueDate: 1, createdAt: -1 }).lean();
    res.json({ success: true, data });
  } catch (error) { next(error); }
}

export async function createBill(req, res, next) {
  try {
    const { reference, category, vendor, amount, invoiceNumber = "", ...rest } = req.body;
    if (!reference?.trim() || !category?.trim() || !vendor?.trim() || !Number.isFinite(Number(amount)) || Number(amount) <= 0) return fail(res, 400, "Reference, category, vendor and a positive amount are required.");
    if (invoiceNumber.trim()) {
      const duplicate = await Bill.findOne({ company: company(req), vendor: new RegExp(`^${vendor.trim().replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}$`, "i"), invoiceNumber: invoiceNumber.trim(), isActive: true });
      if (duplicate) return fail(res, 409, "A bill with this vendor and invoice number already exists.");
    }
    const data = await Bill.create({ ...rest, company: company(req), reference: reference.trim(), category: category.trim(), vendor: vendor.trim(), invoiceNumber: invoiceNumber.trim(), amount: Number(amount), requester: req.user.employee || undefined, auditHistory: [{ action: "bill_recorded", actor: actor(req) }] });
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
}

export async function linkBillMemo(req, res, next) {
  try {
    const bill = await Bill.findOneAndUpdate({ _id: req.params.id, company: company(req), isActive: true }, { $set: { memo: req.body.memoId, approvalStatus: "pending" }, $push: { auditHistory: { action: "memo_linked", actor: actor(req) } } }, { new: true, runValidators: true });
    if (!bill) return fail(res, 404, "Bill not found.");
    res.json({ success: true, data: bill });
  } catch (error) { next(error); }
}

export async function listPayments(req, res, next) {
  try {
    const filter = { company: company(req), isActive: true };
    if (req.query.status) filter.status = req.query.status;
    const data = await Payment.find(filter).populate("bill").sort({ paymentDate: -1 }).lean();
    res.json({ success: true, data });
  } catch (error) { next(error); }
}

export async function recordPayment(req, res, next) {
  try {
    const { billId, amount, paymentDate, reference, method, evidence = "" } = req.body;
    if (!billId || !Number.isFinite(Number(amount)) || Number(amount) <= 0 || !paymentDate || !reference?.trim()) return fail(res, 400, "Bill, positive payment amount, date and payment reference are required.");
    const bill = await Bill.findOne({ _id: billId, company: company(req), isActive: true });
    if (!bill) return fail(res, 404, "Bill not found.");
    if (bill.approvalStatus !== "approved") return fail(res, 409, "Only approved bills can be paid.");
    const duplicate = await Payment.findOne({ company: company(req), reference: reference.trim(), isActive: true });
    if (duplicate) return fail(res, 409, "This payment reference has already been recorded.");
    const paid = await Payment.aggregate([{ $match: { company: bill.company, bill: bill._id, status: { $nin: ["rejected", "reversed"] }, isActive: true } }, { $group: { _id: null, total: { $sum: "$amount" } } }]);
    const outstanding = Math.max(0, Number(bill.amount) - Number(paid[0]?.total || 0));
    if (Number(amount) > outstanding) return fail(res, 400, `Payment exceeds the outstanding balance of ${bill.currency} ${outstanding.toFixed(2)}.`);
    const payment = await Payment.create({ company: company(req), bill: bill._id, amount: Number(amount), currency: bill.currency, paymentDate, reference: reference.trim(), method, evidence, status: "awaiting_verification", auditHistory: [{ action: "payment_recorded", actor: actor(req) }] });
    const newPaid = Number(paid[0]?.total || 0) + Number(amount);
    bill.paymentStatus = newPaid >= bill.amount ? "awaiting_verification" : "partially_paid";
    bill.auditHistory.push({ action: "payment_recorded", actor: actor(req), note: `Payment ${payment.reference} recorded.` });
    await bill.save();
    res.status(201).json({ success: true, data: payment });
  } catch (error) { next(error); }
}

export async function updatePaymentStatus(req, res, next) {
  try {
    const { action, reason = "" } = req.body;
    const requiredPermission = action === "verify" ? "finance.payments.verify" : action === "reconcile" ? "finance.payments.reconcile" : "finance.payments.verify";
    if (!(req.userPermissions || []).includes(requiredPermission)) return fail(res, 403, `Missing permission: ${requiredPermission}`);
    const payment = await Payment.findOne({ _id: req.params.id, company: company(req), isActive: true });
    if (!payment) return fail(res, 404, "Payment not found.");
    const bill = await Bill.findOne({ _id: payment.bill, company: company(req) });
    if (action === "verify") {
      if (payment.status !== "awaiting_verification") return fail(res, 409, "Only payments awaiting verification can be verified.");
      payment.status = "verified"; payment.verifiedBy = actor(req); payment.verifiedAt = new Date();
    } else if (action === "reconcile") {
      if (payment.status !== "verified") return fail(res, 409, "A payment must be verified before reconciliation.");
      payment.status = "reconciled"; payment.reconciledBy = actor(req); payment.reconciledAt = new Date();
    } else if (action === "reject") {
      if (!reason.trim()) return fail(res, 400, "A rejection reason is required.");
      payment.status = "rejected"; payment.rejectionReason = reason.trim();
    } else if (action === "reverse") {
      if (!reason.trim()) return fail(res, 400, "A reversal reason is required.");
      payment.status = "reversed"; payment.reversalReason = reason.trim();
    } else return fail(res, 400, "Unsupported payment action.");
    payment.auditHistory.push({ action: `payment_${action}`, actor: actor(req), note: reason });
    await payment.save();
    if (bill) {
      const payments = await Payment.find({ company: company(req), bill: bill._id, status: { $nin: ["rejected", "reversed"] }, isActive: true });
      const total = payments.reduce((sum, item) => sum + Number(item.amount), 0);
      const allReconciled = payments.length > 0 && payments.every((item) => item.status === "reconciled");
      bill.paymentStatus = allReconciled && total >= bill.amount ? "reconciled" : total >= bill.amount ? "verified" : total > 0 ? "partially_paid" : "unpaid";
      bill.auditHistory.push({ action: `payment_${action}`, actor: actor(req), note: reason });
      await bill.save();
    }
    res.json({ success: true, data: payment });
  } catch (error) { next(error); }
}
