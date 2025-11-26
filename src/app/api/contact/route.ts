import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const runtime = 'edge';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const { name, email, subject, message } = await request.json();

        // Validate input
        if (!name || !email || !subject || !message) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
            console.error('Missing RESEND_API_KEY environment variable');
            return NextResponse.json(
                { error: 'Server configuration error: Missing email credentials' },
                { status: 500 }
            );
        }

        // Send email using Resend
        // Note: 'onboarding@resend.dev' is for testing. 
        // For production, you need to verify a domain in Resend dashboard.
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'zangecreate@gmail.com', // Target email
            subject: `[Asobi Lounge Contact] ${subject}`,
            html: `
<h3>New Contact Message</h3>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Subject:</strong> ${subject}</p>
<hr />
<p><strong>Message:</strong></p>
<p style="white-space: pre-wrap;">${message}</p>
            `,
            replyTo: email,
        });

        if (error) {
            console.error('Resend error:', error);
            return NextResponse.json(
                { error: 'Failed to send email via Resend' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Email sending error:', error);
        return NextResponse.json(
            { error: 'Failed to send email' },
            { status: 500 }
        );
    }
}
