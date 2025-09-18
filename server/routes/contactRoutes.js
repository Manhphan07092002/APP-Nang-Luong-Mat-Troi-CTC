// server/routes/contactRoutes.js
const express = require('express');
const router = express.Router();
const { handleContactForm } = require('../controllers/contactController');

// @route   POST /api/contact
// @desc    Submit contact form
// @access  Public
router.post('/', handleContactForm);

module.exports = router;
