import { NextResponse } from 'next/server';
// import nodemailer from 'nodemailer'; // Nodemailer is not compatible with Edge Runtime

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

        /*
        // TODO: Migrate to an HTTP-based email service (e.g., Resend, SendGrid)
        // Nodemailer relies on Node.js APIs (fs, net, etc.) that are not available in Cloudflare Workers/Pages Edge Runtime.
        
        const gmailUser = process.env.GMAIL_USER;
        const gmailPass = process.env.GMAIL_PASS;

        if (!gmailUser || !gmailPass) {
            console.error('Missing GMAIL_USER or GMAIL_PASS environment variables');
            return NextResponse.json(
                { error: 'Server configuration error: Missing email credentials' },
                { status: 500 }
            );
        }

        // Create transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: gmailUser,
                pass: gmailPass,
            },
        });

        // Email content
        const mailOptions = {
            from: gmailUser,
            to: 'zangecreate@gmail.com', // Target email
            subject: `[Asobi Lounge Contact] ${subject}`,
            text: `
Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
            `,
            html: `
<h3>New Contact Message</h3>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Subject:</strong> ${subject}</p>
<hr />
<p><strong>Message:</strong></p>
<p><strong>Message:</strong></p>
<p style="white-space: pre-wrap;">${message}</p>
            `,
        };

        // Send email
        await transporter.sendMail(mailOptions);
        */

        console.log('Contact form submitted (Email sending disabled on Edge):', { name, email, subject });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Email sending error:', error);
        return NextResponse.json(
            { error: 'Failed to send email' },
            { status: 500 }
        );
    }
}
