import test from "node:test";
import assert from "node:assert/strict";
import Employee from "../src/modules/employee/employee.model.js";
import WorkflowStep from "../src/modules/workflow/workflowStep.model.js";

test("employee identity is unique within a company, not globally", () => {
  const indexes = Employee.schema.indexes();
  const emailIndex = indexes.find(([keys, options]) =>
    keys.company === 1 && keys.email === 1 && options.unique === true
  );
  const employeeNoIndex = indexes.find(([keys, options]) =>
    keys.company === 1 && keys.employeeNo === 1 && options.unique === true
  );

  assert.ok(emailIndex, "company + email unique index must exist");
  assert.ok(employeeNoIndex, "company + employee number unique index must exist");
  assert.notEqual(Employee.schema.path("email").options.unique, true);
  assert.notEqual(Employee.schema.path("employeeNo").options.unique, true);
  assert.equal(Employee.schema.path("company").isRequired, true);
});

test("workflow steps carry an explicit company association", () => {
  assert.equal(WorkflowStep.schema.path("company").isRequired, true);
  const indexes = WorkflowStep.schema.indexes();
  assert.ok(indexes.some(([keys, options]) =>
    keys.company === 1 && keys.workflow === 1 && keys.order === 1 && options.unique === true
  ));
});
