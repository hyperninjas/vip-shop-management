'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Container, Stack, Text, Title } from '@mantine/core';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to monitoring service (e.g., Sentry)
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });

    // You can log to an error reporting service here
    // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Container size="md" py="xl">
          <Stack gap="md" align="center">
            <Title order={1}>Something went wrong</Title>
            <Text c="dimmed" ta="center">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </Text>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Stack gap="xs" style={{ width: '100%', maxWidth: 800 }}>
                <Text size="sm" fw={500}>
                  Error Details:
                </Text>
                <Text
                  size="xs"
                  style={{
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text
                    size="xs"
                    style={{
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </Stack>
            )}

            <Button onClick={this.handleReset} variant="light">
              Try Again
            </Button>
            <Button onClick={() => window.location.reload()} variant="filled">
              Refresh Page
            </Button>
          </Stack>
        </Container>
      );
    }

    return this.props.children;
  }
}
