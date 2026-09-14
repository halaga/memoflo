import NotificationService from "./notification.service.js";

class NotificationController {
  async list(req, res, next) {
    try {
      const [data, unreadCount] = await Promise.all([
        NotificationService.list(req.user.company, req.user.id),
        NotificationService.unreadCount(req.user.company, req.user.id),
      ]);

      res.json({
        success: true,
        data,
        unreadCount,
      });
    } catch (error) {
      next(error);
    }
  }

  async read(req, res, next) {
    try {
      const notification = await NotificationService.markRead(
        req.user.company,
        req.user.id,
        req.params.id
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      res.json({
        success: true,
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  }

  async readAll(req, res, next) {
    try {
      const result = await NotificationService.markAllRead(
        req.user.company,
        req.user.id
      );

      res.json({
        success: true,
        data: {
          modifiedCount: result.modifiedCount || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();
