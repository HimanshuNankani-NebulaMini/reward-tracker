import { calculatePoints } from "../pointsCalculator";

describe("calculatePoints", () => {
  test("should return 0 points for purchases under $50", () => {
    expect(calculatePoints(0)).toBe(0);
    expect(calculatePoints(25)).toBe(0);
    expect(calculatePoints(49.99)).toBe(0);
  });

  test("should return 0 points for a purchase of exactly $50", () => {
    expect(calculatePoints(50)).toBe(0);
  });

  test("should return 1 point per dollar between $50 and $100", () => {
    expect(calculatePoints(51)).toBe(1);
    expect(calculatePoints(75)).toBe(25);
    expect(calculatePoints(100)).toBe(50);
  });

  test("should return 1 point per dollar between $50 and $100 plus 2 points per dollar over $100", () => {
    expect(calculatePoints(120)).toBe(90); // 50 + 20*2 = 90
    expect(calculatePoints(150)).toBe(150); // 50 + 50*2 = 150
    expect(calculatePoints(200)).toBe(250); // 50 + 100*2 = 250
  });

  test("should handle decimal calculations correctly (flooring the price before point calculation)", () => {
    // 100.20 -> floors price to 100 -> points = 50
    expect(calculatePoints(100.2)).toBe(50);
    // 100.40 -> floors price to 100 -> points = 50
    expect(calculatePoints(100.4)).toBe(50);
    // 100.80 -> floors price to 100 -> points = 50
    expect(calculatePoints(100.8)).toBe(50);
  });

  test("should throw an error for invalid inputs", () => {
    expect(() => calculatePoints(null)).toThrow("Invalid price value");
    expect(() => calculatePoints(undefined)).toThrow("Invalid price value");
    expect(() => calculatePoints("100")).toThrow("Invalid price value");
    expect(() => calculatePoints(NaN)).toThrow("Invalid price value");
  });

  test("should return 0 for negative purchase amounts", () => {
    expect(calculatePoints(-50)).toBe(0);
  });
});
