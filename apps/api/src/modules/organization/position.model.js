import mongoose from "mongoose";
import BaseSchema from "../../database/BaseSchema.js";

const positionSchema = new mongoose.Schema(
{
    company:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Company",
        required:true
    },

    sbu:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"SBU",
        required:true
    },

    department:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Department",
        required:true
    },

    designation:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Designation",
        required:true
    },

    title:{
        type:String,
        required:true
    },

    code:{
        type:String,
        uppercase:true
    },

    occupant:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Employee",
        default:null
    },

    reportsTo:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Position",
        default:null
    },

    isWorkflowNode:{
        type:Boolean,
        default:true
    },

    active:{
        type:Boolean,
        default:true
    },

    ...BaseSchema

},
{
timestamps:true
});

export default mongoose.model(
"Position",
positionSchema
);