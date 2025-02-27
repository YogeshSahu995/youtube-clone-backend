import { Comment } from "../models/comment.model.js"
import { asyncHandler, ApiError, ApiResponse } from "../utils/index.js"
import mongoose, { isValidObjectId } from "mongoose"

//manually pagination
const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const limit = parseInt(req.query?.limit || 10)
    const page = parseInt(req.query?.page || 1)

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video Id is invalid")
    }

    const aggregateOfComment = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
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
                            fullname: 1,
                            avatar: 1,
                            username: 1,
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes",
                pipeline: [
                    {
                        $project: {
                            likedBy: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $arrayElemAt: ["$owner", 0]
                },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                },
                likes: {
                    $size: "$likes"
                }
            }
        },
        {
            $project: {
                isLiked: 1,
                likes: 1,
                owner: 1,
                content: 1,
                createdAt: 1,
                updatedAt: 1,
            }
        },
        {
            $sort: {
                createdAt: -1,
                _id: 1,
            }
        },
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: limit
        }
    ])

    const totalComments = await Comment.countDocuments({ video: videoId })

    const paginatedComment = {
        docs: aggregateOfComment,
        totalDocs: totalComments,
        limit,
        page,
        totalPages: Math.ceil(totalComments / limit) //match.ceil roundoff to next higher integer
    }

    return res.status(200)
        .json(new ApiResponse(200, paginatedComment, "Successfully get all comments"))
})

const addComment = asyncHandler(async (req, res) => {
    const userId = req.user?._id // do not give _id
    const { videoId } = req.params
    const { content } = req.body

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video id is invalid")
    }

    const createdComment = await Comment.create({
        content,
        video: videoId,
        owner: userId,
    })

    if (!createdComment) {
        throw new ApiError(500, "Any Issue in commenting on video")
    }

    return res.status(200)
        .json(new ApiResponse(200, createdComment, "Successfully do comment on video"))
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { content } = req.body
    const userId = req.user?._id

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "comment Id is Invalid")
    }

    const comment = await Comment.findById(commentId)

    /*

    if(comment.owner !== userId){
        throw new ApiError(400, "Unauthorized request : current user is not owner of comment")
    }
        Why this not work properly?
    -> The issue here is that in JavaScript, even though two ObjectId instances may contain the same value, they are different instances of objects in memory.This means that comment.owner !== userId will evaluate as true because !== checks for strict inequality, which considers object references (memory addresses) rather than their values.

    */

    if (!comment.owner.equals(userId)) {
        throw new ApiError(400, "current user is not owner of comment")
    }

    if (!content) {
        throw new ApiError(400, "Content is required")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content
            }
        },
        {
            new: true,
        }
    )

    if (!updatedComment) {
        throw new ApiError(500, "Any Issue in updating a comment")
    }

    return res.status(200)
        .json(new ApiResponse(200, updatedComment, "Successfully update a comment"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const userId = req.user?._id
    // console.log(req.user?._id)  //new ObjectId('67a0610cae454f79090fba28')
    // console.log(req.user?.id)  //67a0610cae454f79090fba28

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "comment Id is Invalid")
    }

    const comment = await Comment.findById(commentId)

    if (!comment.owner.equals(userId)) {
        throw new ApiError(400, "current user is not owner of comment")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId)

    if (!deletedComment) {
        throw new ApiError(500, "Issue in delete a comment")
    }

    res.status(200)
        .json(new ApiResponse(200, deletedComment, "Successfully deleted a comment"))
})

export { getVideoComments, addComment, updateComment, deleteComment }