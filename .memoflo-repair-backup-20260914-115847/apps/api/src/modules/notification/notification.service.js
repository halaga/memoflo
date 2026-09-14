import Notification from "./notification.model.js";
class NotificationService {
  async list(companyId, employeeId) { return Notification.find({ company: companyId, recipient: employeeId, isActive: true }).sort({ createdAt: -1 }).limit(50); }
  async unreadCount(companyId, employeeId) { return Notification.countDocuments({ company: companyId, recipient: employeeId, readAt: null, isActive: true }); }
  async markRead(companyId, employeeId, id) { return Notification.findOneAndUpdate({ _id: id, company: companyId, recipient: employeeId, isActive: true }, { readAt: new Date() }, { new: true }); }
  async markAllRead(companyId, employeeId) { return Notification.updateMany({ company: companyId, recipient: employeeId, readAt: null, isActive: true }, { readAt: new Date() }); }
}
export default new NotificationService();
