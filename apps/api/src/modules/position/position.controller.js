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
    } catch (err) {
      next(err);
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
    } catch (err) {
      next(err);
    }
  }

  async show(req, res, next) {
    try {
      const position = await PositionService.getPosition(
        req.params.id
      );

      res.json({
        success: true,
        data: position,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const position = await PositionService.updatePosition(
        req.params.id,
        req.body
      );

      res.json({
        success: true,
        data: position,
      });
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      await PositionService.deletePosition(req.params.id);

      res.json({
        success: true,
        message: "Position deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  }
  
async assign(req, res, next) {
  try {
    const position = await PositionService.assignEmployee(
      req.params.id,
      req.body.employeeId
    );

    res.json({
      success: true,
      data: position,
    });
  } catch (err) {
    next(err);
  }
}

async vacate(req, res, next) {
  try {
    const position = await PositionService.vacatePosition(
      req.params.id
    );

    res.json({
      success: true,
      data: position,
    });
  } catch (err) {
    next(err);
  }
}

}

export default new PositionController();