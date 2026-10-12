import mongoose from "mongoose";
import BaseSchema from "../../database/BaseSchema.js";
const inventorySchema=new mongoose.Schema({
 company:{type:mongoose.Schema.Types.ObjectId,ref:"Company",required:true,index:true},
 name:{type:String,required:true,trim:true}, category:{type:String,default:"General",trim:true}, itemCode:{type:String,trim:true,default:""}, serialNumber:{type:String,trim:true,default:""}, quantity:{type:Number,min:0,default:1}, availableQuantity:{type:Number,min:0,default:1}, unit:{type:String,default:"unit",trim:true}, status:{type:String,enum:["Available","Assigned","Low Stock","Damaged","Retired"],default:"Available"}, ownerDepartment:{type:mongoose.Schema.Types.ObjectId,ref:"Department",default:null}, custodian:{type:mongoose.Schema.Types.ObjectId,ref:"Employee",default:null}, location:{type:String,default:"",trim:true}, purchaseDate:{type:Date,default:null}, notes:{type:String,default:"",trim:true}, active:{type:Boolean,default:true}, ...BaseSchema
},{timestamps:true});
inventorySchema.index({company:1,name:1,category:1});
export default mongoose.model("InventoryItem",inventorySchema);
