import { memo } from 'react';
import PropTypes from 'prop-types';
import './ErrorMessage.css';

/**
 * ErrorMessage displays a structured error alert box and provides an optional retry button.
 *
 * @param {object} props - Component properties
 * @param {string} [props.message] - The descriptive error message to display
 * @param {func} [props.onRetry] - Optional callback triggered on click of the retry button
 * @returns {React.ReactElement} The error notification card layout
 */
const ErrorMessage = ({ message = 'Something went wrong.', onRetry = null }) => {
  return (
    <div className="error-container" data-testid="error-message">
      <div className="error-icon">⚠️</div>
      <h3 className="error-title">Error Loading Data</h3>
      <p className="error-text">{message}</p>
      {onRetry && (
        <button className="error-retry-btn" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
};

ErrorMessage.propTypes = {
  message: PropTypes.string,
  onRetry: PropTypes.func
};

ErrorMessage.displayName = 'ErrorMessage';

export default memo(ErrorMessage);
