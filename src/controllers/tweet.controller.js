import { ApiError, ApiResponse, asyncHandler, uploadOnCloudinary, removeOnCloudinary } from "../utils/index.js"
import { User } from "../models/user.model.js"
import { Tweet } from "../models/tweet.model.js"
import fs from "fs"
import mongoose, { isValidObjectId } from "mongoose"


const createTweet = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user?._id)

    const { content } = req.body
    const imageLocalPath = req.file?.path

    if(!content.trim() && !imageLocalPath) {
        throw new ApiError(400, "Image or content is required field")
    }

    const image = await uploadOnCloudinary(imageLocalPath, "image")

    if(!image?.url){
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
        throw new ApiError(400, "unauthorized request")
    }

    const user = await User.findById(userId)
    // console.log(user._id) //new ObjectId('672767ece080d6c5f2522c0b') same as from req.user._id or req.user.id
    // console.log(user.id) //672767ece080d6c5f2522c0b here importance of _id
    // console.log(userId)

    if (!user) {
        throw new ApiError(400, "Unauthorized request")
    }

    const allTweets = await Tweet.aggregate([
        {
            $match: {
                owner: user._id //new ObjectId('672767ece080d6c5f2522c0b') when user.id = 672767ece080d6c5f2522c0b If user._id is already an ObjectId (which it typically is when retrieved from Mongoose), you can use it directly in the $match stage without needing mongoose.Types.ObjectId(user._id).
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
                from : "likes",
                localField : "_id",
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
                        if: {$in: [req.user?._id, "$likes.likedBy"]},
                        then: true,
                        else: false,
                    }
                },
                likes: {
                    $size: "$likes"
                }
            }
        },
        {
            $sort:{
                updatedAt: -1,
            }
        }
    ])

    return res.status(200)
        .json(new ApiResponse(200, allTweets, "Successfully fetched tweets"))
})

const getTweetById = asyncHandler(async(req, res) => {
    const {tweetId} = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "tweet id is not valid")
    }

    const tweet = await Tweet.findById(tweetId)

    if(tweet){
        return res.status(200)
        .json(new ApiResponse(200, tweet, "Successfully fetch tweet by id"))
    }
    else{
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
    const validateOwner = await Tweet.findOne({ _id: tweetId, owner: userId });
    if (!validateOwner) {
        throw new ApiError(403, "User does not own this tweet");
    }

    let image;

    try {
        if (imageLocalPath) {
            // Remove the previous image from Cloudinary
            const prevTweet = await Tweet.findById(tweetId);
            if (prevTweet?.image) {
                const response = await removeOnCloudinary(prevTweet.image);
                if (!response) {
                    throw new ApiError(500, "Failed to delete the previous image");
                }
            }

            // Upload the new image to Cloudinary
            image = await uploadOnCloudinary(imageLocalPath, "image");
            if (!image) {
                throw new ApiError(500, "Failed to upload the new image");
            }
        }
    } finally {
        // Cleanup local file after Cloudinary operation
        if (imageLocalPath && fs.existsSync(imageLocalPath)) {
            try {
                await fs.unlinkSync(imageLocalPath);
            } catch (err) {
                console.error("Error deleting file:", err);
            }
        }
    }

    // Update the tweet
    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
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

export { createTweet, getUserTweets, updateTweets, deleteTweet, getTweetById }