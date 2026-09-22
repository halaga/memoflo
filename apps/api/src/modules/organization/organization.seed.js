import SBU from "./sbu/sbu.model.js";
import Department from "./department/department.model.js";
import Designation from "./designation/designation.model.js";

export async function seedOrganization(company) {
  console.log("\n🏢 Seeding Organization...");

  const sbuData = [
    { name: "Corporate Services", code: "CORP" },
    { name: "Finance", code: "FIN" },
    { name: "Operations", code: "OPS" },
    { name: "Technology", code: "TECH" },
    { name: "Sales", code: "SALES" },
    { name: "Marketing", code: "MKT" },
  ];

  const sbus = {};

  for (const item of sbuData) {
    let sbu = await SBU.findOne({
      company: company._id,
      code: item.code,
    });

    if (!sbu) {
      sbu = await SBU.create({
        company: company._id,
        ...item,
      });

      console.log(`✔ SBU: ${item.name}`);
    }

    sbus[item.code] = sbu;
  }

  const departments = [
    { name: "Human Resources", code: "HR", sbu: sbus.CORP._id },
    { name: "Administration", code: "ADMIN", sbu: sbus.CORP._id },
    { name: "Accounts", code: "ACC", sbu: sbus.FIN._id },
    { name: "Procurement", code: "PROC", sbu: sbus.FIN._id },
    { name: "Information Technology", code: "IT", sbu: sbus.TECH._id },
    { name: "Software", code: "SW", sbu: sbus.TECH._id },
    { name: "Retail Operations", code: "RET", sbu: sbus.OPS._id },
    { name: "Sales", code: "SAL", sbu: sbus.SALES._id },
    { name: "Marketing", code: "MKT", sbu: sbus.MKT._id },
  ];

  for (const item of departments) {
    const exists = await Department.findOne({
      company: company._id,
      code: item.code,
    });

    if (!exists) {
      await Department.create({
        company: company._id,
        ...item,
      });

      console.log(`✔ Department: ${item.name}`);
    }
  }

  // Designations are scoped to both an SBU and a department.
  // Keep the seed data aligned with that schema instead of creating
  // orphaned/global designations.
  const designations = [
    { title: "Chief Executive Officer", level: 100, departmentCode: "ADMIN" },
    { title: "Executive Director", level: 95, departmentCode: "ADMIN" },
    { title: "General Manager", level: 90, departmentCode: "ADMIN" },
    { title: "Head of Department", level: 80, departmentCode: "HR" },
    { title: "Manager", level: 70, departmentCode: "ADMIN" },
    { title: "Assistant Manager", level: 60, departmentCode: "ADMIN" },
    { title: "Supervisor", level: 50, departmentCode: "ADMIN" },
    { title: "Senior Officer", level: 40, departmentCode: "IT" },
    { title: "Officer", level: 30, departmentCode: "IT" },
    { title: "Assistant", level: 20, departmentCode: "IT" },
    { title: "Intern", level: 10, departmentCode: "IT" },
  ];

  const departmentMap = {};
  for (const item of departments) {
    const department = await Department.findOne({
      company: company._id,
      code: item.code,
    });

    if (department) {
      departmentMap[item.code] = department;
    }
  }

  for (const item of designations) {
    const department = departmentMap[item.departmentCode];

    if (!department) {
      console.log(`⚠️ Skipping designation ${item.title}: department ${item.departmentCode} not found`);
      continue;
    }

    const exists = await Designation.findOne({
      company: company._id,
      department: department._id,
      title: item.title,
    });

    if (!exists) {
      await Designation.create({
        company: company._id,
        sbu: department.sbu,
        department: department._id,
        title: item.title,
        level: item.level,
      });

      console.log(`✔ Designation: ${item.title} (${department.name})`);
    }
  }

  console.log("✅ Organization Seed Complete\n");
}
