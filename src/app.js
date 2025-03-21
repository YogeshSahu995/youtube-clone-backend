import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: [`${process.env.CORS_ORIGIN}`],
    credentials: true
}))

app.use(express.json({ limit: "16kb" })) 
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser()) 


//routes import 
import {
    userRouter,
    subscriptionRouter,
    tweetRouter,
    videoRouter,
    commentRouter,
    likeRouter,
    dashboardRouter,
    playlistRouter,
    healthcheckRouter
} from "./routes/index.routes.js"

//routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/dashboard", dashboardRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/healthcheck", healthcheckRouter)

//error handler middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500)
    .json({ 
        status: err.statusCode || 500,
        message: err.message || 'internal server error' ,
        success: false, 
    });
});


export { app } 