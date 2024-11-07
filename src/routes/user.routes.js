import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken, changeCurrentPassword, getCurrenctUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register")
.post(upload.fields([ //multer middleware : add fields in req object 
      {
            name: "avatar",
            maxCount: 1
      }, 
      {
            name: "coverImage",
            maxCount: 1
      }]), 
registerUser)

router.route("/login")
.post(loginUser)

//secured routes
router.route("/logout")
.post(verifyJWT, logoutUser) // by verifyJWT insert object on req.user

router.route("/refresh-token")
.post(refreshAccessToken)

router.route("/change-password")
.post(verifyJWT, changeCurrentPassword)

router.route("/current-user")
.get(verifyJWT, getCurrenctUser)

//PATCH only updates specific fields. This makes it efficient when you only want to change part of the data.
router.route("/update-account")
.patch(verifyJWT, updateAccountDetails)

router.route("/update-avatar")
.patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

router.route("/update-cover-image")
.patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/channel/:username")
.get(verifyJWT, getUserChannelProfile)

router.route("/watch-history")
.get(verifyJWT, getWatchHistory)

export default router

/*
This router will handle all request tha match the base path '/api/v1/users'

router.route("/register").post(registerUser):-
This approach is useful if you plan to handle multiple HTTP methods (like GET, POST, PUT, DELETE) on the same route. You can chain multiple methods for the same route.

router.route("/register")
      .post(registerUser)      // Handle POST requests
      .get(getRegisterPage);   // Handle GET requests (if you want to serve a registration form)

router.post("/register", registerUser); // this is simple when use only single http method (like post)
*/