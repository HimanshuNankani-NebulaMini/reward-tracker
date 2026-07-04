import { useMemo, useState, useCallback, memo, useEffect } from 'react';
import './TransactionsTable.css';
import PropTypes from 'prop-types';

/**
 * Sub-component for individual table header sorting, memoized to prevent re-renders.
 */
const SortHeader = memo(({ columnKey, label, sortKey, sortDirection, onSort, extraClass = '' }) => {
  const isActive = sortKey === columnKey;
  const arrow = isActive ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕';
  return (
    <th
      onClick={() => onSort(columnKey)}
      className={`sortable-header ${isActive ? 'active' : ''} ${extraClass}`}
      style={{ cursor: 'pointer', userSelect: 'none' }}
      data-testid={`sort-${columnKey}`}
    >
      <span className="header-text-container">
        {label}
        <span className={`sort-arrow ${isActive ? 'active' : 'inactive'}`} data-testid={`sort-arrow-${columnKey}`}>
          {arrow}
        </span>
      </span>
    </th>
  );
});
SortHeader.displayName = 'SortHeader';

SortHeader.propTypes = {
  columnKey: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  sortKey: PropTypes.string.isRequired,
  sortDirection: PropTypes.string.isRequired,
  onSort: PropTypes.func.isRequired,
  extraClass: PropTypes.string
};

/**
 * Pure helper placed outside of component scope to get page sequence centered around currentPage.
 */
const getVisiblePageNumbers = (currentPage, totalPages) => {
  const maxVisible = 5;
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  let start = currentPage - Math.floor(maxVisible / 2);
  let end = currentPage + Math.floor(maxVisible / 2);

  if (start < 1) {
    start = 1;
    end = maxVisible;
  } else if (end > totalPages) {
    end = totalPages;
    start = totalPages - maxVisible + 1;
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

/**
 * TransactionsTable displays the transaction ledger with date-sorted rows
 * and traditional page-by-page client-side pagination.
 *
 * @param {object} props - Component properties
 * @param {Array<object>} props.transactions - The list of transaction records
 * @returns {React.ReactElement} The transactions table layout
 */
const TransactionsTable = ({ transactions }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    setCurrentPage(1);
  }, [transactions]);

  /**
   * Toggles sorting parameters for the table headers.
   * @param {string} key - Column parameter key
   */
  const handleSort = useCallback((key) => {
    setSortDirection((prevDir) => {
      if (sortKey === key) {
        return prevDir === 'asc' ? 'desc' : 'asc';
      }
      return key === 'date' || key === 'points' || key === 'price' ? 'desc' : 'asc';
    });
    setSortKey(key);
    setCurrentPage(1);
  }, [sortKey]);

  /**
   * Sorts the main transaction records according to column key and direction.
   * @type {Array<object>}
   */
  const sortedTransactionsList = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (typeof valA === 'string' && typeof valB === 'string') {
        const compareResult = valA.localeCompare(valB, undefined, { sensitivity: 'base' });
        return sortDirection === 'asc' ? compareResult : -compareResult;
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      return 0;
    });
  }, [transactions, sortKey, sortDirection]);

  const totalItems = sortedTransactionsList.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  /**
   * Paginated segment of transactions for the current viewing page.
   * @type {Array<object>}
   */
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedTransactionsList.slice(startIndex, endIndex);
  }, [sortedTransactionsList, currentPage, pageSize]);

  /**
   * Computes the subset of page buttons centered around current page.
   * @type {Array<number>}
   */
  const visiblePageNumbers = useMemo(() => {
    return getVisiblePageNumbers(currentPage, totalPages);
  }, [currentPage, totalPages]);

  /**
   * Updates the selected page size limit.
   * @param {object} e - React change event
   */
  const handlePageSizeChange = useCallback((e) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  }, []);

  /**
   * Navigates to the first page.
   */
  const handlePageFirst = useCallback(() => setCurrentPage(1), []);

  /**
   * Navigates back by one page.
   */
  const handlePagePrev = useCallback(() => setCurrentPage((prev) => Math.max(prev - 1, 1)), []);

  /**
   * Navigates forward by one page.
   */
  const handlePageNext = useCallback(() => setCurrentPage((prev) => Math.min(prev + 1, totalPages)), [totalPages]);

  /**
   * Navigates to the last page.
   */
  const handlePageLast = useCallback(() => setCurrentPage(totalPages), [totalPages]);

  return (
    <div className="table-card" data-testid="transactions-table-card">
      <div className="table-header-actions">
        <h2 className="table-card-title">Transactions Ledger</h2>
      </div>

      <div className={`table-responsive ${pageSize > 10 ? 'scrollable' : ''}`} data-testid="table-responsive">
        <table className="rewards-table">
          <thead>
            <tr>
              <SortHeader columnKey="id" label="Transaction ID" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
              <SortHeader columnKey="customerName" label="Customer Name" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
              <SortHeader columnKey="date" label="Purchase Date" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
              <SortHeader columnKey="product" label="Product Purchased" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
              <SortHeader columnKey="price" label="Price" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
              <SortHeader columnKey="points" label="Reward Points" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} extraClass="points-header" />
            </tr>
          </thead>
          <tbody>
            {paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-cell" data-testid="empty-cell">
                  No transactions found.
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((transaction) => (
                <tr key={transaction.id} data-testid="transaction-row">
                  <td className="tx-id">{transaction.id}</td>
                  <td className="customer-name">{transaction.customerName}</td>
                  <td className="date">{transaction.date}</td>
                  <td className="product-name">{transaction.product}</td>
                  <td className="price">${transaction.price.toFixed(2)}</td>
                  <td className="points-cell">
                    <span className={`points-badge ${transaction.points > 0 ? 'active' : 'zero'}`}>
                      {transaction.points}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalItems > 0 && (
        <div className="pagination-controls" data-testid="pagination-controls">
          <div className="pagination-left-group">
            <div className="pagination-stats" data-testid="pagination-stats">
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems} transactions
            </div>
            <div className="page-size-selector">
              <label htmlFor="page-size-select">Show</label>
              <select
                id="page-size-select"
                data-testid="page-size-select"
                value={pageSize}
                onChange={handlePageSizeChange}
                className="page-size-select"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
              </select>
              <span>records per page</span>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="pagination-buttons">
              <button
                className="pagination-btn"
                onClick={handlePageFirst}
                disabled={currentPage === 1}
                data-testid="pagination-first"
                aria-label="First page"
              >
                &lt;&lt;
              </button>
              <button
                className="pagination-btn"
                onClick={handlePagePrev}
                disabled={currentPage === 1}
                data-testid="pagination-prev"
                aria-label="Previous page"
              >
                &lt;
              </button>

              {visiblePageNumbers.map((pageNum) => (
                <button
                  key={pageNum}
                  className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                  data-testid={`pagination-page-${pageNum}`}
                  aria-label={`Page ${pageNum}`}
                  aria-current={currentPage === pageNum ? 'page' : undefined}
                >
                  {pageNum}
                </button>
              ))}

              <button
                className="pagination-btn"
                onClick={handlePageNext}
                disabled={currentPage === totalPages}
                data-testid="pagination-next"
                aria-label="Next page"
              >
                &gt;
              </button>
              <button
                className="pagination-btn"
                onClick={handlePageLast}
                disabled={currentPage === totalPages}
                data-testid="pagination-last"
                aria-label="Last page"
              >
                &gt;&gt;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

TransactionsTable.propTypes = {
  transactions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      customerId: PropTypes.string.isRequired,
      customerName: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      product: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired
    })
  ).isRequired
};

TransactionsTable.displayName = 'TransactionsTable';

export default memo(TransactionsTable);
