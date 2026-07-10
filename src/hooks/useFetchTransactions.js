import { useState, useEffect, useCallback } from 'react';
import { logger } from '../utils/logger';

/**
 * Custom React hook to fetch transaction logs asynchronously.
 *
 * @returns {object} The fetch state query results
 * @returns {Array<object>} returns.transactions - Raw transaction records
 * @returns {boolean} returns.loading - Loading state flag
 * @returns {Error|null} returns.error - Error details if failed, otherwise null
 * @returns {func} returns.refetch - Callback to retry the fetch request
 */
export const useFetchTransactions = () => {
  const [state, setState] = useState({
    transactions: [],
    loading: true,
    error: null
  });

  /**
   * Performs the async HTTP request to retrieve raw transactions ledger.
   * @param {AbortSignal} [signal] - Optional abort signal
   */
  const fetchData = useCallback((signal) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    logger.info('Initiating async fetch for transactions data...');

    fetch('/transactions.json', { signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch transactions (HTTP ${response.status})`);
        }
        return response.json();
      })
      .then((data) => {
        logger.info('Transactions data fetched successfully.', { count: data.length });
        setState({
          transactions: data,
          loading: false,
          error: null
        });
      })
      .catch((err) => {
        if (err && err.name === 'AbortError') {
          logger.info('Fetch transactions request aborted/cancelled.');
          return;
        }
        logger.error('Error fetching transactions:', err);
        const details = (err && err.message) ? ` Details: ${err.message}` : err ? ` Details: ${err}` : '';
        setState({
          transactions: [],
          loading: false,
          error: new Error(`An unexpected error occurred while loading data.${details}`)
        });
      });
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    fetchData(abortController.signal);

    return () => {
      logger.info('Unmounting useFetchTransactions or refetching, aborting active request.');
      abortController.abort();
    };
  }, [fetchData]);

  /**
   * Resets the fetching states and triggers a new data load.
   */
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    transactions: state.transactions,
    loading: state.loading,
    error: state.error,
    refetch
  };
};
