"use client";

import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

export class DashboardErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || "Something went wrong while rendering the dashboard.",
    };
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <section className="panel error-panel" role="alert">
          <h2>Dashboard failed to load</h2>
          <p>{this.state.message}</p>
          <button type="button" className="retry-button" onClick={() => this.setState({ hasError: false, message: "" })}>
            Try again
          </button>
        </section>
      );
    }

    return this.props.children;
  }
}
