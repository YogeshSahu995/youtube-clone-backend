import { Schema, model } from "mongoose";
import mongoosePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile: {
            type: String, //cloudinary url
            required: true
        },
        thumbnail: {
            type: String, //cloudinary url
            required: true
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        duration: {
            type: Number, // cloudinary 
            required: true
        },
        views:{
            type:[Schema.Types.ObjectId],
            ref: "User",
            default: []
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }

    },
    { timestamps: true }
)

videoSchema.plugin(mongoosePaginate)

export const Video = model("Video", videoSchema)