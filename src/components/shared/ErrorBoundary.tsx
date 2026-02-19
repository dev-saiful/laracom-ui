import { Component, type ReactNode } from 'react'
import { Button, Result } from 'antd'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Result
            status="error"
            title="Something went wrong"
            subTitle={
              import.meta.env.DEV
                ? this.state.error?.message
                : 'An unexpected error occurred. Please refresh the page.'
            }
            extra={
              <Button type="primary" onClick={() => this.setState({ hasError: false, error: null })}>
                Try Again
              </Button>
            }
          />
        </div>
      )
    }

    return this.props.children
  }
}
