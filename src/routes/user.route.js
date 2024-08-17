import { Router } from "express";
import {
  loginUser,
  logOut,
  registerUser,
  refreshAccessToken,
  changePassword,
  updateUserDetails,
  getCurrentUser,
  updateUserConverImage,
  updateUserAvatar,
  getUserChannelProfile,
  getWatchHistory,
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

router.route("/change-password").post(verifyJWT, changePassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-user").patch(verifyJWT, updateUserDetails);
// when we get data from req, then we write simple route , but when we get link, we made routes, like, in this first we have to verifyJWT then upload image, and then updateUserAvatar same as in coverImage.
router
  .route("/update-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router
  .route("/update-coverimage")
  .patch(verifyJWT, upload.single("coverImage"), updateUserConverImage);

//When we get data from params, then we write route like ("/channel/:username"),or ("/c/:username")
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);

router.route("/watch-history").get(verifyJWT, getWatchHistory);

export default router;
