import { healthcheck } from "../controllers/healthCheck.contoller.js";
import { Router } from "express";

const router = Router()

router.route("/").get(healthcheck)

export default router