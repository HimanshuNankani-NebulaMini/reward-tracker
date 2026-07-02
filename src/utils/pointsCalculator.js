/**
 * Calculates reward points based on purchase price.
 * @param {number} price - The price of the purchase transaction
 * @returns {number} The floored reward points
 */
export const calculatePoints = (price) => {
  if (price === null || price === undefined || typeof price !== 'number' || isNaN(price)) {
    throw new Error('Invalid price value');
  }

  const flooredPrice = Math.floor(price);
  if (flooredPrice <= 0) {
    return 0;
  }

  let points = 0;

  if (flooredPrice > 100) {
    points += (flooredPrice - 100) * 2;
    points += 50;
  } else if (flooredPrice > 50) {
    points += (flooredPrice - 50) * 1;
  }

  return points;
};
