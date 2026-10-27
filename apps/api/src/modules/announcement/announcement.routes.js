import express from "express";
import authenticate from "../auth/auth.middleware.js";
import controller from "./announcement.controller.js";
const router=express.Router(); router.use(authenticate);
router.get("/",controller.list); router.post("/",controller.create); router.patch("/:id",controller.update); router.delete("/:id",controller.archive);
export default router;
