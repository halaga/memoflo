import Memo from "../memo/memo.model.js";
import MemoEventService from "./memoEvent.service.js";

class MemoEventController {
  async listForMemo(req, res, next) {
    try {
      const memo = await Memo.findOne({
        _id: req.params.memoId,
        company: req.user.company,
        isActive: true,
        deletedAt: null,
      }).select("_id");

      if (!memo) {
        const error = new Error("Memo not found");
        error.status = 404;
        throw error;
      }

      const events = await MemoEventService.list(
        req.user.company,
        memo._id
      );

      res.json({ success: true, data: events });
    } catch (error) {
      next(error);
    }
  }

  async listCompany(req, res, next) {
    try {
      const result = await MemoEventService.listCompanyEvents(
        req.user.company,
        req.query
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export default new MemoEventController();
