import InventoryService from "./inventory.service.js";
class InventoryController{
 async list(req,res,next){try{res.json({success:true,data:await InventoryService.list(req.user.company,req.query)});}catch(e){next(e);}}
 async create(req,res,next){try{res.status(201).json({success:true,data:await InventoryService.create(req.user.company,req.body)});}catch(e){next(e);}}
 async update(req,res,next){try{res.json({success:true,data:await InventoryService.update(req.user.company,req.params.id,req.body)});}catch(e){next(e);}}
 async remove(req,res,next){try{res.json({success:true,data:await InventoryService.remove(req.user.company,req.params.id)});}catch(e){next(e);}}
}
export default new InventoryController();
