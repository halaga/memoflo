import mongoose from "mongoose";
import BaseSchema from "./BaseSchema.js";

const workflowStepSchema =
new mongoose.Schema({

workflow:{
type:mongoose.Schema.Types.ObjectId,
ref:"Workflow",
required:true
},

order:{
type:Number,
required:true
},

name:{
type:String,
required:true
},

role:{
type:mongoose.Schema.Types.ObjectId,
ref:"Role",
required:true
},

canApprove:{
type:Boolean,
default:true
},

canReject:{
type:Boolean,
default:true
},

canReturn:{
type:Boolean,
default:true
},

canComment:{
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
"WorkflowStep",
workflowStepSchema
);