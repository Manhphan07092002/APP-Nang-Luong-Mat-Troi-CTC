// File: server/controllers/reportController.js

const Report = require('../models/reportModel');
const Stats = require('../models/statsModel');

// ... (các hàm createReport và getAllReports giữ nguyên) ...
exports.createReport = async (req, res) => {
    try {
        const reportToSave = new Report({ ...req.body, user: req.user._id });
        const savedReport = await reportToSave.save();
        await Stats.increment('analysesCreated');
        res.status(201).json(savedReport);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi tạo báo cáo.', error: error.message });
    }
};

exports.getAllReports = async (req, res) => {
    try {
        const query = req.user.role === 'admin' ? {} : { user: req.user._id };
        const reports = await Report.find(query).populate('user', 'name email').sort({ createdAt: -1 });
        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách báo cáo.' });
    }
};

/**
 * @desc    Lấy dữ liệu báo cáo theo shareId (JSON API)
 * @route   GET /api/reports/share/:shareId
 * @access  Public
 */
exports.getReportByShareId = async (req, res) => {
    try {
        const report = await Report.findOne({ shareId: req.params.shareId }).populate('user', 'name email');
        if (!report) {
            return res.status(404).json({ message: 'Báo cáo không tồn tại hoặc đã bị xóa.' });
        }
        res.status(200).json(report);
    } catch (error) {
        console.error('LỖI KHI LẤY BÁO CÁO:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy báo cáo.' });
    }
};

/**
 * @desc    Xóa báo cáo
 * @route   DELETE /api/reports/:id
 * @access  Private (User can delete own reports, Admin can delete any)
 */
exports.deleteReport = async (req, res) => {
    try {
        const reportId = req.params.id;
        
        // Find the report
        const report = await Report.findById(reportId);
        if (!report) {
            return res.status(404).json({ message: 'Báo cáo không tồn tại.' });
        }
        
        // Check permissions: user can delete own reports, admin can delete any
        if (req.user.role !== 'admin' && report.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Bạn không có quyền xóa báo cáo này.' });
        }
        
        // Delete the report
        await Report.findByIdAndDelete(reportId);
        
        res.status(200).json({ message: 'Xóa báo cáo thành công.' });
    } catch (error) {
        console.error('LỖI KHI XÓA BÁO CÁO:', error);
        res.status(500).json({ message: 'Lỗi server khi xóa báo cáo.', error: error.message });
    }
};

/**
 * @desc    Lấy dữ liệu và RENDER trang báo cáo chi tiết phía server
 * @route   GET /reports/view/:shareId
 * @access  Public
 */
exports.renderSharedReport = async (req, res) => {
    try {
        const report = await Report.findOne({ shareId: req.params.shareId }).populate('user', 'name');
        if (!report) {
            // Nếu không tìm thấy báo cáo, render trang 404.ejs
            return res.status(404).render('404');
        }
        // Nếu tìm thấy, render file 'sharedReport.ejs' và truyền dữ liệu 'report' vào
        res.render('sharedReport', { report });
    } catch (error) {
        console.error('LỖI KHI RENDER BÁO CÁO:', error);
        res.status(500).render('404'); // Render trang lỗi chung
    }
};