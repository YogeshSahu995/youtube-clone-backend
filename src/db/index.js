import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async() => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`) //hold response
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`)
        console.log(process.env.MONGODB_URL)
    } catch (error) {
        console.error("Error: MongoDB connection Failed "+error.message)
        process.exit(1) //exit with failure code
    }
}

export default connectDB