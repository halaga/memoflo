import express from "express";
import authenticate from "../auth/auth.middleware.js";
import PositionController from "./position.controller.js";

const router = express.Router();

router.use(authenticate);

router.post("/", PositionController.create);

router.get("/", PositionController.list);

router.get("/:id", PositionController.show);

router.patch("/:id", PositionController.update);

router.post("/:id/assign", PositionController.assign);

router.post("/:id/vacate", PositionController.vacate);

router.delete("/:id", PositionController.remove);

console.log("POSITION ROUTES LOADED");
export default router;