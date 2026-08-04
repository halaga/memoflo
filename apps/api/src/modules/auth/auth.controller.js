import * as authService from "./auth.service.js";

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const result = await authService.login(
      email,
      password
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function me(req, res, next) {
  try {
    const user = await authService.me(
      req.user.id
    );

    res.json(user);
  } catch (error) {
    next(error);
  }
}