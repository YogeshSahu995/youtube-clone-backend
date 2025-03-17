import { ApiError, ApiResponse, asyncHandler, uploadOnCloudinary, removeOnCloudinary } from "../utils/index.js"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import mongoose, { isValidObjectId } from "mongoose"

const getVideosByTitle = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "des" } = req.query;

    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.max(1, parseInt(limit));

    const pipeline = [
        {
            $match: {
                ...(query ? { title: { $regex: query, $options: 'i' } } : {})
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
                            avatar: 1,
                            username: 1,
                            email: 1,
                            fullname: 1
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
                description: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                owner: 1,
                createdAt: 1,
                updatedAt: 1,
            }
        },
        {
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        }
    ];


    const options = {
        page: pageNumber,
        limit: limitNumber
    };

    const allVideos = await Video.aggregatePaginate(pipeline, options);

    if (allVideos) {
        return res.status(200).json(
            new ApiResponse(200, allVideos, "All Videos fetched by title")
        );
    }


    return res.status(500).json(
        new ApiResponse(500, allVideos, "Error fetching videos", error.message)
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "views", sortType = "asc" } = req.query;

    if (!isValidObjectId(query)) {
        throw new ApiError(400, "userId is not valid id")
    }

    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.max(1, parseInt(limit));

    const pipeline = [
        {
            $match: {
                owner: new mongoose.Types.ObjectId(query)
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
                            avatar: 1,
                            username: 1,
                            email: 1,
                            fullname: 1
                        }
                    }
                ]
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
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comment"
            }
        },
        {
            $addFields: {
                likes: {
                    $size:{$ifNull: ["$like", []]}
                },
                views: {
                    $size: {$ifNull: ["$views", []]}
                },
                comments: {
                    $size: {$ifNull: ["$comment", []]}
                },
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $project: {
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                likes: 1,
                comments: 1,
                isPublished: 1,
                owner: 1,
                createdAt: 1,
                updatedAt: 1,
            }
        },
        {
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1,
                _id: 1, // agar field uniform hai, _id ensure karega ki documents unique aur repeat na ho
            }
        }
    ];


    // Use aggregatePaginate for pagination
    const options = {
        page: pageNumber,
        limit: limitNumber
    };

    try {
        const allVideos = await Video.aggregatePaginate(Video.aggregate(pipeline), options);

        return res.status(200).json(
            new ApiResponse(200, allVideos, "All Videos fetched by userId")
        );
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(500, null, "Error fetching videos", error.message)
        );
    }

})

const getSeachVideosOfChannel = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;

    if (userId && !isValidObjectId(userId)) {
        throw new ApiError(400, "User ID is invalid");
    }

    const pipeline = [
        {
            $match: {
                ...(userId ? { owner: new mongoose.Types.ObjectId(userId) } : {}),
                ...(query ? { title: { $regex: query, $options: "i" } } : {})
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
                            avatar: 1,
                            username: 1,
                            email: 1,
                            fullname: 1
                        }
                    }
                ]
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
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comment"
            }
        },
        {
            $addFields: {
                likes: { $size: {$ifNull: ["$like",[]]} },
                comments: { $size: {$ifNull: ["$comment",[]]}},
                views: { $size:{$ifNull: ["$views", []]}},
                owner: { $first: "$owner" }
            }
        },
        {
            $project: {
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                likes: 1,
                comments: 1,
                isPublished: 1,
                owner: 1,
                createdAt: 1,
                updatedAt: 1
            }
        },
        {
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        }
    ];

    const options = {
        page: Math.max(1, parseInt(page)),
        limit: Math.max(1, parseInt(limit))
    };

    try {
        const allVideos = await Video.aggregatePaginate(Video.aggregate(pipeline), options);

        if (allVideos.docs.length === 0) {
            return res.status(200).json(new ApiResponse(200, null, "No videos found"));
        }

        return res.status(200).json(new ApiResponse(200, allVideos, "All videos fetched successfully"));
    } catch (error) {
        throw new ApiError(500, `Error fetching videos ${error.message} `)
    }
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, isPublished } = req.body
    const fileLocalPath = req.files?.thumbnail[0]?.path
    const videoLocalPath = req.files?.videoFile[0]?.path
    const userID = req.user?._id


    if (!(title && description)) {
        throw new ApiError(400, "Title and Description is required fields")
    }

    if (!fileLocalPath) {
        throw new ApiError(400, "thumbnail image is required")
    }

    if (!videoLocalPath) {
        throw new ApiError(400, "Video is required")
    }

    const thumbnail = await uploadOnCloudinary(fileLocalPath, "image")
    const video = await uploadOnCloudinary(videoLocalPath, "video")

    if (!(thumbnail && video)) {
        throw new ApiError(400, "thumbnail and video is required")
    }

    const publishedVideo = await Video.create(
        {
            thumbnail: thumbnail?.secure_url,
            videoFile: video?.secure_url,
            title,
            description,
            duration: video.duration,
            owner: userID,
            isPublished,
        }
    )

    if (!publishedVideo) {
        throw new ApiError(500, "Any Problem in Uploading video info")
    }

    return res.status(200)
        .json(new ApiResponse(200, publishedVideo, "SuccessFully upload a video"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "videoId is invalide")
    }

    const video = await Video.aggregate([
        {
            $match: {
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
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: {
                                $size: {$ifNull: ["$subscribers",[]]}
                            },
                            isSubscribed: {
                                $cond: {
                                    if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                                    then: true,
                                    else: false
                                }
                            },
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            fullname: 1,
                            username: 1,
                            avatar: 1,
                            isSubscribed: 1,
                            subscribersCount: 1,
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                likes: {
                    $size: {$ifNull: ["$likes", []]}
                },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $addFields: {
                views: { $size: {$ifNull: ["$views", []]} }
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
                comments: { $size: {$ifNull: ["$comment", []]} }
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $project: {
                thumbnail: 1,
                videoFile: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                likes: 1,
                isLiked: 1,
                comments: 1,
                isPublished: 1,
                owner: 1,
                createdAt: 1,
                updatedAt: 1,
            }
        },
    ])


    if (!video?.length) {
        throw new ApiError(404, "Video is not exist")
    }

    return res.status(200)
        .json(new ApiResponse(200, video[0], "Successfully get a video"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description, isPublished } = req.body
    const thumbnailLocalPath = req.file?.path

    if (!isValidObjectId(videoId)) {
        throw new ApiError("Video Id is Invalid")
    }

    if (!(title && description)) {
        throw new ApiError("title or description is required")
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required")
    }

    const getVideo = await Video.findById(videoId)

    if (req.file?.path) {
        const result = await removeOnCloudinary(getVideo.thumbnail)

        if (!result) {
            throw new ApiError(500, "Issue in removing a previous video")
        }
    }


    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath, "image")

    if (!thumbnail?.url) {
        throw new ApiError(500, "Issue in uploading video")
    }

    const updatedThumbnail = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                thumbnail: thumbnail?.secure_url,
                title: title,
                description: description,
                isPublished: isPublished,
            },
        },
        { new: true }
    )

    if (!updatedThumbnail) {
        throw new ApiError("video document is not exist")
    }

    return res.status(200)
        .json(new ApiResponse(200, updatedThumbnail, "Successfully update a video"))
})

//kuch kerna hai
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video Id is invalid")
    }

    const result = await Video.findByIdAndDelete(videoId)

    removeOnCloudinary(result.videoFile, "video")
    removeOnCloudinary(result.thumbnail)

    if (!result) {
        throw new ApiError(500, "Internal issue in deleting video")
    }

    return res.status(200)
        .json(new ApiResponse(200, result, "Successfully delete video"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video id is Invalid")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(400, "Video is not exist")
    }

    video.isPublished = !video.isPublished
    await video.save({ vaildateBeforeSave: false })

    return res.status(200)
        .json(new ApiResponse(200, video, "successfully toggled!"))
})

const handleVideoViews = asyncHandler(async (req, res) => {
    const { videoId, userId } = req.params;

    // Validate ObjectIds
    if (!mongoose.isValidObjectId(videoId)) {
        return res.status(400).json({ message: "Invalid videoId" });
    }
    if (!mongoose.isValidObjectId(userId)) {
        return res.status(400).json({ message: "Invalid userId" });
    }

    // Ensure the video exists
    const video = await Video.findById(videoId);
    if (!video.views) video.views = []
    if (!video) {
        throw new ApiError(404, "Video is not found");
    }

    // Add userId to views if not already present
    if (!video?.views?.includes(userId)) {
        video.views.push(userId);
        await video.save();
    }
    else {
        return
    }

    return res.status(200).json(new ApiResponse(200, video, "Successful"));
});

const addVideoInHistory = asyncHandler(async (req, res) => {
    const userId = req.user?._id
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "VideoId is invalid")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(400, "Videos is not exist")
    }

    await User.findByIdAndUpdate(
        userId,
        {
            $pull: {
                watchHistory: videoId // Remove videoId if it exists
            }
        },
        { new: true }
    );

    const updatedHistory = await User.findByIdAndUpdate(
        userId,
        {
            $push: {
                watchHistory: {
                    $each:[new mongoose.Types.ObjectId(videoId)],
                    $position: 0
                }
            }
        },
        { new: true }
    );

    return res.status(200).json({
        status: 200,
        message: "Watch history updated successfully",
        data: updatedHistory,
    });

})


export {
    publishAVideo,
    getVideosByTitle,
    getChannelVideos,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getSeachVideosOfChannel,
    addVideoInHistory,
    handleVideoViews,
}