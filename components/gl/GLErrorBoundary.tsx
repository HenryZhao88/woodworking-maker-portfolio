"use client";
import { Component, type ReactNode } from "react";

/** If WebGL can't start (or throws later), drop to the DOM fallback instead of taking the page down. */
export class GLErrorBoundary extends Component<{ onError(): void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
