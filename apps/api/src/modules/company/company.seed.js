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

    slug: "ringo",

    email: "admin@ringo.ng",

    phone: "+234000000000",

    website: "https://www.ringo.ng",

    industry: "Telecommunications",
  });

  console.log("✔ Company Created");

  return company;
}