import React from 'react';
import Link from 'next/link';

const Footer = () => {
    return (
        <footer style={{
            padding: 'clamp(1.25rem, 4vw, 2rem) clamp(1rem, 3vw, 2rem)',
            textAlign: 'center',
            borderTop: '1px solid #e2e8f0',
            marginTop: 'auto',
            backgroundColor: '#f8fafc',
            color: '#64748b'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: 'clamp(0.5rem, 2vw, 1rem) clamp(1rem, 4vw, 2rem)',
                marginBottom: '0.75rem',
                fontSize: 'clamp(0.75rem, 2.2vw, 0.9rem)'
            }}>
                <Link href="/about" style={{ textDecoration: 'none', color: 'inherit', whiteSpace: 'nowrap' }}>About</Link>
                <Link href="/blog" style={{ textDecoration: 'none', color: 'inherit', whiteSpace: 'nowrap' }}>Blog</Link>
                <Link href="/terms" style={{ textDecoration: 'none', color: 'inherit', whiteSpace: 'nowrap' }}>利用規約</Link>
                <Link href="/privacy" style={{ textDecoration: 'none', color: 'inherit', whiteSpace: 'nowrap' }}>プライバシーポリシー</Link>
                <Link href="/contact" style={{ textDecoration: 'none', color: 'inherit', whiteSpace: 'nowrap' }}>お問い合わせ</Link>
            </div>
            <div style={{ fontSize: 'clamp(0.7rem, 2vw, 0.8rem)' }}>
                &copy; {new Date().getFullYear()} Asobi Lounge. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;
