import PositionService from "./position.service.js";

class PositionController {
  async create(req, res, next) {
    try {
      const position = await PositionService.createPosition(
        req.user.company,
        req.body
      );

      res.status(201).json({
        success: true,
        data: position,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const positions = await PositionService.listPositions(
        req.user.company
      );

      res.json({
        success: true,
        data: positions,
      });
    } catch (error) {
      next(error);
    }
  }

  async show(req, res, next) {
    try {
      const position = await PositionService.getPosition(
        req.params.id,
        req.user.company
      );

      res.json({
        success: true,
        data: position,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const position = await PositionService.updatePosition(
        req.params.id,
        req.user.company,
        req.body
      );

      res.json({
        success: true,
        data: position,
      });
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const position = await PositionService.deletePosition(
        req.params.id,
        req.user.company
      );

      res.json({
        success: true,
        data: position,
      });
    } catch (error) {
      next(error);
    }
  }

  async assign(req, res, next) {
    try {
      const position = await PositionService.assignEmployee(
        req.params.id,
        req.body.employeeId,
        req.user.company
      );

      res.json({
        success: true,
        data: position,
      });
    } catch (error) {
      next(error);
    }
  }

  async vacate(req, res, next) {
    try {
      const position = await PositionService.vacatePosition(
        req.params.id,
        req.user.company
      );

      res.json({
        success: true,
        data: position,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PositionController();
