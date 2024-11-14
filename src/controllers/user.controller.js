import { asyncHandler, ApiError, ApiResponse, uploadOnCloudinary, removeOnCloudinary } from "../utils/index.js"
import { User } from "../models/user.model.js"
import mongoose from 'mongoose'
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false }) //required field is kicked when user.save() simply use
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, username, password } = req.body
    console.log(req.files)

    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are compailsory and required")
    }

    const existedUser = await User.findOne({
        $or: [{ email: email }, { username: username }]
    })


    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar Image is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    // when coverImageLocalPath is undefined so cloudinary never throw error

    if (!avatar) {
        throw new ApiError(400, "avatar Image is required")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {

    const { email, username, password } = req.body

    if (!(username || email)) {
        throw new ApiError(400, "username or email is required")
    }
    const userDetails = await User.findOne({ $or: [{ username }, { email }] })

    if (!userDetails) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await userDetails.isPasswordCorrect(password) // method is apply by document not by mongodb

    if (!isPasswordValid) {
        throw new ApiError(401, "Password is incorrect")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(userDetails._id) // this method is returned

    //push cookie to user
    //here userDetails is not update when generateAccessAndRefreahToken() is call so again db querie run

    const user = await User.findById(userDetails._id).select("-password -refreshToken")


    // cookie was modiefied by frontend so secure region and modified by only server:- options
    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user, accessToken, refreshToken }, "user Logged In Successfully"))
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true,
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged Out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request!!")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET) // {user info...}

        const user = await User.findById(decodedToken?._id).select("-password")

        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or user")
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

        const options = {
            httpOnly: true,
            secure: true
        }

        res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200, { refreshToken }, "Access Token successfully refreshed"))
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh Token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "old password is Invalid")
    }

    if (newPassword !== confirmPassword) {
        throw new ApiError(400, "confirm Password is incorrect")
    }

    user.password = newPassword,

        await user.save({ validateBeforeSave: false })

    return res.status(200)
        .json(new ApiResponse(200, {}, "Password Changed successfully"))

})

const getCurrenctUser = asyncHandler(async (req, res) => {
    return res.status(200)
        .json(new ApiResponse(200, req.user, "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body

    if (!fullname || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?.id,
        {
            $set: {
                fullname,
                email
            }
        },
        { new: true } //return after update
    ).select("-password")

    return res.status(200)
        .json(new ApiResponse(200, user, "Successfully update user details"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id).select("-password -refreshToken")

    // remove prev image 
    if (req.file?.path) {
        const prevImageUrl = user?.avatar
        const result = await removeOnCloudinary(prevImageUrl)
        if (!result) {
            throw new ApiError(500, "Issue in removing image")
        }
    }


    //add another image
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new ApiError(500, "Error while uploading on avatar")
    }
    user.avatar = avatar.url
    await user.save({ validateBeforeSave: false })

    return res.status(200)
        .json(new ApiResponse(200, user, "succesfully changed avatar"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id).select("-password -refreshToken")

    // remove prev image 
    if (req.file?.path) {
        const prevImageUrl = user?.coverImage
        const result = await removeOnCloudinary(prevImageUrl)
        if (!result) {
            throw new ApiError(500, "Issue in removing image")
        }
    }

    //add another image
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage.url) {
        throw new ApiError(500, "Error while uploading on coverImage")
    }
    user.coverImage = coverImage.url
    await user.save({ validateBeforeSave: false })

    return res.status(200)
        .json(new ApiResponse(200, user, "succesfully changed coverImage"))
})

//most imp controller
const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params //search name
    // const username = req.params.username

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: { // duser collection ke document se match karega 
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers" // it's return [{channel:"same", subscriber:""}, {}]
            }
        },
        {
            $lookup: { // this array for hum kitne channels ke subscriber hai 
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers" //$ use becoz it's field
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },//Yes, exactly! In MongoDB's aggregation framework, you can access fields in nested arrays and objects directly using dot notation without needing to explicitly loop through the array. This feature is part of how MongoDB allows you to work with complex data structures efficiently.
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: { //select field pass
                fullname: 1,
                username: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exists")
    }

    return res.status(200)
        .json(new ApiResponse(200, channel[0], "User channel fetched successfully"))
})

const getWatchHistory = asyncHandler(async (req, res) => {
    // req.user._id // Interview :- ye string hi pass kerta hai mongodb objectId nhi kerta jab hum koi query use kerte hai to mongoose behind the seen string ko as ObjectId use kerta hai
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id) //but yha per mongoose kaam nhi kerta (manually)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [ // when fetched the document of video also run $lookup for owner field 
                    {
                        $lookup: {
                            from: "users", //// Join with users collection for video owner details
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [ //when fetched the document with also run $project for specific field of user was store in owner field
                                {
                                    $project: {
                                        avatar: 1,
                                        username: 1,
                                        id: 1
                                    }
                                }
                            ]
                        } //owner: [{owner..}]
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    //AGGREGATE A

    return res.status(200)
        .json(new ApiResponse(200, user[0].watchHistory, "watch history fetched successfully"))
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrenctUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}

/*
what work of refreshToken and accessToken
During login we generate 2 token that is Access and Refresh Token
refresh token was saved in database
access and refresh token cookie set in chrome
accessToken is shortime and refreshToken is longtime
when user access-token is expired so, touch the endpoint which give req.cookies.refreshToken
then decode the token get id of user then by module findById
and compare the refresh token then generateAccessAndRefreshToken 
Then set by res.cookie("accessToken")
*/

