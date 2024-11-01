import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"})) //form data 
app.use(express.urlencoded({extended: true, limit: "16kb" })) //yogesh%20kumar to yogesh kumar & extended usefull for nested object 
app.use(express.static("public"))
app.use(cookieParser()) //


//routes import 
import userRouter from "./routes/user.routes.js"

//routes declaration
app.use("/api/v1/users", userRouter) 
/*
ye mount middleware :- means here a base path where the middleware or router mounted. Any request that starts with '/api/v1/users' will be handled by router (or middleware) which is passed as the second argument
http://localhost:8000/api/v1/users/register
*/


export {app} 