import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { calculatePoints } from './pointsCalculator';
import { logger } from './logger';

dayjs.extend(customParseFormat);

/**
 * Splits date string by '-' to extract year and month safely. 
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {object} Object containing monthName, year, and monthIndex
 */
export const getDateParts = (dateString) => {
  if (!dateString || typeof dateString !== 'string') {
    throw new Error('Date string is missing or invalid');
  }

  const parsed = dayjs(dateString, 'YYYY-MM-DD', true);
  if (!parsed.isValid()) {
    throw new Error(`Invalid date format: ${dateString}`);
  }

  const year = parsed.year();
  const monthIndex = parsed.month();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return {
    monthName: monthNames[monthIndex],
    year,
    monthIndex
  };
};

/**
 * Validates a single transaction record.
 * Throws an Error if invalid.
 * @param {object} transaction - The transaction record to validate
 */
export const validateTransaction = (transaction) => {
  if (!transaction) {
    throw new Error('Transaction record is missing');
  }
  if (!transaction.date) {
    throw new Error('Transaction date is missing');
  }
  const parsedDate = dayjs(transaction.date, 'YYYY-MM-DD', true);
  if (!parsedDate.isValid()) {
    throw new Error(`Invalid date format: ${transaction.date}`);
  }
  if (typeof transaction.price !== 'number' || isNaN(transaction.price)) {
    throw new Error('Transaction price is invalid');
  }
};

/**
 * Enriches transaction records by injecting computed reward points for each row.
 *  
 * @param {Array} transactions - List of transactions
 * @returns {Array} List of transactions enriched with calculated points
 */
export const enrichTransactionsWithPoints = (transactions) => {
  if (!Array.isArray(transactions)) {
    throw new Error('Transactions input must be a valid array');
  }
  return transactions
    .filter((transaction) => {
      try {
        validateTransaction(transaction);
        return true;
      } catch (err) {
        logger.warn(`Skipping invalid transaction record: ${err.message}`, transaction);
        return false;
      }
    })
    .map((transaction) => ({
      ...transaction,
      points: calculatePoints(transaction.price)
    }));
};

/**
 * Groups and aggregates customer reward points by both month and year.
 * Returns an array of customer monthly totals (useful for user monthly rewards table).
 * 
 * @param {Array} transactions - List of transactions
 * @returns {Array} List of aggregated monthly customer points
 */
export const aggregateMonthlyRewards = (transactions) => {
  if (!Array.isArray(transactions)) {
    throw new Error('Transactions input must be a valid array');
  }

  const grouped = transactions.reduce((acc, transaction) => {
    const { customerId, customerName, date, points } = transaction;
    const { monthName, monthIndex, year } = getDateParts(date);
    const key = `${customerId}-${year}-${monthIndex}`;
    
    if (!acc[key]) {
      acc[key] = {
        customerId,
        name: customerName,
        monthName,
        monthIndex,
        year,
        points: 0
      };
    }
    acc[key].points += points;
    return acc;
  }, {});

  return Object.values(grouped);
};

/**
 * Sums all points earned by each customer across the entire 3-month period.
 * Returns an array of customer cumulative point totals.
 *  
 * @param {Array} transactions - List of transactions
 * @returns {Array} List of aggregated total customer points
 */
export const aggregateTotalRewards = (transactions) => {
  if (!Array.isArray(transactions)) {
    throw new Error('Transactions input must be a valid array');
  }

  const grouped = transactions.reduce((acc, transaction) => {
    const { customerId, customerName, points } = transaction;
    const key = customerId;

    if (!acc[key]) {
      acc[key] = {
        customerId,
        name: customerName,
        points: 0
      };
    }
    acc[key].points += points;
    return acc;
  }, {});

  return Object.values(grouped);
};

/**
 * Sorts transactions chronologically by date descending (newest first).
 * 
 * @param {Array} transactions - List of transactions
 * @returns {Array} Sorted list of transactions
 */
export const sortTransactionsByDate = (transactions) => {
  if (!Array.isArray(transactions)) {
    throw new Error('Transactions input must be a valid array');
  }
  return [...transactions].sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
};

/**
 * Groups monthly records reverse chronologically by year and month, then alphabetically by customer name.
 * 
 * @param {Array} monthlyRewards - List of aggregated monthly customer points
 * @returns {Array} Sorted list of monthly rewards
 */
export const sortMonthlyRewards = (monthlyRewards) => {
  if (!Array.isArray(monthlyRewards)) {
    throw new Error('Monthly rewards input must be a valid array');
  }
  return [...monthlyRewards].sort((a, b) => {
    const nameCompare = a.name.localeCompare(b.name);
    if (nameCompare !== 0) {
      return nameCompare;
    }
    if (a.year !== b.year) {
      return b.year - a.year;
    }
    return b.monthIndex - a.monthIndex;
  });
};
