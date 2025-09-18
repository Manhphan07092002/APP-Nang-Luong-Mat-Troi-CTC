// client/js/contact-form.js
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.querySelector('form[action="#"]');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;

            // Disable button and show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = `<span class="relative z-10 flex items-center justify-center"><i class="fas fa-spinner fa-spin mr-3"></i> Đang gửi...</span>`;

            const formData = {
                name: contactForm.querySelector('#name').value,
                email: contactForm.querySelector('#email').value,
                phone: contactForm.querySelector('#phone').value,
                message: contactForm.querySelector('#message').value,
            };

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                });

                const result = await response.json();

                if (response.ok) {
                    // Success
                    contactForm.reset();
                    alert(result.message); // Replace with a more elegant notification if you have one
                } else {
                    // Error from server
                    alert(`Lỗi: ${result.message}`);
                }
            } catch (error) {
                // Network or other errors
                console.error('Error submitting contact form:', error);
                alert('Đã có lỗi kết nối xảy ra. Vui lòng thử lại sau.');
            } finally {
                // Re-enable button and restore original text
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            }
        });
    }
});
