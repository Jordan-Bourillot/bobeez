import React from 'react';
import { M } from '../mascot.js';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    this.setState({ info });
    try {
      window.bobeez?.logError?.({
        kind: 'react.boundary',
        message: error.message,
        stack: error.stack,
        componentStack: info?.componentStack,
      });
    } catch {}
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="error-boundary">
        <img src={M.shocked2} alt="" />
        <h1>Oups, Bobeez a planté</h1>
        <p>{this.state.error.message}</p>
        <details>
          <summary>Détails techniques</summary>
          <pre>{this.state.error.stack}</pre>
          <pre>{this.state.info?.componentStack}</pre>
        </details>
        <button className="btn primary" onClick={() => location.reload()}>Recharger l'app</button>
      </div>
    );
  }
}
