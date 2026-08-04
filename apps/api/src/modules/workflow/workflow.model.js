import mongoose from "mongoose";
import BaseSchema from "../../database/BaseSchema.js";
const workflowSchema =
new mongoose.Schema(
{
    company:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Company",
        required:true
    },

    name:{
        type:String,
        required:true
    },

    description:String,

    module:{
        type:String,
        default:"memo"
    },

    isActive:{
        type:Boolean,
        default:true
    },

    ...BaseSchema

},
{
timestamps:true
}
);

export default mongoose.model(
"Workflow",
workflowSchema
);