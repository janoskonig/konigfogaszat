import sgMail from '@sendgrid/mail';

// Initialize SendGrid if API key is available
// Support both SENDGRID_API_KEY and SendGridAPI_Key variable names
const sendGridApiKey = process.env.SENDGRID_API_KEY || process.env.SendGridAPI_Key;
if (sendGridApiKey) {
  sgMail.setApiKey(sendGridApiKey);
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Check for SendGrid API key (support both naming conventions)
    const sendGridKey = process.env.SENDGRID_API_KEY || process.env.SendGridAPI_Key;
    if (sendGridKey && sendGridKey.trim() !== '') {
      const msg = {
        to: options.to,
        from: process.env.SMTP_FROM || process.env.SMTP_REPLY_TO || 'noreply@konigfogaszat.hu',
        replyTo: process.env.SMTP_REPLY_TO || process.env.SMTP_FROM || 'noreply@konigfogaszat.hu',
        subject: options.subject,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
        html: options.html,
      };

      await sgMail.send(msg);
      console.log('Email sent successfully via SendGrid to:', options.to);
      return true;
    }

    // Fallback: Try SMTP if SendGrid is not available
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    // If SMTP_PASS contains ${SendGridAPI_Key}, replace it with the actual key
    let smtpPass = process.env.SMTP_PASS;
    if (smtpPass && smtpPass.includes('${SendGridAPI_Key}')) {
      smtpPass = smtpPass.replace('${SendGridAPI_Key}', sendGridKey || '');
    }
    if (smtpPass && smtpPass.includes('${SENDGRID_API_KEY}')) {
      smtpPass = smtpPass.replace('${SENDGRID_API_KEY}', sendGridKey || '');
    }
    
    if (smtpHost && smtpHost.trim() !== '' && smtpUser && smtpUser.trim() !== '' && smtpPass && smtpPass.trim() !== '') {
      const nodemailer = await import('nodemailer');
      
      const transporter = nodemailer.default.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || smtpUser,
        replyTo: process.env.SMTP_REPLY_TO || process.env.SMTP_FROM || smtpUser,
        to: options.to,
        subject: options.subject,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
        html: options.html,
      });

      console.log('Email sent successfully via SMTP to:', options.to);
      return true;
    }

    // If no email service is configured, log detailed error
    console.error('Email service not configured. Please set one of the following:');
    console.error('  - SENDGRID_API_KEY (preferred)');
    console.error('  - OR SMTP_HOST, SMTP_USER, SMTP_PASS (alternative)');
    console.error('Current environment check:');
    console.error('  SENDGRID_API_KEY:', sendGridKey ? 'SET (but may be empty)' : 'NOT SET');
    console.error('  SMTP_HOST:', smtpHost ? 'SET' : 'NOT SET');
    console.error('  SMTP_USER:', smtpUser ? 'SET' : 'NOT SET');
    console.error('  SMTP_PASS:', smtpPass ? 'SET' : 'NOT SET');
    return false;
  } catch (error) {
    console.error('Error sending email:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    return false;
  }
}

export function generateMagicLinkEmail(token: string, email: string): { subject: string; html: string } {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const loginUrl = `${baseUrl}/patient-portal/verify?token=${token}`;

  const subject = 'Bejelentkezési link - König Fogászat';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; font-size: 16px; }
        .button:hover { background: #1d4ed8; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>König Fogászat</h1>
        </div>
        <div class="content">
          <h2>Tisztelettel!</h2>
          <p>Kattintson az alábbi gombra a páciens portálba való bejelentkezéshez:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" class="button" style="background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Bejelentkezés a páciens portálba</a>
          </div>
          <p style="margin-top: 20px;">Ha a gomb nem működik, másolja be ezt a linket a böngésző címsorába:</p>
          <p style="word-break: break-all; color: #2563eb; background: #f3f4f6; padding: 10px; border-radius: 4px; font-size: 12px;">${loginUrl}</p>
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;"><strong>Figyelem:</strong> Ez a bejelentkezési link 24 órán belül lejár. Csak egyszer használható.</p>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Ha Ön nem kért bejelentkezési linket, kérjük, hagyja figyelmen kívül ezt az emailt.</p>
        </div>
        <div class="footer">
          <p>König Fogászat<br>5600 Békéscsaba, Kolozsvári utca 3<br>dr. König János</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

export function generateAppointmentConfirmationEmail(
  patientName: string,
  appointmentDate: string,
  dentistName: string,
  address: string,
  room?: string
): { subject: string; html: string } {
  const subject = 'Időpont megerősítése - König Fogászat';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>König Fogászat</h1>
        </div>
        <div class="content">
          <h2>Tisztelettel ${patientName}!</h2>
          <p>Időpontja sikeresen lefoglalva.</p>
          <div class="info-box">
            <p><strong>Időpont:</strong> ${appointmentDate}</p>
            <p><strong>Orvos:</strong> ${dentistName}</p>
            <p><strong>Helyszín:</strong> ${address}${room ? ` (${room}. terem)` : ''}</p>
          </div>
          <p>Kérjük, hogy időben érkezzen az időpontra.</p>
          <p>Ha módosítani vagy lemondani szeretné az időpontot, kérjük, lépjen kapcsolatba velünk.</p>
        </div>
        <div class="footer">
          <p>König Fogászat<br>5600 Békéscsaba, Kolozsvári utca 3<br>dr. König János</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

export function generateAppointmentCancellationEmail(
  patientName: string,
  appointmentDate: string,
  cancelledBy: 'doctor' | 'patient'
): { subject: string; html: string } {
  const subject = 'Időpont lemondva - König Fogászat';
  const cancelledByText = cancelledBy === 'doctor' ? 'az orvos' : 'Ön';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>König Fogászat</h1>
        </div>
        <div class="content">
          <h2>Tisztelettel ${patientName}!</h2>
          <p>Az alábbi időpont lemondásra került ${cancelledByText} által:</p>
          <div class="info-box">
            <p><strong>Időpont:</strong> ${appointmentDate}</p>
          </div>
          <p>Ha új időpontot szeretne foglalni, kérjük, lépjen kapcsolatba velünk vagy használja a páciens portált.</p>
        </div>
        <div class="footer">
          <p>König Fogászat<br>5600 Békéscsaba, Kolozsvári utca 3<br>dr. König János</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

export function generateAppointmentModificationEmail(
  patientName: string,
  oldDate: string,
  newDate: string,
  dentistName: string,
  address: string,
  room?: string
): { subject: string; html: string } {
  const subject = 'Időpont módosítva - König Fogászat';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>König Fogászat</h1>
        </div>
        <div class="content">
          <h2>Tisztelettel ${patientName}!</h2>
          <p>Időpontja módosításra került.</p>
          <div class="info-box">
            <p><strong>Régi időpont:</strong> ${oldDate}</p>
            <p><strong>Új időpont:</strong> ${newDate}</p>
            <p><strong>Orvos:</strong> ${dentistName}</p>
            <p><strong>Helyszín:</strong> ${address}${room ? ` (${room}. terem)` : ''}</p>
          </div>
          <p>Kérjük, hogy az új időpontra időben érkezzen.</p>
        </div>
        <div class="footer">
          <p>König Fogászat<br>5600 Békéscsaba, Kolozsvári utca 3<br>dr. König János</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

