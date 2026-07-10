import { memo } from 'react';
import PropTypes from 'prop-types';
import './MonthlyRewardsTable.css';

/**
 * MonthlyRewardsTable displays customer aggregated monthly reward points.
 *
 * @param {object} props - Component properties
 * @param {Array<object>} props.monthlyRewards - The list of aggregated monthly reward summaries
 * @param {string} [props.title] - Optional custom card title
 * @returns {React.ReactElement} The monthly rewards table element
 */
const MonthlyRewardsTable = ({ monthlyRewards, title = 'Monthly Rewards Summary' }) => {
  return (
    <div className="table-card" data-testid="monthly-rewards-card">
      <h2 className="table-card-title">{title}</h2>
      <div className="table-responsive">
        <table className="rewards-table">
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Name</th>
              <th>Month</th>
              <th>Year</th>
              <th className="points-header">Reward Points</th>
            </tr>
          </thead>
          <tbody>
            {monthlyRewards.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-cell">No rewards aggregated yet.</td>
              </tr>
            ) : (
              monthlyRewards.map((row) => (
                <tr key={`${row.customerId}-${row.year}-${row.monthIndex}`} data-testid="monthly-row">
                  <td className="tx-id">{row.customerId}</td>
                  <td className="customer-name">{row.name}</td>
                  <td className="month">{row.monthName}</td>
                  <td className="year">{row.year}</td>
                  <td className="points-cell">
                    <span className={`points-badge ${row.points > 0 ? 'active' : 'zero'}`}>
                      {row.points} pts
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

MonthlyRewardsTable.propTypes = {
  monthlyRewards: PropTypes.arrayOf(
    PropTypes.shape({
      customerId: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      monthName: PropTypes.string.isRequired,
      monthIndex: PropTypes.number.isRequired,
      year: PropTypes.number.isRequired,
      points: PropTypes.number.isRequired
    })
  ).isRequired,
  title: PropTypes.string
};

MonthlyRewardsTable.displayName = 'MonthlyRewardsTable';

export default memo(MonthlyRewardsTable);
