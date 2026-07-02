import { Component } from "react";
import PropTypes from "prop-types";
import ErrorMessage from "./ErrorMessage";
import { logger } from "../../utils/logger";

/**
 * ErrorBoundary class component to catch JS errors in child components.
 * When a crash occurs, displays a fallback ErrorMessage card.
 *
 * @param {object} props - Component properties
 * @param {React.ReactNode} props.children - Child elements wrapped inside the boundary
 * @param {func} [props.onReset] - Optional callback triggered on reset/retry action
 * @returns {React.ReactElement} Either the fallback UI or the child elements
 */
class ErrorBoundary extends Component {
  /**
   * Initializes the state with default non-error values.
   * @param {object} props - Component properties
   */
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  /**
   * Updates error state when a lifecycle error is caught.
   * @param {Error} error - The caught Javascript error
   * @returns {object} The state update payload
   */
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error.message || "An unexpected error occurred.",
    };
  }

  /**
   * Performs side-effect logging of caught errors.
   * @param {Error} error - The caught Javascript error
   * @param {object} errorInfo - React component stack trace details
   */
  componentDidCatch(error, errorInfo) {
    logger.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  /**
   * Resets the boundary state and triggers the retry callback.
   */
  handleReset = () => {
    this.setState({ hasError: false, errorMessage: "" });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorMessage
          message={this.state.errorMessage}
          onRetry={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  onReset: PropTypes.func,
};

export default ErrorBoundary;
