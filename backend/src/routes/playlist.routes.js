import { Router } from "express";
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
    videoExistInPlaylist
} from "../controllers/playlist.controller.js"

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.use(verifyJWT)

router.route("/")
    .post(createPlaylist)

router.route("/:playlistId")
    .get(getPlaylistById)
    .delete(deletePlaylist)
    .patch(updatePlaylist)

router.route("/check-exist/:playlistId/:videoId")
    .get(videoExistInPlaylist)

router.route("/add/:videoId/:playlistId")
    .patch(addVideoToPlaylist)

router.route("/remove/:videoId/:playlistId")
    .patch(removeVideoFromPlaylist)

router.route("/user/:userId")
    .get(getUserPlaylists)

export default router