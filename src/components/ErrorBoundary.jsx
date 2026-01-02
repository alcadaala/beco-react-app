import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.state.errorInfo = errorInfo;
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div style={{ padding: '20px', fontFamily: 'sans-serif', color: 'red' }}>
                    <h1>Something went wrong.</h1>
                    <details style={{ whiteSpace: 'pre-wrap' }}>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button onClick={() => window.location.reload()} style={{ padding: '10px', background: '#eee', border: '1px solid #ccc', borderRadius: '5px' }}>
                            Reload Page
                        </button>
                        <button onClick={() => {
                            localStorage.clear();
                            window.location.reload();
                        }} style={{ padding: '10px', background: 'red', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}>
                            Clear Data & Fix
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
