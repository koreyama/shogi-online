'use client';

import React from 'react';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
}

export class SuppressErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true };
    }

    componentDidCatch(error: any, errorInfo: any) {
        // Suppress logging to avoid overlay
        // console.warn("Caught error in boundary:", error);
    }

    render() {
        if (this.state.hasError) {
            // If an error occurred, we can't reliably render the children if the error was in render.
            // However, the user says "Game is working normally", implying the error might be elsewhere or transient.
            // Let's render a neutral container.
            return <div style={{ padding: 20 }}>Something went wrong (suppressed).</div>;
        }

        return this.props.children;
    }
}
