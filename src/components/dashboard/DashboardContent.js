import { useState, useCallback, useMemo, lazy, Suspense } from "react";
import dayjs from "dayjs";
import FilterBar from "../common/FilterBar";
import LoadingSpinner from "../common/LoadingSpinner";
import {
  aggregateMonthlyRewards,
  aggregateTotalRewards,
  sortTransactionsByDate,
  sortMonthlyRewards,
} from "../../utils/dataAggregator";
import PropTypes from "prop-types";

// Lazily load table components
const MonthlyRewardsTable = lazy(() => import("../table/MonthlyRewardsTable"));
const TotalRewardsTable = lazy(() => import("../table/TotalRewardsTable"));
const TransactionsTable = lazy(() => import("../table/TransactionsTable"));

/**
 * Component that processes the transaction records and coordinates
 * rendering the ledger and monthly summary tables under a Suspense boundary.
 *
 * @param {object} props - The component properties
 * @param {Array<object>} props.transactions - The list of transaction records
 * @returns {React.ReactElement} The dashboard layout element
 */
function DashboardContent({ transactions }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  /**
   * Updates the search query text state.
   * @param {object} e - React change event
   */
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  /**
   * Updates the filter date range start string.
   * @param {object} e - React change event
   */
  const handleStartDateChange = useCallback((e) => {
    setStartDate(e.target.value);
  }, []);

  /**
   * Updates the filter date range end string.
   * @param {object} e - React change event
   */
  const handleEndDateChange = useCallback((e) => {
    setEndDate(e.target.value);
  }, []);

  /**
   * Resets all search text and date filter constraints.
   */
  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
  }, []);

  /**
   * Master transaction list filtered by search text and date limits.
   * @type {Array<object>}
   */
  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesSearch =
        query === "" ||
        transaction?.customerName?.toLowerCase()?.includes(query) ||
        transaction?.product?.toLowerCase()?.includes(query) ||
        transaction?.id?.toLowerCase()?.includes(query) ||
        transaction?.customerId?.toLowerCase()?.includes(query);

      const transactionDate = dayjs(transaction?.date);
      const matchesStart =
        !startDate || transactionDate.diff(dayjs(startDate), "day") >= 0;
      const matchesEnd =
        !endDate || transactionDate.diff(dayjs(endDate), "day") <= 0;

      return matchesSearch && matchesStart && matchesEnd;
    });
  }, [transactions, searchQuery, startDate, endDate]);

  /**
   * Transaction list filtered by search text query for customer name/ID matching.
   * @type {Array<object>}
   */
  const summaryFilteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query === "") {
      return transactions;
    }

    const matches = transactions.filter(
      (transaction) =>
        transaction?.customerName?.toLowerCase()?.includes(query) ||
        transaction?.customerId?.toLowerCase()?.includes(query),
    );

    return matches.length > 0 ? matches : transactions;
  }, [transactions, searchQuery]);

  /**
   * Aggregated customer rewards points by month and year.
   * @type {Array<object>}
   */
  const monthlyRewards = useMemo(() => {
    const aggregated = aggregateMonthlyRewards(summaryFilteredTransactions);
    return sortMonthlyRewards(aggregated);
  }, [summaryFilteredTransactions]);

  /**
   * Aggregated cumulative points earned by each customer.
   * @type {Array<object>}
   */
  const totalRewards = useMemo(() => {
    const aggregated = aggregateTotalRewards(summaryFilteredTransactions);
    return [...aggregated].sort((a, b) => a.name.localeCompare(b.name));
  }, [summaryFilteredTransactions]);

  /**
   * Chronologically sorted transactions ledger records.
   * @type {Array<object>}
   */
  const sortedTransactions = useMemo(() => {
    return sortTransactionsByDate(filteredTransactions);
  }, [filteredTransactions]);

  return (
    <>
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        startDate={startDate}
        onStartDateChange={handleStartDateChange}
        endDate={endDate}
        onEndDateChange={handleEndDateChange}
        onClear={handleClearFilters}
      />

      <Suspense
        fallback={<LoadingSpinner message="Rendering dashboard tables..." />}
      >
        <div className="dashboard-grid">
          <div className="dashboard-full-width">
            <TransactionsTable transactions={sortedTransactions} />
          </div>

          <div className="dashboard-side-by-side">
            <MonthlyRewardsTable monthlyRewards={monthlyRewards} />
            <TotalRewardsTable totalRewards={totalRewards} />
          </div>
        </div>
      </Suspense>
    </>
  );
}

DashboardContent.propTypes = {
  transactions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      customerId: PropTypes.string.isRequired,
      customerName: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      product: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired,
    }),
  ).isRequired,
};

export default DashboardContent;
