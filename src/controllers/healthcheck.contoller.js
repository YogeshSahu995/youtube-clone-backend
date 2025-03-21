import { asyncHandler, ApiError, ApiResponse } from "../utils/index.js";
import mongoose from "mongoose";

export const healthcheck = asyncHandler(async (req, res) => {
    const dbstatus = mongoose.connection.readyState;

    if (dbstatus === 1) {
        return res.status(200)
            .json(new ApiResponse(200, { status: "Ok" }, "Ok report of connection with db"))
    }
    else {
        return res.status(503)
            .json(new ApiError(503, { status: "Internal Issue" }, "Service is unavilable"))
    }
})
