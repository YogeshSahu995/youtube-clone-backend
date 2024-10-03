// required('dotenv').config({path: '../env'})
import dotenv from "dotenv"

import connectDB from "./db/index.js";
dotenv.config({path: '../env'})

connectDB()










/*
{FIRST APPROACH}
import express from 'express'
const app = express()

;( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)

        app.on("error", (error) => {
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