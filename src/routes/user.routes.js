import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()
router.route("/register").post(upload.fields([ //multer middleware : add fields in req object 
            {
                  name: "avatar",
                  maxCount: 1
            }, 
            {
                  name: "coverImage",
                  maxCount: 1
            }]), registerUser
      )
router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser) // by verifyJWT insert object on req.user
router.route("/refresh-token").post(registerUser)
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