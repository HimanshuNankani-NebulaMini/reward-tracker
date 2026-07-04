import { useState, useEffect, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import './FilterBar.css';

/**
 * FilterBar component rendering dashboard filters:
 * - Search input (text query)
 * - Date Range (From and To date picks)
 * - Apply filters button
 * - Reset action button
 */
/**
 * Static pure helpers placed outside of the component to avoid needless recreation.
 */
/**
 * Retrieves the current calendar date formatted as YYYY-MM-DD.
 * @returns {string} The formatted date string
 */
const getTodayStr = () => dayjs().format('YYYY-MM-DD');

/**
 * Triggers the browser's native picker popover on date inputs.
 * @param {object} e - React click event
 */
const triggerNativePicker = (e) => {
  if (e.target && typeof e.target.showPicker === 'function') {
    e.target.showPicker();
  }
};

/**
 * Normalizes start and end date bounds, enforcing maximum 3-month gaps
 * and capping both boundaries to the current date.
 * 
 * @param {string} startDate - Start date value
 * @param {string} endDate - End date value
 * @param {object} today - Day.js object representing today
 * @returns {object} Normalized appliedStart and appliedEnd values
 */
const calculateDateRange = (startDate, endDate, today) => {
  let appliedStart = startDate;
  let appliedEnd = endDate;

  if (appliedStart && !appliedEnd) {
    let calcEnd = dayjs(appliedStart).add(3, 'month');
    if (calcEnd.isAfter(today)) {
      calcEnd = today;
    }
    appliedEnd = calcEnd.format('YYYY-MM-DD');
  } else if (appliedEnd && !appliedStart) {
    appliedStart = dayjs(appliedEnd).subtract(3, 'month').format('YYYY-MM-DD');
  }

  if (appliedStart && dayjs(appliedStart).isAfter(today)) {
    appliedStart = today.format('YYYY-MM-DD');
  }
  if (appliedEnd && dayjs(appliedEnd).isAfter(today)) {
    appliedEnd = today.format('YYYY-MM-DD');
  }

  return { appliedStart, appliedEnd };
};

/**
 * FilterBar component rendering search query text fields and date bounds selectors.
 *
 * @param {object} props - Component properties
 * @param {string} props.searchQuery - Current search query text
 * @param {func} props.onSearchChange - Search update callback
 * @param {string} props.startDate - Start boundary date string
 * @param {func} props.onStartDateChange - Start date update callback
 * @param {string} props.endDate - End boundary date string
 * @param {func} props.onEndDateChange - End date update callback
 * @param {func} props.onClear - Filters clearing callback
 * @returns {React.ReactElement} The filter interface container
 */
const FilterBar = ({
  searchQuery,
  onSearchChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onClear
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);

  const todayStr = getTodayStr();

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
    setLocalStartDate(startDate);
    setLocalEndDate(endDate);
  }, [searchQuery, startDate, endDate]);

  /**
   * Applies all local query and date criteria up to parent boundaries.
   */
  const handleApply = useCallback(() => {
    const today = dayjs();
    const { appliedStart, appliedEnd } = calculateDateRange(localStartDate, localEndDate, today);

    setLocalStartDate(appliedStart);
    setLocalEndDate(appliedEnd);

    onSearchChange({ target: { value: localSearchQuery } });
    onStartDateChange({ target: { value: appliedStart } });
    onEndDateChange({ target: { value: appliedEnd } });
  }, [localSearchQuery, localStartDate, localEndDate, onSearchChange, onStartDateChange, onEndDateChange]);

  /**
   * Triggers the filters application when the Enter key is pressed.
   * @param {object} e - React keyboard event
   */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  }, [handleApply]);

  const hasActiveFilters = searchQuery !== '' || startDate !== '' || endDate !== '';
  const hasLocalFilters = localSearchQuery.trim() !== '' || localStartDate !== '' || localEndDate !== '';

  return (
    <div className="filter-bar-card" data-testid="filter-bar">
      <div className="filter-input-group">
        <label htmlFor="search-input" className="filter-label">Search</label>
        <input
          id="search-input"
          type="text"
          className="filter-text-input"
          placeholder="Search ID, customer, product..."
          value={localSearchQuery}
          onChange={(e) => setLocalSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          data-testid="search-input"
        />
      </div>

      <div className="filter-date-group">
        <div className="filter-input-group">
          <label htmlFor="start-date-input" className="filter-label">From</label>
          <input
            id="start-date-input"
            type="date"
            max={localEndDate || todayStr}
            className={`filter-date-input ${!localStartDate ? 'is-empty' : ''}`}
            value={localStartDate}
            onChange={(e) => setLocalStartDate(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={triggerNativePicker}
            data-testid="start-date-input"
          />
        </div>

        <div className="filter-input-group">
          <label htmlFor="end-date-input" className="filter-label">To</label>
          <input
            id="end-date-input"
            type="date"
            min={localStartDate || ''}
            max={todayStr}
            className={`filter-date-input ${!localEndDate ? 'is-empty' : ''}`}
            value={localEndDate}
            onChange={(e) => setLocalEndDate(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={triggerNativePicker}
            data-testid="end-date-input"
          />
        </div>

        {hasLocalFilters && (
          <button
            className="filter-apply-btn"
            onClick={handleApply}
            data-testid="apply-filters-btn"
          >
            Apply
          </button>
        )}
      </div>

      {hasActiveFilters && (
        <button
          className="filter-clear-btn"
          onClick={onClear}
          data-testid="clear-filters-btn"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
};

FilterBar.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  startDate: PropTypes.string.isRequired,
  onStartDateChange: PropTypes.func.isRequired,
  endDate: PropTypes.string.isRequired,
  onEndDateChange: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired
};

FilterBar.displayName = 'FilterBar';

export default memo(FilterBar);
