const createTransporter = require('../../config/email');
const logger = require('../../config/logger');

const sendEmail = async (options) => {
  const transporter = await createTransporter();

  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  const info = await transporter.sendMail(message);

  if (process.env.NODE_ENV !== 'production') {
    logger.info(`Preview URL: ${require('nodemailer').getTestMessageUrl(info)}`);
  }
};

module.exports = sendEmail;