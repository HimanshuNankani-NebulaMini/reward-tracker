import { memo } from 'react';
import PropTypes from 'prop-types';
import './TotalRewardsTable.css';

/**
 * TotalRewardsTable displays the total accumulated reward points for each customer.
 *
 * @param {object} props - Component properties
 * @param {Array<object>} props.totalRewards - The list of aggregated customer cumulative reward summaries
 * @returns {React.ReactElement} The total rewards table element
 */
const TotalRewardsTable = ({ totalRewards }) => {
  return (
    <div className="table-card" data-testid="total-rewards-card">
      <h2 className="table-card-title">Total Rewards</h2>
      <div className="table-responsive">
        <table className="rewards-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th className="points-header">Total Reward Points</th>
            </tr>
          </thead>
          <tbody>
            {totalRewards.length === 0 ? (
              <tr>
                <td colSpan="2" className="empty-cell">No rewards computed.</td>
              </tr>
            ) : (
              totalRewards.map((row) => (
                <tr key={row.customerId} data-testid="total-row">
                  <td className="customer-name">{row.name}</td>
                  <td className="points-cell">
                    <span className="total-points-pill">
                      {row.points.toLocaleString()} pts
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

TotalRewardsTable.propTypes = {
  totalRewards: PropTypes.arrayOf(
    PropTypes.shape({
      customerId: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      points: PropTypes.number.isRequired
    })
  ).isRequired
};

TotalRewardsTable.displayName = 'TotalRewardsTable';

export default memo(TotalRewardsTable);
