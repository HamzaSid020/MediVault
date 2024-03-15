const nodemailer = require('nodemailer');

function sendEmail(to, text) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'medivault2024@gmail.com',
          pass: 'medivault123'
        },
        tls: {
          rejectUnauthorized: false
      }
      });      
  
    let mailOptions = {
      from: "medivault2024@gmail.com",
      to: to,
      subject: "Your Hospital Code",
      text: text
    };
  
    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  }
  
  module.exports = { sendEmail };