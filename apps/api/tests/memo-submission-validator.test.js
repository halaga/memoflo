import test from "node:test";
import assert from "node:assert/strict";
import { normalizeMemoType, validateCreateMemo } from "../src/modules/memo/memo.validator.js";

const basic = {
    title: "Office update",
    body: "Please note the updated office schedule.",
    memoType: "simple",
    recipients: ["employee-1"],
};

const approval = {
    title: "Office supplies",
    body: "Request for office supplies.",
    memoType: "approval",
    businessService: "service-id",
    requisitionType: "Admin Requisition",
    businessJustification: "Items are required for daily operations.",
};

test("accepts Basic Memo with one or more recipients", () => {
    assert.doesNotThrow(() => validateCreateMemo(basic));
});

test("requires recipients for a submitted Basic Memo", () => {
    assert.throws(
        () => validateCreateMemo({ ...basic, recipients: [] }),
        /at least one recipient/,
    );
});

test("allows a Basic Memo draft without recipients", () => {
    assert.doesNotThrow(() => validateCreateMemo({ ...basic, recipients: [], saveAsDraft: true }));
});

test("accepts a valid Approval Memo with a separate requisition type", () => {
    assert.doesNotThrow(() => validateCreateMemo(approval));
});

test("requires a Business Service, Requisition Type and justification for submitted Approval Memos", () => {
    assert.throws(() => validateCreateMemo({ ...approval, requisitionType: "" }), /Requisition Type/);
    assert.throws(() => validateCreateMemo({ ...approval, businessService: "" }), /Business Service/);
    assert.throws(() => validateCreateMemo({ ...approval, businessJustification: "" }), /justification/);
});

test("allows incomplete Approval Memo drafts", () => {
    assert.doesNotThrow(() => validateCreateMemo({
        title: "Draft",
        body: "Draft content",
        memoType: "approval",
        saveAsDraft: true,
    }));
});

test("normalizes legacy request type to Approval Memo for new writes", () => {
    assert.equal(normalizeMemoType("request"), "approval");
});

test("rejects any third memo type", () => {
    assert.throws(
        () => validateCreateMemo({ ...basic, memoType: "procurement" }),
        /Basic Memo or Approval Memo/,
    );
});

test("rejects negative estimated financial amounts", () => {
    assert.throws(
        () => validateCreateMemo({
            ...approval,
            financialDetails: { estimatedAmount: -1 },
        }),
        /non-negative number/,
    );
});
