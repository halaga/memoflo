import mongoose from "mongoose";

const workflowInstanceSchema =
new mongoose.Schema({

memo:{
type:mongoose.Schema.Types.ObjectId,
ref:"Memo"
},

workflow:{
type:mongoose.Schema.Types.ObjectId,
ref:"Workflow"
},

currentStep:{
type:Number,
default:0
},

status:{
type:String,
default:"Pending"
}

},
{
timestamps:true
}
);

export default mongoose.model(
"WorkflowInstance",
workflowInstanceSchema
);