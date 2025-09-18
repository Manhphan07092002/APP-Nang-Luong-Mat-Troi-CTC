const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Không có quyền truy cập. Yêu cầu quyền Admin.' });
    }
};

module.exports = { admin };