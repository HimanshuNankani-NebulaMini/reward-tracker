import { render, screen, fireEvent } from '@testing-library/react';
import PropTypes from 'prop-types';
import ErrorBoundary from '../ErrorBoundary';

// A mock component that throws an error during rendering
const ProblemChild = ({ shouldThrow, message }) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div>Problem Child Normal</div>;
};

ProblemChild.propTypes = {
  shouldThrow: PropTypes.bool,
  message: PropTypes.string
};

describe('ErrorBoundary Component', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    // Prevent console.error from printing React stack traces for expected thrown errors
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('renders children normally when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <div>Normal Child</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Normal Child')).toBeInTheDocument();
    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
  });

  test('catches child render errors and displays fallback ErrorMessage card with message', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} message="Test Render Crash" />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByText('Test Render Crash')).toBeInTheDocument();
  });

  test('catches child render errors and falls back to default error message if none is provided', () => {
    // Throws an error without a message
    const SilentProblemChild = () => {
      throw new Error();
    };

    render(
      <ErrorBoundary>
        <SilentProblemChild />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
  });

  test('triggers onReset callback and resets the error boundary state when Try Again is clicked', () => {
    const onResetSpy = jest.fn();

    // We render a component whose error state can be updated dynamically
    const { rerender } = render(
      <ErrorBoundary onReset={onResetSpy}>
        <ProblemChild shouldThrow={true} message="Initial Crash" />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-message')).toBeInTheDocument();

    // Rerender with children that do not throw, and click Try Again
    rerender(
      <ErrorBoundary onReset={onResetSpy}>
        <ProblemChild shouldThrow={false} />
      </ErrorBoundary>
    );

    const retryBtn = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryBtn);

    expect(onResetSpy).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    expect(screen.getByText('Problem Child Normal')).toBeInTheDocument();
  });

  test('resets error boundary state when Try Again is clicked even without onReset prop', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} message="Crash Without Prop" />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-message')).toBeInTheDocument();

    // Rerender with children that do not throw, and click Try Again
    rerender(
      <ErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </ErrorBoundary>
    );

    const retryBtn = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryBtn);

    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    expect(screen.getByText('Problem Child Normal')).toBeInTheDocument();
  });
});
