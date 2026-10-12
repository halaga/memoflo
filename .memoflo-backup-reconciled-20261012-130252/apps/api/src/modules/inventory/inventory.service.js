import InventoryItem from "./inventory.model.js";
import mongoose from "mongoose";
function fail(m,s=400){const e=new Error(m);e.status=s;throw e;}
function clean(data){const allowed=["name","category","itemCode","serialNumber","quantity","availableQuantity","unit","status","ownerDepartment","custodian","location","purchaseDate","notes"];return Object.fromEntries(Object.entries(data||{}).filter(([k])=>allowed.includes(k)));}
class InventoryService{
 async list(companyId,filters={}){const q={company:companyId,active:true,deletedAt:null};if(filters.ownerDepartment)q.ownerDepartment=filters.ownerDepartment;return InventoryItem.find(q).populate("ownerDepartment").populate("custodian","_id firstName lastName employeeNo").sort({category:1,name:1});}
 async create(companyId,data){if(!String(data.name||"").trim())fail("Inventory item name is required");return InventoryItem.create({...clean(data),company:companyId});}
 async update(companyId,id,data){if(!mongoose.isValidObjectId(id))fail("Inventory item id must be valid");const item=await InventoryItem.findOneAndUpdate({_id:id,company:companyId,active:true,deletedAt:null},clean(data),{new:true,runValidators:true}).populate("ownerDepartment").populate("custodian","_id firstName lastName employeeNo");if(!item)fail("Inventory item not found",404);return item;}
 async remove(companyId,id){const item=await InventoryItem.findOneAndUpdate({_id:id,company:companyId,active:true,deletedAt:null},{active:false,deletedAt:new Date(),status:"Retired"},{new:true});if(!item)fail("Inventory item not found",404);return item;}
}
export default new InventoryService();
