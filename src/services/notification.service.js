const nodemailer = require('nodemailer');
const config = require('../config');

/**
 * Mail Transporter
 */
const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
        user: config.email.user,
        pass: config.email.pass,
    },
});

/**
 * Send an email confirmation to the client.
 */
async function sendAppointmentConfirmation(appointment, client, therapist) {
    const therapistName = `${therapist.first_name || 'Dr. Osatohanmwen'} ${therapist.last_name || 'Iredia'}`.trim();
    const date = new Date(appointment.start_time).toLocaleDateString();
    const time = new Date(appointment.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const mailOptions = {
        from: config.email.from,
        to: client.email,
        subject: 'Appointment Confirmation – Futurology Global Therapists',
        text: `Hello ${client.first_name},

Your therapy session with Futurology Global Therapists has been successfully scheduled.

Session Details
Therapist: ${therapistName}
Service: ${appointment.session_type || 'Therapy Session'}
Date: ${date}
Time: ${time}

If you need to reschedule or cancel your appointment, please contact us in advance.

We look forward to supporting you on your healing journey.`,
        html: `
            <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                <h2>Hello ${client.first_name},</h2>
                <p>Your therapy session with <strong>Futurology Global Therapists</strong> has been successfully scheduled.</p>
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Session Details</h3>
                    <p><strong>Therapist:</strong> ${therapistName}</p>
                    <p><strong>Service:</strong> ${appointment.session_type || 'Therapy Session'}</p>
                    <p><strong>Date:</strong> ${date}</p>
                    <p><strong>Time:</strong> ${time}</p>
                </div>
                <p>If you need to reschedule or cancel your appointment, please contact us in advance.</p>
                <p>We look forward to supporting you on your healing journey.</p>
            </div>
        `
    };

    return sendEmail(mailOptions);
}

/**
 * Send a notification email to the therapist.
 */
async function sendTherapistNotification(appointment, client, therapist) {
    const date = new Date(appointment.start_time).toLocaleDateString();
    const time = new Date(appointment.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const mailOptions = {
        from: config.email.from,
        to: therapist.email,
        subject: 'New Appointment Booked',
        text: `New Appointment Booked

Client Details:
Name: ${client.first_name} ${client.last_name}
Email: ${client.email}
Phone: ${client.phone || 'N/A'}

Appointment Details:
Service: ${appointment.session_type || 'Therapy Session'}
Date: ${date}
Time: ${time}
Message: ${appointment.notes || 'No message provided'}`,
        html: `
            <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                <h2>New Appointment Booked</h2>
                <h3>Client Details</h3>
                <ul>
                    <li><strong>Name:</strong> ${client.first_name} ${client.last_name}</li>
                    <li><strong>Email:</strong> ${client.email}</li>
                    <li><strong>Phone:</strong> ${client.phone || 'N/A'}</li>
                </ul>
                <h3>Appointment Details</h3>
                <ul>
                    <li><strong>Service:</strong> ${appointment.session_type || 'Therapy Session'}</li>
                    <li><strong>Date:</strong> ${date}</li>
                    <li><strong>Time:</strong> ${time}</li>
                    <li><strong>Message:</strong> ${appointment.notes || 'No message provided'}</li>
                </ul>
            </div>
        `
    };

    return sendEmail(mailOptions);
}

/**
 * Helper to send email asynchronously.
 */
async function sendEmail(options) {
    try {
        const info = await transporter.sendMail(options);
        console.log(`[Email] Sent: ${info.messageId}`);
        return info;
    } catch (err) {
        console.error('[Email] Failed to send:', err.message);
        // Do not throw, just log. Appointment creation should not fail because of email.
        return null;
    }
}

module.exports = {
    sendAppointmentConfirmation,
    sendTherapistNotification
};
