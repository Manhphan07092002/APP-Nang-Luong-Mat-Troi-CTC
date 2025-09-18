// server/controllers/contactController.js

/**
 * @desc    Handle contact form submission
 * @route   POST /api/contact
 * @access  Public
 */
const handleContactForm = async (req, res) => {
    const { name, email, phone, message } = req.body;

    // Basic validation
    if (!name || !email || !phone || !message) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin.' });
    }

    try {
        // In a real application, you would send an email here.
        // For this example, we'll just log the data to the console.
        console.log('New Contact Form Submission:');
        console.log(`  Name: ${name}`);
        console.log(`  Email: ${email}`);
        console.log(`  Phone: ${phone}`);
        console.log(`  Message: ${message}`);

        // You can integrate with an email service like Nodemailer or SendGrid here.

        res.status(200).json({ message: 'Yêu cầu của bạn đã được gửi thành công! Chúng tôi sẽ liên hệ lại sớm nhất có thể.' });

    } catch (error) {
        console.error('Error handling contact form:', error);
        res.status(500).json({ message: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.' });
    }
};

module.exports = { handleContactForm };
