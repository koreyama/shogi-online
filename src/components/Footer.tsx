import React from 'react';
import Link from 'next/link';

const Footer = () => {
    return (
        <footer style={{
            padding: '2rem',
            textAlign: 'center',
            borderTop: '1px solid #e2e8f0',
            marginTop: 'auto',
            backgroundColor: '#f8fafc',
            color: '#64748b'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '2rem',
                marginBottom: '1rem',
                fontSize: '0.9rem'
            }}>
                <Link href="/about" style={{ textDecoration: 'none', color: 'inherit' }}>About</Link>
                <Link href="/blog" style={{ textDecoration: 'none', color: 'inherit' }}>Blog</Link>
                <Link href="/terms" style={{ textDecoration: 'none', color: 'inherit' }}>利用規約</Link>
                <Link href="/privacy" style={{ textDecoration: 'none', color: 'inherit' }}>プライバシーポリシー</Link>
                <Link href="/contact" style={{ textDecoration: 'none', color: 'inherit' }}>お問い合わせ</Link>
            </div>
            <div style={{ fontSize: '0.8rem' }}>
                &copy; {new Date().getFullYear()} Asobi Lounge. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;
