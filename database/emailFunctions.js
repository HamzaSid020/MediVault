const mailgun = require("mailgun-js");

async function sendEmail(to, subject, text) {
    const DOMAIN = "sandbox1ded8a33a6b44e4587b85ed637dfb8cb.mailgun.org";
    const mg = mailgun({ apiKey: "24e1496507c4cac4c461b656ffbb9a8f-f68a26c9-bf67d16a", domain: DOMAIN });

    const data = {
        from: "Mailgun Sandbox <postmaster@sandbox1ded8a33a6b44e4587b85ed637dfb8cb.mailgun.org>",
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