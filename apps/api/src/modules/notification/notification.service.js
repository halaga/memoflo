import Notification from "./notification.model.js";

class NotificationService {
  async create({
    company,
    recipient,
    type = "system",
    title,
    message,
    link = "",
    data = {},
    createdBy = null,
  }) {
    if (!company || !recipient || !title || !message) {
      return null;
    }

    return Notification.create({
      company,
      recipient,
      type,
      title,
      message,
      link,
      data,
      createdBy,
    });
  }

  async list(companyId, employeeId) {
    return Notification.find({
      company: companyId,
      recipient: employeeId,
      isActive: true,
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
  }

  async unreadCount(companyId, employeeId) {
    return Notification.countDocuments({
      company: companyId,
      recipient: employeeId,
      readAt: null,
      isActive: true,
      deletedAt: null,
    });
  }

  async markRead(companyId, employeeId, id) {
    return Notification.findOneAndUpdate(
      {
        _id: id,
        company: companyId,
        recipient: employeeId,
        isActive: true,
        deletedAt: null,
      },
      {
        readAt: new Date(),
      },
      {
        new: true,
      }
    ).lean();
  }

  async markAllRead(companyId, employeeId) {
    return Notification.updateMany(
      {
        company: companyId,
        recipient: employeeId,
        readAt: null,
        isActive: true,
        deletedAt: null,
      },
      {
        readAt: new Date(),
      }
    );
  }
}

export default new NotificationService();
