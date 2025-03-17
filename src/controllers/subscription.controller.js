import mongoose, { isValidObjectId } from "mongoose"
import { Subscription } from "../models/subscription.model.js"
import { User } from "../models/user.model.js"
import { ApiError, ApiResponse, asyncHandler } from "../utils/index.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params // in params - anthor user

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Channel Id is invailid")
    }

    const currUserId = req.user?._id

    const channel = await User.findById(channelId)

    const alreadySubscribed = await Subscription.findOne({
        $and: [
            { channel: channel?._id },
            { subscriber: currUserId }
        ]
    })

    if (alreadySubscribed) { 
        const result = await Subscription.findByIdAndDelete(alreadySubscribed?._id)

        if (!result) {
            throw new ApiError(500, "Any problem in unsubscribe the channel")
        }

        return res.status(200)
            .json(new ApiResponse(200, { isSubscribed: false }, "Successfully unsubscribe to channel"))
    }

    const newSubscriber = await Subscription.create({
        subscriber: currUserId,
        channel: channel?._id
    })

    if (!newSubscriber) {
        throw new ApiError(500, "Any problem in subscribing the channel")
    }

    return res.status(200)
        .json(new ApiResponse(200, { isSubscribed: true }, "Successfully subscribe the channel"))
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Please give valid id of channel")
    }

    const channel = await User.findById(channelId)

    if (!channel) {
        throw new ApiError(400, "This id based channel not exist")
    }

    const allSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: channel?._id,
            }
        },
        {
            $project: {
                subscriber: 1,
            }
        },
        //$lookup: Joins with the users collection to fetch subscriber details, storing the results in the subscriber array.
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers",
                pipeline: [
                    {
                        $project: {
                            avatar: 1,
                            username: 1,
                            email: 1
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200)
        .json(new ApiResponse(200, allSubscribers, "Successfully all subscribers are fetched"))
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid User Id for access Subscribed channels")
    }

    try {
        const subscribedChannels = await Subscription.aggregate([
            {
                $match: {
                    subscriber: new mongoose.Types.ObjectId(subscriberId)
                }
            },
            {
                $project: {
                    channel: 1,
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "channel",
                    foreignField: "_id",
                    as: "channel",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                fullname: 1,
                                avatar: 1,
                                email: 1,
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    channel: {
                        $first: "$channel"
                    }
                }
            }
        ])

        return res.status(200)
            .json(new ApiResponse(200, subscribedChannels, "Successfully fetched all subscribed channels"))
    } catch (error) {
        throw new ApiError(500, error.message)
    }

})

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels }