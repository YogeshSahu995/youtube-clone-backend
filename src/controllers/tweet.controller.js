import { ApiError, ApiResponse, asyncHandler, uploadOnCloudinary, removeOnCloudinary } from "../utils/index.js"
import { User } from "../models/user.model.js"
import { Tweet } from "../models/tweet.model.js"
import mongoose, { isValidObjectId } from "mongoose"


const createTweet = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user?._id)

    const { content } = req.body
    const imageLocalPath = req.file?.path

    if (!content.trim() && !imageLocalPath) {
        throw new ApiError(400, "Image or content is required field")
    }

    const image = await uploadOnCloudinary(imageLocalPath, "image")

    if (!image?.url) {
        throw new ApiError(500, "Any problem in image upload")
    }

    const createdTweet = await Tweet.create(
        {
            owner: user?._id,
            content,
            image: image.secure_url,
        }
    )

    if (!createdTweet) {
        throw new ApiError(500, "Internal problem when create tweet")
    }

    return res.status(200)
        .json(new ApiResponse(200, createdTweet, "successfully created tweet"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "UserID is invalide")
    }

    const allTweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
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
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes"
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false,
                    }
                },
                likes: {
                    $size: {$ifNull: ["$likes",[]]}
                }
            }
        },
        {
            $sort: {
                updatedAt: -1,
            }
        }
    ])

    return res.status(200)
        .json(new ApiResponse(200, allTweets, "Successfully fetched tweets"))
})

const getTweetById = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "tweet id is not valid")
    }

    const tweet = await Tweet.findById(tweetId)

    if (tweet) {
        return res.status(200)
            .json(new ApiResponse(200, tweet, "Successfully fetch tweet by id"))
    }
    else {
        throw new ApiError(500, "Tweet is not exist by this id")
    }
})

const updateTweets = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;
    const imageLocalPath = req.file?.path;
    const userId = req.user?._id;

    // Validate tweetId
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId");
    }

    // Validate content or image presence
    if (!content && !imageLocalPath) {
        throw new ApiError(400, "Content or image is required");
    }

    // Validate ownership
    const isOwnTweet = await Tweet.findOne({ _id: tweetId, owner: userId });
    if (!isOwnTweet) {
        throw new ApiError(403, "User does not own this tweet");
    }

    if (!imageLocalPath) {
        throw new ApiError(400, "image file is required")
    }

    const response = await removeOnCloudinary(isOwnTweet?.image);
    if (!response) {
        throw new ApiError(500, "Failed to delete the previous image");
    }

    const image = await uploadOnCloudinary(imageLocalPath, "image");
    if (!image) {
        throw new ApiError(500, "Failed to upload the new image");
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                image: image?.secure_url,
                content: content
            }
        }
    )

    if (!updatedTweet) {
        throw new ApiError(500, "Failed to update the tweet");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedTweet, "Successfully updated the tweet"));
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const userId = req.user?._id

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "tweetId is Invalid")
    }

    const tweetExist = await Tweet.findOne(
        {
            $and: [
                { owner: userId },
                { _id: tweetId }
            ]
        }
    )

    if (!tweetExist) {
        throw new ApiError(400, "Owner is not current user")
    }

    if (tweetExist?.image) {
        const response = await removeOnCloudinary(tweetExist.image);

        if (!response) {
            throw new ApiError(500, "Failed to delete the previous image");
        }
    }

    const result = await Tweet.findByIdAndDelete(tweetId)

    return res.status(200)
        .json(new ApiResponse(200, result, "Successfully deleted tweet"))
})

export { createTweet, getUserTweets, updateTweets, deleteTweet, getTweetById }