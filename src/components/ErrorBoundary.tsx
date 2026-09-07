import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[320px] flex items-center justify-center p-6 bg-[#FAF7F2] rounded-3xl border border-[#FED7D7] m-4 text-center">
          <div className="max-w-md space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF5F5] border border-[#FED7D7] text-[#DC2626] flex items-center justify-center mx-auto shadow-xs">
              <AlertOctagon className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-[#26211E]">System Service Boundary Recovered</h3>
              <p className="text-xs text-[#6B625B] mt-1 leading-relaxed">
                An isolated service or rendering failure was contained to prevent app termination.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#FED7D7] text-left">
                <p className="text-[11px] font-mono font-bold text-[#DC2626] break-words">
                  {this.state.error.name}: {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C7512E] hover:bg-[#A83F20] text-white text-xs font-bold transition-all shadow-xs active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset & Re-initialize Pipeline</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
