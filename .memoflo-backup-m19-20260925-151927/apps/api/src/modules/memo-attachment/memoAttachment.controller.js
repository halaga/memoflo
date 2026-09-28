import MemoAttachmentService from "./memoAttachment.service.js";

class MemoAttachmentController {
  async list(req, res, next) {
    try { res.json({ success: true, data: await MemoAttachmentService.list(req.user.company, req.params.memoId) }); } catch (error) { next(error); }
  }

  async upload(req, res, next) {
    try { res.status(201).json({ success: true, data: await MemoAttachmentService.add({ company: req.user.company, memoId: req.params.memoId, employeeId: req.user.id, file: req.file }) }); } catch (error) { next(error); }
  }

  async download(req, res, next) {
    try {
      const { attachment, absolutePath } = await MemoAttachmentService.getFile(req.user.company, req.params.memoId, req.params.attachmentId);
      res.download(absolutePath, attachment.originalName);
    } catch (error) { next(error); }
  }

  async remove(req, res, next) {
    try { res.json({ success: true, data: await MemoAttachmentService.remove(req.user.company, req.params.memoId, req.params.attachmentId, req.user.id) }); } catch (error) { next(error); }
  }
}

export default new MemoAttachmentController();
