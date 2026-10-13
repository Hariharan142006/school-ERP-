import axios from 'axios';

import { env } from '../config/env';

const BREVO_API_KEY = env.BREVO_API_KEY;
const SENDER_EMAIL = env.BREVO_SENDER_EMAIL;
const EMAIL_URL = 'https://api.brevo.com/v3/smtp/email';
const SMS_URL = 'https://api.brevo.com/v3/transactionalSMS/sms';

export const sendEmail = async (to: string, subject: string, htmlContent: string) => {
  try {
    await axios.post(EMAIL_URL, {
      sender: { email: SENDER_EMAIL, name: 'Aathithiya School ERP' },
      to: [{ email: to }],
      subject,
      htmlContent
    }, {
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      }
    });
    console.log('Email sent to', to);
  } catch (error: any) {
    console.error('Error sending email to', to, error?.response?.data || error.message);
  }
};

export const sendSMS = async (toPhone: string, content: string) => {
  try {
    // Phone must be in international format e.g., +919876543210
    // We will just try our best if it's already formatted, otherwise append +91 for India if exactly 10 digits
    let formattedPhone = toPhone.trim();
    if (formattedPhone.length === 10 && !formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone;
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    await axios.post(SMS_URL, {
      type: 'transactional',
      sender: 'SchoolERP',
      recipient: formattedPhone,
      content
    }, {
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      }
    });
    console.log('SMS sent to', formattedPhone);
  } catch (error: any) {
    console.error('Error sending SMS to', toPhone, error?.response?.data || error.message);
  }
};

