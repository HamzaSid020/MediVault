require('dotenv').config();
const mailgun = require("mailgun-js");

async function sendEmail(to, subject, text) {
    const DOMAIN = process.env.DOMAIN;
    const mg = mailgun({apiKey: process.env.MAILGUN_KEY, domain: DOMAIN});

    const data = {
        from: process.env.SENDER_EMAIL,
        to: to,
        subject: subject,
        text: text
    };

    try {
        const result = await mg.messages().send(data);
        console.log('Email sent:', result);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}


module.exports = sendEmail;