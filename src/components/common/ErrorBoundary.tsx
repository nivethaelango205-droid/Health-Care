import React, { Component, ErrorInfo, ReactNode } from 'react';
import { PhoneCall, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RuralCare 360 React ErrorBoundary caught an exception:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-2xl mx-auto my-8 bg-white border border-rose-200 rounded-2xl shadow-card space-y-5 text-center">
          <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-navy-900">
              {this.props.fallbackTitle || 'Assistance Page Recovery'}
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              A temporary display error was caught. Immediate emergency assistance remains fully available below.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a href="tel:112" className="inline-block">
              <Button variant="emergency" size="md" leftIcon={<PhoneCall className="h-4 w-4" />}>
                Call 112 (National Emergency)
              </Button>
            </a>
            <a href="tel:108" className="inline-block">
              <Button variant="secondary" size="md" leftIcon={<PhoneCall className="h-4 w-4" />} className="bg-amber-600 hover:bg-amber-700 text-white">
                Call 108 (Ambulance)
              </Button>
            </a>
            <Button variant="outline" size="md" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={this.handleReset}>
              Reload Interface
            </Button>
          </div>

          {this.state.error && (
            <details className="text-left text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200 cursor-pointer">
              <summary className="font-semibold text-slate-700">Diagnostic Technical Details</summary>
              <pre className="mt-2 whitespace-pre-wrap font-mono text-[10px] text-rose-700">
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

