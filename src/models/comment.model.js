import { Schema, model } from "mongoose"
import mongoosePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
    {
        content: {
            type: String,
            required: true,
            trim: true,
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video"
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true,
    }
)

commentSchema.plugin(mongoosePaginate)

export const Comment = model("Comment", commentSchema)