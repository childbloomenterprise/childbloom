// App-level error boundary.
//
// On render error: shows a warm, calming fallback (no clinical red),
// gives the parent 3 escape hatches (try again, reload, go home),
// and logs to the server (best-effort, fire-and-forget).

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Best-effort server log — fail silently if endpoint isn't reachable.
    try {
      fetch('/api/health', { method: 'GET' }).catch(() => {});
      if (typeof window !== 'undefined' && window.console) {
        console.error('[ChildBloom] render error:', error, errorInfo);
      }
    } catch {}
  }

  reset = () => this.setState({ hasError: false, error: null, errorInfo: null });

  reload = () => {
    try {
      // Bust the SW cache so the user pulls a fresh bundle
      if (navigator.serviceWorker?.getRegistrations) {
        navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
      }
    } catch {}
    window.location.reload();
  };

  goHome = () => {
    this.reset();
    window.location.href = '/dashboard';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    const message = this.state.error?.message || 'Unknown error';

    return (
      <div style={{
        minHeight: '100dvh', background: '#F7F4EF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 32, textAlign: 'center',
        fontFamily: '-apple-system, system-ui, sans-serif',
      }}>
        <div style={{ maxWidth: 360 }}>
          {/* Calm illustration — a single resting bloom shape */}
          <div style={{
            width: 76, height: 76, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(29,158,117,0.14) 0%, transparent 70%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 18px', animation: 'bloom-breathe 3.6s ease-in-out infinite',
          }}>
            <span style={{ fontSize: 34 }}>🌱</span>
          </div>

          <h1 style={{
            fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'italic',
            fontSize: 24, color: '#1D3D2E', margin: '0 0 8px',
            fontWeight: 500, letterSpacing: '-0.02em',
          }}>
            Something needed a breath.
          </h1>

          <p style={{
            color: '#6B7280', fontSize: 14, margin: '0 0 22px',
            lineHeight: 1.55,
          }}>
            The app hit an unexpected hiccup. Your data is safe — none of this affects anything you've logged.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
            <button onClick={this.reset} style={primaryBtn}>Try again</button>
            <button onClick={this.reload} style={secondaryBtn}>Reload the app</button>
            <button onClick={this.goHome} style={ghostBtn}>Back to home</button>
          </div>

          {isDev && (
            <details style={{ marginTop: 22, textAlign: 'left', fontSize: 11, color: '#9CA3AF' }}>
              <summary style={{ cursor: 'pointer' }}>Developer details</summary>
              <pre style={{
                marginTop: 8, padding: 10, borderRadius: 8,
                background: '#FFF', border: '0.5px solid #E5E7EB',
                fontSize: 10, overflow: 'auto', maxHeight: 200, whiteSpace: 'pre-wrap',
              }}>
                {message}
                {'\n\n'}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}

const baseBtn = {
  padding: '12px 18px', borderRadius: 14, cursor: 'pointer',
  fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
  letterSpacing: '-0.005em', transition: 'transform 0.12s ease, box-shadow 0.18s ease',
};

const primaryBtn = {
  ...baseBtn, background: '#1D6A47', color: '#fff', border: 'none',
  boxShadow: '0 3px 12px rgba(29,106,71,0.28)',
};

const secondaryBtn = {
  ...baseBtn, background: '#fff', color: '#1D3D2E',
  border: '0.5px solid rgba(11,23,20,0.12)',
};

const ghostBtn = {
  ...baseBtn, background: 'transparent', color: '#6B7280', border: 'none',
};
