import {Schema, model} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema({
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    username: {
        type: String,
        unique: true,
        lowercase: true,
        required: true,
        trim: true,
        index: true //optimize for searching..
    },
    email: {
        type: String,
        unique: true,
        lowercase: true,
        required: true,
        trim: true,
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String, // cloudinary url
        required: true,
    },
    coverImage: {
        type: String,// cloudinary url
        default: null,
    },
    password: {
        type: String,
        required:[true, "password is required"]
    },
    refreshToken: {
        type: String
    }

}, {timestamps: true})

// .pre("save") middleware(also hook) use to hash passwords, which is prefect for ensuring that passwords are never stored in plain text
userSchema.pre("save", async function( next ) {
    if(!this.isModified("password")) return next() //jab password modified nhi hoga to next() hoga

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

//isPasswordCorrect is good way to compare a password during authentication

// this method is not access by User it's access by document which is in db
userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password, this.password) // return true or false
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(    
        {
            _id: this._id, //Payload
            email: this.email,
            username: this.username,
            fullname: this.fullname 
        },
        process.env.ACCESS_TOKEN_SECRET,// Secret key :- it"s used to sign JWT so the server can later varify the token
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY //token expire
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id, //payload
        },
        process.env.REFRESH_TOKEN_SECRET,// Secret key
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY //token expire
        }
    )
}

export const User = model("User", userSchema)
/*

when user login, server makes JWT then JWT store in user brower(local-storage) 
then user give req() to server server do JWT verification
always server can decode the JWT and access information to check(ex- userID, expiry time)

Why use JWT?
Stateless: JWT का उपयोग इसलिए होता है ताकि सर्वर को यूजर की authentication details स्टोर न करनी पड़े। सर्वर बस JWT को validate करता है। 

कभी-कभी Refresh Token स्टोर किया जाता है:
हालांकि, Refresh tokens को सर्वर पर स्टोर किया जा सकता है। ये long-term authentication के लिए होते हैं, और ये database में या किसी secure storage में स्टोर हो सकते हैं ताकि जब access token expire हो जाए, तो नया access token दिया जा सके।

*/