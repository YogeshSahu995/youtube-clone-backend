import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true // this allow cookies to be sent along with the request
}))

app.use(express.json({ limit: "16kb" })) //form data 
app.use(express.urlencoded({ extended: true, limit: "16kb" })) //yogesh%20kumar to yogesh kumar & extended usefull for nested object 
app.use(express.static("public"))
app.use(cookieParser()) //


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

/*
ye mount middleware :- means here a base path where the middleware or router mounted. Any request that starts with '/api/v1/users' will be handled by router (or middleware) which is passed as the second argument
http://localhost:8000/api/v1/users/register
*/


export { app } 