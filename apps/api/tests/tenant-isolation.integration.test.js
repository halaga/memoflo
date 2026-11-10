import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Company from "../src/modules/company/company.model.js";
import Employee from "../src/modules/employee/employee.model.js";
import EmployeeRepository from "../src/modules/employee/employee.repository.js";
import "../src/modules/position/position.model.js";
import "../src/modules/organization/department/department.model.js";
import "../src/modules/auth/role.model.js";

const uri = process.env.MEMOFLO_TEST_MONGODB_URI;
const enabled = Boolean(uri);
let companies = [];

before(async () => {
  if (!enabled) return;
  const parsed = new URL(uri);
  const databaseName = parsed.pathname.replace(/^\//, "");
  if (!/test/i.test(databaseName)) {
    throw new Error("MEMOFLO_TEST_MONGODB_URI must point to a database whose name contains 'test'.");
  }
  await mongoose.connect(uri);
  await Company.syncIndexes();
  await Employee.syncIndexes();
});

after(async () => {
  if (enabled && companies.length) {
    const ids = companies.map((company) => company._id);
    await Employee.deleteMany({ company: { $in: ids } });
    await Company.deleteMany({ _id: { $in: ids } });
  }
  if (enabled) await mongoose.disconnect();
});

test("two companies can reuse employee email and employee number without cross-tenant lookup", {
  skip: !enabled,
}, async () => {
  const suffix = new mongoose.Types.ObjectId().toString();
  const companyA = await Company.create({ name: `Tenant A ${suffix}`, code: `TA${suffix.slice(-6)}`, slug: `tenant-a-${suffix}` });
  companies.push(companyA);
  const companyB = await Company.create({ name: `Tenant B ${suffix}`, code: `TB${suffix.slice(-6)}`, slug: `tenant-b-${suffix}` });
  companies.push(companyB);

  const sharedEmail = `shared-${suffix}@example.test`;
  const sharedEmployeeNo = `EMP-${suffix.slice(-8)}`;
  const [employeeA, employeeB] = await Employee.create([
    { company: companyA._id, employeeNo: sharedEmployeeNo, firstName: "Tenant", lastName: "A", email: sharedEmail, password: "test-hash" },
    { company: companyB._id, employeeNo: sharedEmployeeNo, firstName: "Tenant", lastName: "B", email: sharedEmail, password: "test-hash" },
  ]);

  const foundA = await EmployeeRepository.findByEmail(sharedEmail, companyA._id);
  const foundB = await EmployeeRepository.findByEmail(sharedEmail, companyB._id);
  const crossLookup = await EmployeeRepository.findById(employeeA._id, companyB._id);

  assert.equal(String(foundA._id), String(employeeA._id));
  assert.equal(String(foundB._id), String(employeeB._id));
  assert.equal(crossLookup, null);
});
