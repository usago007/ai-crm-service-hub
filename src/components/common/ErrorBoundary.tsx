import { Component, type ReactNode } from 'react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-[20px] border border-[var(--color-border)] bg-white p-6 text-center">
          <div className="text-sm font-semibold mb-2">
            {this.props.fallbackTitle ?? '此区域出现错误'}
          </div>
          <div className="text-xs text-[var(--color-text-secondary)] mb-4">
            数据未受影响。可以尝试刷新此区域。
          </div>
          <Button size="sm" variant="secondary" onClick={() => this.setState({ error: null })}>
            重试
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
