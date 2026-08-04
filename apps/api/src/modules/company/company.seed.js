import Company from "./company.model.js";

export async function seedCompany() {
  let company = await Company.findOne({
    code: "RINGO",
  });

  if (company) {
    console.log("✔ Company already exists");
    return company;
  }

  company = await Company.create({
    name: "Ringo Telecommunications",
    code: "RINGO",
    email: "info@ringo.ng",
    phone: "+234000000000",
    website: "https://www.ringo.ng",
    status: "ACTIVE",
  });

  console.log("✔ Company created");

  return company;
}