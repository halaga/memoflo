import Joi from "joi";

export const createEmployeeSchema = Joi.object({
  company: Joi.string().required(),

  firstName: Joi.string().required(),

  lastName: Joi.string().required(),

  email: Joi.string().email().required(),

  password: Joi.string().min(6).required(),

  phone: Joi.string().allow(""),

  role: Joi.string().allow(null, ""),

  position: Joi.string().allow(null, ""),
});