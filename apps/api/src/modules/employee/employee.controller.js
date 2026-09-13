import EmployeeService from "./employee.service.js";

class EmployeeController {
  async create(req,res,next){try{const employee=await EmployeeService.createEmployee(req.user.company,req.body);res.status(201).json({success:true,data:employee});}catch(err){next(err);}}
  async list(req,res,next){try{const employees=await EmployeeService.listEmployees(req.user.company);res.json({success:true,data:employees});}catch(err){next(err);}}
  async show(req,res,next){try{const employee=await EmployeeService.getEmployee(req.params.id,req.user.company);res.json({success:true,data:employee});}catch(err){next(err);}}
  async update(req,res,next){try{const employee=await EmployeeService.updateEmployee(req.params.id,req.user.company,req.body);res.json({success:true,data:employee});}catch(err){next(err);}}
  async remove(req,res,next){try{const employee=await EmployeeService.deleteEmployee(req.params.id,req.user.company);res.json({success:true,data:employee});}catch(err){next(err);}}
}
export default new EmployeeController();
