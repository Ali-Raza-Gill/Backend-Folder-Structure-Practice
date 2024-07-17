import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js"; //user extension .js when you face errors in debuging process.

const router = Router();
router.route("/register").post(registerUser);

export default router;
