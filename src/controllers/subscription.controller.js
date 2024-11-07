import {Subscription} from "../models/subscription.model.js"
import {User} from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

const toggleSubscription = asyncHandler(async(req, res) => {
    const {channelname} = req.params
    const currUser = await User.findById(req.user?._id)
    
    if(currUser){
        throw new ApiError(400, "User is not login")
    }


    if(!channelname?.trim()){
        throw new ApiError(400, "channel name is missing")
    }

    const channel = await User.find({username: channelname})

    const alreadySubscribed = await Subscription.find({
        $and: [
            {channel: channel._id}, 
            {subscriber: currUser._id}
        ] 
    })

    if(alreadySubscribed){
        const result = await Subscription.findByIdAndDelete(alreadySubscribed?._id)
        return res.status(200)
        .json(new ApiResponse(200, result, "Successfully unsubscribe to channel"))
    }

    const newSubscriber = await Subscription.create({
        subscriber: currUser?._id,
        channel: channel?._id
    })

    if(!newSubscriber){
        throw new ApiError(500, "Any problem in subscribing the channel")
    }

    return res.status(200)
    .json(new ApiResponse(200, newSubscriber, "Successfully subscribe the channel"))
})

export {toggleSubscription}