import { ApiError, ApiResponse, asyncHandler } from "../utils/index.js"
import { User } from "../models/user.model.js"
import { Tweet } from "../models/tweet.model.js"
import mongoose, { isValidObjectId } from "mongoose"

const createTweet = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user?._id)

    const { content } = req.body

    if (!content) {
        throw new ApiError(400, "Not given any content")
    }

    const createdTweet = await Tweet.create(
        {
            owner: user?._id,
            content
        }
    )

    if (!createdTweet) {
        throw new ApiError(500, "Internal problem when create tweet")
    }

    return res.status(200)
        .json(new ApiResponse(200, createdTweet, "successfully created tweet"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "unauthorized request")
    }

    const user = await User.findById(userId)

    if (!user) {
        throw new ApiError(400, "Unauthorized request")
    }

    const allTweets = await Tweet.aggregate([
        {
            $match: {
                owner: user._id // how Q..
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
                            avatar: 1,
                            email: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        }
    ])

    return res.status(200)
        .json(new ApiResponse(200, allTweets, "Successfully fetched tweets"))
})

const updateTweets = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const { content } = req.body
    const userId = req.user?._id

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "tweetId is Invalid")
    }

    if (!content) {
        throw new ApiError(400, "Content is required")
    }

    const validateowner = await Tweet.findOne(
        {
            $and: [
                { owner: userId },
                { _id: tweetId }
            ]
        }
    )

    if (!validateowner) {
        throw new ApiError(400, "Owner is not current user")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content
            }
        },
        {new: true}
    )

    if (!updatedTweet) {
        throw new ApiError(500, "Any problem in updating tweet")
    }

    return res.status(200)
        .json(new ApiResponse(200, updatedTweet, "Successfully updated a tweet"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const userId = req.user?._id

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "tweetId is Invalid")
    }

    const validateowner = await Tweet.findOne(
        {
            $and: [
                { owner: userId },
                { _id: tweetId }
            ]
        }
    )

    if (!validateowner) {
        throw new ApiError(400, "Owner is not current user")
    }

    const result = await Tweet.findByIdAndDelete(tweetId)

    return res.status(200)
        .json(new ApiResponse(200, result, "Successfully deleted tweet"))
})

export { createTweet, getUserTweets, updateTweets, deleteTweet }