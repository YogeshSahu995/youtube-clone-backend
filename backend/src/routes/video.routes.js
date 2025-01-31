import { Router } from "express";
import { 
    getSeachVideosOfChannel, 
    getVideoById, 
    getChannelVideos,
    updateVideo, 
    deleteVideo, 
    publishAVideo, 
    togglePublishStatus, 
    addVideoInHistory, 
    getVideosByTitle,
    handleVideoViews,
} from "../controllers/video.controller.js"

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js"

const router = Router()

router.use(verifyJWT)

router.route("/")
    .get(getSeachVideosOfChannel)
    .post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            }
        ]), publishAVideo)

router.route("/t")
        .get(getVideosByTitle)

router.route("/c")
        .get(getChannelVideos)

router.route("/:videoId")
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(upload.single("thumbnail"), updateVideo)

router.route("/view/:videoId/:userId").post(handleVideoViews)

router.route("/add/history/:videoId").patch(addVideoInHistory)

router.route("/toggle/publish/:videoId")
    .patch(togglePublishStatus)


export default router