import { Router } from "express";
import {
  loginUser,
  logOut,
  registerUser,
  refreshAccessToken,
} from "../controllers/user.controller.js"; //user extension .js when you face errors in debuging process.
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

// To upload images, we user multer middleware before registering user, we use upload middleware and first we set the name, and then maxCount how many images we can upload.

const router = Router();
//secure routes
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
//secure routes
router.route("/login").post(loginUser);
//secure routes
router.route("/logout").post(verifyJWT, logOut);
//unsecure routes, here we no need of verifyJWT, but in some cases we need it, so we carefully make the logic here.
router.route("/refresh-token").post(refreshAccessToken);

export default router;
