import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  error: Error | null;
};

export default class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Application render failed.", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="login-shell">
          <div className="login-panel">
            <p className="eyebrow">Application Error</p>
            <h1 className="login-title">The page crashed while rendering.</h1>
            <p className="route-copy">{this.state.error.message}</p>
            <pre className="error-boundary-stack">{this.state.error.stack}</pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
