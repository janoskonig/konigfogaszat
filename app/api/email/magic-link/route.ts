import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, generateMagicLinkEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token } = body;

    if (!email || !token) {
      return NextResponse.json(
        { error: 'Missing required fields: email, token' },
        { status: 400 }
      );
    }

    const { subject, html } = generateMagicLinkEmail(token, email);
    const success = await sendEmail({ to: email, subject, html });

    if (success) {
      return NextResponse.json({ success: true, message: 'Magic link email sent' });
    } else {
      return NextResponse.json(
        { error: 'Email service not configured or failed to send' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending magic link email:', error);
    return NextResponse.json(
      { error: 'Failed to send magic link email' },
      { status: 500 }
    );
  }
}

