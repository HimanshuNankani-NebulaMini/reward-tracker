import React from 'react';
import './Header.css';

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

export default React.memo(Header);
