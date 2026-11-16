import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Component rendering error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-rose-900/60 bg-[#0B111E] p-6 text-center">
          <p className="text-sm font-semibold text-rose-400">
            {this.props.fallbackTitle ?? 'Viewport Recovery Mode'}
          </p>
          <p className="mt-2 max-w-md text-xs text-slate-400">{this.state.message}</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="mt-4 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-500/60"
          >
            Retry Viewport
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
