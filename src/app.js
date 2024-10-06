import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"})) //form data
app.use(express.urlencoded({extended: true, limit: "16kb"})) //url data (space - %20) by urlencoded
app.use(express.static("public")) // images,file,folder store in server which is access by anybody
app.use(cookieParser())
export {app}