import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"
import { createTweet, deleteTweet, updateTweets, getUserTweets, getTweetById } from "../controllers/tweet.controller.js"

const router = Router()

router.use(verifyJWT);

router.route("/")
.post(upload.single("image"), createTweet)

router.route("/user/:userId")
.get(getUserTweets)

router.route("/:tweetId")
.patch(upload.single("image"), updateTweets)
.delete(deleteTweet)
.get(getTweetById)

export default router