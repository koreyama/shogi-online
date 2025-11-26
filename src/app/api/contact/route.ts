import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const runtime = 'edge';

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
                { error: 'Configuration Error: RESEND_API_KEY is missing.' },
                { status: 500 }
            );
        }

        // Initialize Resend inside the handler to ensure env vars are available
        const resend = new Resend(resendApiKey);

        // Use environment variable for the recipient email, or fallback to a default if needed.
        // For Resend 'onboarding@resend.dev', this MUST match the registered Resend account email.
        const contactEmail = process.env.CONTACT_EMAIL;
        if (!contactEmail) {
            console.error('Missing CONTACT_EMAIL environment variable');
            return NextResponse.json(
                { error: 'Configuration Error: CONTACT_EMAIL is missing.' },
                { status: 500 }
            );
        }

        // Send email using Resend
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: contactEmail,
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
                { error: `Resend Error: ${error.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('Email sending error:', error);
        return NextResponse.json(
            { error: `Internal Server Error: ${error.message || 'Unknown error'}` },
            { status: 500 }
        );
    }
}
