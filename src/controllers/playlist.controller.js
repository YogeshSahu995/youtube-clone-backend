import mongoose, {isValidObjectId} from "mongoose";
import {ApiError, ApiResponse, asyncHandler} from "../utils/index.js"
import { Playlist } from "../models/playlist.model.js";
import {Video} from  "../models/video.model.js"

const createPlaylist = asyncHandler(async( req, res) => {
    const {name, description} = req.body

    if(
        [name, description].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are compailsory and required")
    }

    const userId = req.user?._id

    const createdPlaylist = await Playlist.create({
        name,
        description,
        owner: userId,
    })

    if(!createdPlaylist){
        throw new ApiError(500, "Issue in creating a playlist")
    }

    return res.status(200)
    .json(new ApiResponse(200, createdPlaylist, "Successfully create a playlist"))
})

const getUserPlaylists = asyncHandler(async( req, res ) => {
    const {userId} = req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "User Id is not valid")
    }

    const playlists = await Playlist.find({owner: userId})

    console.log(playlists)

    if(!playlists){
        throw new ApiError(500, "Any problem in getting playlist")
    }

    return res.status(200)
    .json(new ApiResponse(200, playlists, "Successfully get playlists"))
})

const getPlaylistById = asyncHandler(async(req, res) => {
    const {playlistId} = req.params
    
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "playlist id is invalid")
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId),
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $project: {
                            thumbnail: 1,
                            title: 1,
                            duration: 1,
                            owner: 1,
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        email: 1,
                                        avatar: 1,
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
    ])

    if(!playlist[0]){
        throw new ApiError(400, "Playlist is not exist")
    }

    return res.status(200)
    .json(new ApiResponse(200, playlist[0], "Successfully Fetched playlist"))

})

const addVideoToPlaylist = asyncHandler(async(req, res) => {
    const {playlistId, videoId} = req.params

    if(!(isValidObjectId(playlistId) && isValidObjectId(videoId))){
        throw new ApiError(400, "playlist and user id is invalid")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400, "Video is not exists")
    }

    const alreadyVideoExist = await Playlist.findOne({
        videos: {
            $in: [videoId]
        }
    })

    if(alreadyVideoExist){
        throw new ApiError(400, "This video is already exist in playist")
    }

    const addVideoId = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: {
                videos: videoId
            }
        },
        {
            new: true,
        }
    )

    if(!addVideoId){
        throw new ApiError(500, "Any issue in add Video in playlist")
    }

    return res.status(200)
    .json(new ApiResponse(200, addVideoId, "Successfully add video in playlist"))
})

const removeVideoFromPlaylist = asyncHandler(async(req, res) => {
    const {playlistId, videoId} = req.params
    
    if(!(isValidObjectId(playlistId) && isValidObjectId(videoId))){
        throw new ApiError(400, "playlist and user id is invalid")
    }

    const removeVideo = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId
            }
        },
        {
            new: true
        }
    )

    if(!removeVideo){
        throw new ApiError(500, "Any problem in removing a video from playlist")
    }

    return res.status(200)
    .json(new ApiResponse(200, removeVideo, "Successfully remove video from playlist"))

})

const deletePlaylist = asyncHandler(async(req, res) => {
    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(200, "playlist id is invalid")
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId)

    if(!deletedPlaylist){
        throw new ApiError(500, "Any Issue in deleting a playlist")
    }

    return res.status(200)
    .json(new ApiResponse(200, deletedPlaylist, "Successfully deleted a playlist"))
})

const updatePlaylist = asyncHandler(async(req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if(
        [name, description].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are compailsory and required")
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "playlist id is invalid")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description
            }
        },
        {
            new: true
        }
    )

    if(!updatedPlaylist){
        throw new ApiError(500, "Any problem is update a playlist")
    }

    return res.status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Successfully update a playlist"))
})



export { createPlaylist, getUserPlaylists, getPlaylistById, addVideoToPlaylist, removeVideoFromPlaylist, deletePlaylist, updatePlaylist }