import mongoose from "mongoose";
import BaseSchema from "../../database/BaseSchema.js";
const schema = new mongoose.Schema({
 company:{type:mongoose.Schema.Types.ObjectId,ref:"Company",required:true,index:true},
 title:{type:String,required:true,trim:true,maxlength:160},
 body:{type:String,required:true,trim:true,maxlength:8000},
 link:{type:String,trim:true,default:"",maxlength:500},
 status:{type:String,enum:["Draft","Published","Archived"],default:"Draft",index:true},
 publishedAt:{type:Date,default:null,index:true},
 expiresAt:{type:Date,default:null,index:true},
 author:{type:mongoose.Schema.Types.ObjectId,ref:"Employee",required:true},
 ...BaseSchema
},{timestamps:true});
schema.index({company:1,status:1,publishedAt:-1});
export default mongoose.model("Announcement",schema);
