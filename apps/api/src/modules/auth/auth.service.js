import {
  findUserByEmail,
  findUserById,
} from "./auth.repository.js";

import { comparePassword } from "./password.js";
import { generateToken } from "./jwt.js";

export async function login(email, password) {
  const user = await findUserByEmail(email);

  if (!user)
    throw new Error("Invalid credentials");

  const valid = await comparePassword(
    password,
    user.password
  );

  if (!valid)
    throw new Error("Invalid credentials");

  const token = generateToken(user);

  const profile = await findUserById(user._id);

  return {
    token,
    user: profile,
  };
}

export async function me(id) {
  return findUserById(id);
}