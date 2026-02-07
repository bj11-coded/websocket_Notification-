import { getNotification, notification } from "../controllers/notification.controller.js";
import express from "express";

const router = express.Router()

router.post("/", notification )
router.get("/", getNotification )

export default router