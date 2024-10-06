// required('dotenv').config({path: '../env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({ path: '../.env' })

connectDB() // when async function end return promise
.then(() => {
    app.on("error", (error) => {
        console.log(`ERRR: ${error}`)
    })

    const port = process.env.PORT || 8000
    app.listen(port, () => {
        console.log(`Server is Running at port : ${port}`)
    })
})
.catch((error) => {
    console.log("MONGO db connection failed !!! ", error)
})
















/*
{FIRST APPROACH}
import express from 'express'
const app = express()

Self-Invoking Async Function
;( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)

        app.on("errror", (error) => {
            console.log("ERRR: ", error)
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log("App is listening")
        })

    } catch (error) {
        console.error("Error: ", error)
        throw error
    }
} )()
*/