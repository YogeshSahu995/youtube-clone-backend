import { Schema, model } from "mongoose";

const subscriptionSchema = new Schema(
    {
        subscriber: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        channel: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    }, 
    {
        timestamps: true
    }
)

export const Subscription = model("Subscription", subscriptionSchema)

/*
jo bhi subscribe krega tab ke naya document banega jisme subscriber or channel dono save honge
jab kissi channel ke subscriber count kerne ho to channel ko count kernge
or user ne kitne channel ko subscribe kiya hai by subsciber se search keri
by - MONGODB AGGREGATION PIPELINES
*/