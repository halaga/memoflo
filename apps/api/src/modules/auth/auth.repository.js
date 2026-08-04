import User from "./user.model.js";

export async function findUserByEmail(email) {
  return User.findOne({ email }).select("+password");
}

export async function findUserById(id) {
  return User.findById(id)
    .populate("company")
    .populate("department")
    .populate("sbu")
    .populate("designation")
    .populate("role");
}