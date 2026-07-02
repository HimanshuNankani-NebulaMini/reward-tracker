import { useState, useEffect, useCallback } from 'react';
import { logger } from '../utils/logger';
import { enrichTransactionsWithPoints } from '../utils/dataAggregator';

/**
 * Custom React hook to fetch transaction logs asynchronously and enrich them with reward points.
 *
 * @returns {object} The fetch state query results
 * @returns {Array<object>} returns.transactions - Enriched transaction records
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

  const [fetchTrigger, setFetchTrigger] = useState(0);

  useEffect(() => {
    const abortController = new AbortController();

    logger.info('Initiating async fetch for transactions data...');

    fetch('/transactions.json', { signal: abortController.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch transactions (HTTP ${response.status})`);
        }
        return response.json();
      })
      .then((data) => {
        logger.info('Transactions data fetched successfully.', { count: data.length });
        const enriched = enrichTransactionsWithPoints(data);
        setState({
          transactions: enriched,
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

    return () => {
      logger.info('Unmounting useFetchTransactions or refetching, aborting active request.');
      abortController.abort();
    };
  }, [fetchTrigger]);

  /**
   * Resets the fetching states and triggers a new data load.
   */
  const refetch = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    setFetchTrigger((prev) => prev + 1);
  }, []);

  return {
    transactions: state.transactions,
    loading: state.loading,
    error: state.error,
    refetch
  };
};
