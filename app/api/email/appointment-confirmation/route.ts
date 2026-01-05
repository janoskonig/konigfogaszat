import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, generateAppointmentConfirmationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientEmail, patientName, appointmentDate, dentistName, address, room } = body;

    if (!patientEmail || !patientName || !appointmentDate) {
      return NextResponse.json(
        { error: 'Missing required fields: patientEmail, patientName, appointmentDate' },
        { status: 400 }
      );
    }

    const { subject, html } = generateAppointmentConfirmationEmail(
      patientName,
      appointmentDate,
      dentistName || 'dr. König János',
      address || '5600 Békéscsaba, Kolozsvári utca 3',
      room
    );

    const success = await sendEmail({ to: patientEmail, subject, html });

    if (success) {
      return NextResponse.json({ success: true, message: 'Appointment confirmation email sent' });
    } else {
      return NextResponse.json(
        { error: 'Email service not configured or failed to send' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending appointment confirmation email:', error);
    return NextResponse.json(
      { error: 'Failed to send appointment confirmation email' },
      { status: 500 }
    );
  }
}

