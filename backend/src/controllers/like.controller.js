import { Like, Video, Comment, Tweet } from "../models/index.model.js"
import { asyncHandler, ApiResponse, ApiError } from "../utils/index.js"
import mongoose, { isValidObjectId } from "mongoose"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user?._id

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, `Is not a valid video Id ${videoId}`)
    }

    const videoExist = await Video.findById(videoId)

    if (!videoExist) {
        throw new ApiError(400, "Error: Video is not exist (find by videoId)")
    }

    const alreadyLiked = await Like.findOne({
        $and: [
            { video: videoId },
            { likedBy: userId }
        ]
    })

    if (alreadyLiked) {
        const disableLike = await Like.findByIdAndDelete(alreadyLiked?._id)

        if (disableLike) {
            return res.status(200)
                .json(new ApiResponse(200, false, "Successfully unlike a video"))
        }
    }

    const likeAVideo = await Like.create({
        video: videoExist?._id,
        likedBy: userId
    })

    if (!likeAVideo) {
        throw new ApiError(500, "Any problem in likeing a video")
    }

    return res.status(200)
        .json(new ApiResponse(200, true, "Successfully Like a video"))
})

const toggleCommentLike = asyncHandler(asyncHandler(async (req, res) => {
    const userId = req.user?._id
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, `Is not a valid comment Id ${commentId}`)
    }

    const commentExist = await Comment.findById(commentId)

    if (!commentExist) {
        throw new ApiError(400, "Comment is not exist (findBy commentId)")
    }

    const alreadyLiked = await Like.findOne({
        $and: [
            { likedBy: userId },
            { comment: commentId }
        ]
    })

    if (alreadyLiked) {
        const disableLike = await Like.findByIdAndDelete(alreadyLiked?._id)

        if (disableLike) {
            return res.status(200)
                .json(new ApiResponse(200, false, "Successfully unlike a comment"))
        }
    }

    const likeAComment = await Like.create({
        comment: commentExist?._id,
        likedBy: userId
    })

    if (!likeAComment) {
        throw new ApiError(500, "Any problem in like a comment")
    }

    return res.status(200)
        .json(new ApiResponse(200, true, "Successfully like a comment"))
}))

const toggleTweetLike = asyncHandler(async (req, res) => {
    const userId = req.user?._id
    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, `Is not a valid tweet Id ${tweetId}`)
    }

    const tweetExist = await Tweet.findById(tweetId)

    if (!tweetExist) {
        throw new ApiError(400, "Tweet is not exist (findBy tweetId)")
    }

    const alreadyLiked = await Like.findOne({
        $and: [
            { likedBy: userId },
            { tweet: tweetId }
        ]
    })

    if (alreadyLiked) {
        const disableLike = await Like.findByIdAndDelete(alreadyLiked?._id)

        if (disableLike) {
            return res.status(200)
                .json(new ApiResponse(200, false, "Successfully unlike a tweet"))
        }
    }

    const likeATweet = await Like.create({
        tweet: tweetExist?._id,
        likedBy: userId
    })

    if (!likeATweet) {
        throw new ApiError(500, "Any problem in like a tweet")
    }

    return res.status(200)
        .json(new ApiResponse(200, true, "Successfully like a tweet"))
})

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: userId,
                video: { $exists: true },
                tweet: { $exists: false },
                comment: { $exists: false }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        avatar: 1,
                                        username: 1,
                                        _id: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $unwind: "$owner"
                    },
                    {
                        $project: {
                            thumbnail: 1,
                            title: 1,
                            createdAt: 1,
                            duration: 1,
                            owner: 1,
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$video"
        },
        {
            $project: {
                likedBy: 1,
                createdAt: 1,
                video: 1,
            }
        }
    ])

    console.log(likedVideos)

    return res.status(200)
        .json(new ApiResponse(200, likedVideos, "Successfully Fetched all liked videos"))
})

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos }