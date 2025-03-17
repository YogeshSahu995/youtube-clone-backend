import mongoose, { isValidObjectId } from "mongoose"
import { Video, Subscription, Like } from "../models/index.model.js"
import { ApiError, ApiResponse, asyncHandler } from "../utils/index.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!isValidObjectId(userId)) {
        return new ApiError(400, "UserId is not valid")
    }

    const calculateView = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId) 
            }
        },
        {
            $group: {
                _id: null, //Group all documents by setting _id: null
                totalViews: { $sum: "$views" }
            }
        }
    ])

    const totalViews = calculateView[0]?.totalViews || 0

    const calculateLike = await Video.aggregate([
        {
            $match: {
                owner: userId
            }
        },
        {
            $project: {
                _id: 1, // that is video id
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "video",
                pipeline: [
                    {
                        $project: {
                            likedBy: 1,
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                likeCount: {
                    $size: {$ifNull: ["$video", []]} // how many docs is create by like module of a video
                }
            }
        },
        {
            $group: {
                _id: null,
                totalLikes: { $sum: "$likeCount" }
            }
        }
    ])

    const totalLikes = calculateLike[0]?.totalLikes || 0

    const totalVideos = await Video.countDocuments({ owner: userId })

    const totalSubscribers = await Subscription.countDocuments({ channel: userId })

    const subscribedChannels = await Subscription.countDocuments({ subscriber: userId })

    return res.status(200)
        .json(new ApiResponse(200,
            { totalSubscribers, subscribedChannels, totalViews, totalVideos, totalLikes },
            "Successfully fetched a Info of channel"
        ))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "UserId is not valid")
    }

    const allVideos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "like"
            }
        },
        {
            $addFields: {
                likes: {
                    $size: {$ifNull: ["$like", []]}
                }
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comment"
            }
        },
        {
            $addFields: {
                comments: {
                    $size: {$ifNull: ["$comment", []]}
                }
            }
        },
        {
            $project: {
                thumbnail: 1,
                createdAt: 1,
                updatedAt: 1,
                title: 1,
                description: 1,
                likes: 1,
                comments: 1,
                views: 1
            }
        }
    ])

    return res.status(200)
        .json(new ApiResponse(200, allVideos, "Successfully fetch channel videos"))
})

export { getChannelStats, getChannelVideos }