import express from 'express'
import dotenv from "dotenv"
import connectDB from "./db/index.js";

const app = express()
dotenv.config({ path: './.env' })

connectDB()
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
