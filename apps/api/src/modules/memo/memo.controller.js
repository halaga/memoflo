import MemoService from "./memo.service.js";

class MemoController {
  async create(req, res, next) {
    try {
      const payload = {
        ...req.body,
        company: req.user.company,
        createdBy: req.user.id,
        requestingSbu:
          req.body.requestingSbu ||
          req.body.requestingSBU,
        beneficiarySBU:
          req.body.beneficiarySBU ||
          req.body.beneficiarySbu ||
          null,
      };

      const memo = await MemoService.createMemo(payload);

      res.status(201).json({
        success: true,
        data: memo,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const memos = await MemoService.listMemos(req.user.company);

      res.json({
        success: true,
        data: memos,
      });
    } catch (error) {
      next(error);
    }
  }

  async show(req, res, next) {
    try {
      const memo = await MemoService.getMemo(
        req.params.id,
        req.user.company
      );

      res.json({
        success: true,
        data: memo,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const memo = await MemoService.updateMemo(
        req.params.id,
        req.user.company,
        req.body,
        req.user.id
      );

      res.json({
        success: true,
        data: memo,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new MemoController();
