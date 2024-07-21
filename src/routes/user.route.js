import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js"; //user extension .js when you face errors in debuging process.
import { upload } from "../middlewares/multer.middleware.js";

// To upload images, we user multer middleware before registering user, we use upload middleware and first we set the name, and then maxCount how many images we can upload.

const router = Router();
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

export default router;
