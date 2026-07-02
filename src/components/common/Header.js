import { memo } from 'react';
import './Header.css';

/**
 * Header component displaying the application title and brief subtitle.
 *
 * @returns {React.ReactElement} The header element layout
 */
const Header = () => {
  return (
    <header className="app-header">
      <h1 className="header-title">RewardTracker</h1>
      <p className="header-subtitle">
        Track transactions and calculate customer rewards
      </p>
    </header>
  );
};

Header.displayName = 'Header';

export default memo(Header);
