import SBU from "./sbu.model.js";
import Department from "./department.model.js";
import Designation from "./designation.model.js";

export async function seedOrganization(company) {
  console.log("\n🏢 Seeding Organization...");

  /*
   * SBUs
   */

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

  /*
   * Departments
   */

  const departments = [
    {
      name: "Human Resources",
      code: "HR",
      sbu: sbus.CORP._id,
    },

    {
      name: "Administration",
      code: "ADMIN",
      sbu: sbus.CORP._id,
    },

    {
      name: "Accounts",
      code: "ACC",
      sbu: sbus.FIN._id,
    },

    {
      name: "Procurement",
      code: "PROC",
      sbu: sbus.FIN._id,
    },

    {
      name: "Information Technology",
      code: "IT",
      sbu: sbus.TECH._id,
    },

    {
      name: "Software",
      code: "SW",
      sbu: sbus.TECH._id,
    },

    {
      name: "Retail Operations",
      code: "RET",
      sbu: sbus.OPS._id,
    },

    {
      name: "Sales",
      code: "SAL",
      sbu: sbus.SALES._id,
    },

    {
      name: "Marketing",
      code: "MKT",
      sbu: sbus.MKT._id,
    },
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

  /*
   * Designations
   */

  const designations = [
    { title: "Chief Executive Officer", level: 100 },

    { title: "Executive Director", level: 95 },

    { title: "General Manager", level: 90 },

    { title: "Head of Department", level: 80 },

    { title: "Manager", level: 70 },

    { title: "Assistant Manager", level: 60 },

    { title: "Supervisor", level: 50 },

    { title: "Senior Officer", level: 40 },

    { title: "Officer", level: 30 },

    { title: "Assistant", level: 20 },

    { title: "Intern", level: 10 },
  ];

  for (const item of designations) {
    const exists = await Designation.findOne({
      company: company._id,
      title: item.title,
    });

    if (!exists) {
      await Designation.create({
        company: company._id,
        ...item,
      });

      console.log(`✔ Designation: ${item.title}`);
    }
  }

  console.log("✅ Organization Seed Complete\n");
}