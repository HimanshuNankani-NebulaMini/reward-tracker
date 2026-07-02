import { memo } from 'react';
import PropTypes from 'prop-types';
import './LoadingSpinner.css';

/**
 * LoadingSpinner renders a centralized animated spinner loader and descriptive text label.
 *
 * @param {object} props - Component properties
 * @param {string} [props.message] - Descriptive loading text label
 * @returns {React.ReactElement} The animated spinner overlay element
 */
const LoadingSpinner = ({ message = 'Loading rewards data...' }) => {
  return (
    <div className="loading-container" data-testid="loading-spinner">
      <div className="spinner-glow"></div>
      <div className="spinner"></div>
      <p className="loading-message">{message}</p>
    </div>
  );
};

LoadingSpinner.propTypes = {
  message: PropTypes.string
};

LoadingSpinner.displayName = 'LoadingSpinner';

export default memo(LoadingSpinner);
