import InventoryService from "./inventory.service.js";

class InventoryController {
  async list(req, res, next) {
    try {
      const data = await InventoryService.list(req.user.company, req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const data = await InventoryService.create(req.user.company, req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data = await InventoryService.update(req.user.company, req.params.id, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const data = await InventoryService.remove(req.user.company, req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export default new InventoryController();
