import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"


// give current user details by accessToken
export const verifyJWT = asyncHandler(async (req, res, next) => {
    //sir use try catch here...
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
        throw new ApiError("401", "Unauthorized request")
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

    if (!user) {
        //TODO: discuss about frontend
        throw new ApiError(401, "Invalid Access Token")
    }

    req.user = user; // same as Multer..
    next()
})