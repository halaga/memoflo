import Company from "./company.model.js";

const developmentModules = [
  "memos", "signature", "leave", "procurement", "assets",
  "expenses", "documents", "requests", "meetings", "visitors", "maintenance",
];

export async function seedCompany() {
  let company = await Company.findOne({ code: "RINGO" });

  if (company) {
    await Company.updateOne(
      { _id: company._id },
      { $set: { "settings.modules": developmentModules } }
    );
    return Company.findById(company._id);
  }

  company = await Company.create({
    name: "Ringo Telecommunications",
    code: "RINGO",
    slug: "ringo",
    email: "admin@ringo.ng",
    phone: "+234000000000",
    website: "https://www.ringo.ng",
    industry: "Telecommunications",
    settings: { modules: developmentModules },
  });

  console.log("✔ Company Created");
  return company;
}
