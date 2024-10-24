import {Router} from "express";
import { registerUser } from "../controllers/user.controller.js";
const router = Router()

router.route("/register").post(registerUser)

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