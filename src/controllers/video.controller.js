import {ApiError, ApiResponse, asyncHandler, uploadOnCloudinary, removeOnCloudinary, removeVideoOnCloudinary} from "../utils/index.js"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import mongoose, {isValidObjectId} from "mongoose"

const getAllVideos = asyncHandler(async(req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "user id is invalid")
    }

    const aggregate = await Video.aggregate([
        {
            $match: {
                $and: [
                    query? {title: {$regex: query, $options: "i"}} : {},
                    userId ?{owner: userId}: {}
                ]
            }
        },
        {
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1 
                //sortBy means it's hold the field you want to sortBy(createdAt, views, title)
                // When we put sortBy in square brackets, it means we’re using the value of sortBy as the actual field name in the $sort object.
            }
        }
    ])

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    }

    const allVideos = await Video.aggregatePaginate(aggregate, options)

    return res.status(200)
    .json(new ApiResponse(200, allVideos, "Successfully fetched all videos"))
})

const publishAVideo = asyncHandler(async(req, res) => {
    const { title, description } = req.body
    const fileLocalPath = req.files?.thumbnail[0]?.path
    const videoLocalPath = req.files?.videoFile[0]?.path
    const userID = req.user?._id

    console.log(req.files)

    if(!(title && description)){
        throw new ApiError(400, "Title and Description is required fields")
    }
    
    if(!fileLocalPath){
        throw new ApiError(400, "thumbnail image is required")
    }

    if(!videoLocalPath){
        throw new ApiError(400, "Video is required")
    }

    const thumbnail = await uploadOnCloudinary(fileLocalPath)
    const video = await uploadOnCloudinary(videoLocalPath)

    if(!(thumbnail && video)){
        throw new ApiError("Problem in uploading!")
    }

    const publishedVideo = await Video.create(
        {
            thumbnail: thumbnail?.url,
            videoFile: video?.url,
            title,
            description,
            duration: video.duration,
            owner: userID,
        }
    )

    if(!publishedVideo){
        throw new ApiError(500, "Any Problem in Uploading video info")
    }

    return res.status(200)
    .json(new ApiResponse(200, publishedVideo, "SuccessFully upload a video"))
})

const getVideoById = asyncHandler(async(req, res) => {
    const {videoId} = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id")
    }

    const video = await Video.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(videoId),
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
                        $project:{
                            _id:1,
                            username: 1,
                            avatar:1,
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$owner"
        }
    ])

    console.log(video)

    if(!video?.length){
        throw new ApiError(404, "Video is not exist")
    }

    return res.status(200)
    .json(new ApiResponse(200, video[0], "Successfully get a video"))
})

const updateVideo = asyncHandler(async(req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError("Video Id is Invalid")
    }

    const getVideo = await Video.findById(videoId)

    if(req.file?.path){
        const result = await removeOnCloudinary(getVideo.thumbnail)

        if(!result){
            throw new ApiError(500, "Issue in removing a previous video")
        }
    }

    const thumbnailLocalPath = req.file?.path

    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail is required")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!thumbnail?.url){
        throw new ApiError(500, "Issue in uploading video")
    }

    const updatedThumbnail = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                thumbnail: thumbnail?.url
            },
        },
        {new: true}
    )

    if(!updatedThumbnail){
        throw new ApiError("video document is not exist")
    }

    return res.status(200)
    .json(new ApiResponse(200, updatedThumbnail, "Successfully update a video"))
})

//kuch kerna hai
const deleteVideo = asyncHandler(async(req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video Id is invalid")
    }

    const result = await Video.findByIdAndDelete(videoId)

    console.log(result)

    removeVideoOnCloudinary(result.videoFile)
    removeOnCloudinary(result.thumbnail)

    if(!result){
        throw new ApiError(500, "Internal issue in deleting video")
    }

    return res.status(200)
    .json(new ApiResponse(200, result, "Successfully delete video"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video id is Invalid")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "Video is not exist")
    }

    video.isPublished = !video.isPublished
    await video.save({vaildateBeforeSave: false})

    return res.status(200)
    .json(new ApiResponse(200, video, "successfully toggled!"))
})

export {publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus, getAllVideos}