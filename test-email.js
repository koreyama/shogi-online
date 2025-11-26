const nodemailer = require('nodemailer');

async function main() {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'zangecreate@gmail.com',
            pass: 'yima rgmd zllt huze',
        },
    });

    try {
        await transporter.sendMail({
            from: 'zangecreate@gmail.com',
            to: 'zangecreate@gmail.com',
            subject: 'Test Email from Asobi Lounge Config',
            text: 'If you receive this, the App Password is working correctly!',
        });
        console.log('Email sent successfully!');
    } catch (error) {
        console.error('Error sending email:', error);
        process.exit(1);
    }
}

main();
