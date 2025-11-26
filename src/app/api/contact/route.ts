import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

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

        // Use getRequestContext to access runtime environment variables
        const { env } = getRequestContext();

        // Note: In local development with 'next dev', env might be empty, so we fallback to process.env
        const resendApiKey = (env as any).RESEND_API_KEY || process.env.RESEND_API_KEY;

        if (!resendApiKey) {
            console.error('Missing RESEND_API_KEY environment variable');
            return NextResponse.json(
                { error: 'Configuration Error: RESEND_API_KEY is missing.' },
                { status: 500 }
            );
        }

        const contactEmail = (env as any).CONTACT_EMAIL || process.env.CONTACT_EMAIL;

        if (!contactEmail) {
            console.error('Missing CONTACT_EMAIL environment variable');
            return NextResponse.json(
                { error: 'Configuration Error: CONTACT_EMAIL is missing.' },
                { status: 500 }
            );
        }

        // Direct fetch to Resend API to avoid SDK issues in Edge Runtime
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
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
                reply_to: email,
            }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            console.error('Resend API error:', errorData);
            return NextResponse.json(
                { error: `Resend API Error: ${errorData.message || res.statusText}` },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('Email sending error:', error);
        return NextResponse.json(
            { error: `Internal Server Error: ${error.message || 'Unknown error'}` },
            { status: 500 }
        );
    }
}
