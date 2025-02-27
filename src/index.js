import connectDB from "./db/index.js";
import { app } from "./app.js"


connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.log(`ERR: ${error}`)
            throw error
        })

        const port = process.env.PORT 
        app.listen(port, () => {
            console.log(`Server is Running at port : ${port}`)
        })
    })
    .catch((error) => {
        console.log("MONGO db connection failed !!! ", error)
    })
