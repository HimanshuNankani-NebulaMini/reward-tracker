import {
  getDateParts,
  enrichTransactionsWithPoints,
  aggregateMonthlyRewards,
  aggregateTotalRewards,
  sortTransactionsByDate,
  sortMonthlyRewards,
  validateTransaction,
} from "../dataAggregator";

describe("dataAggregator", () => {
  const mockTransactions = [
    {
      id: "TX1",
      customerId: "C1",
      customerName: "John",
      date: "2026-04-15",
      product: "A",
      price: 120,
    },
    {
      id: "TX2",
      customerId: "C1",
      customerName: "John",
      date: "2026-05-10",
      product: "B",
      price: 100.2,
    },
    {
      id: "TX3",
      customerId: "C2",
      customerName: "Alice",
      date: "2026-04-05",
      product: "C",
      price: 80,
    },
  ];

  test("getDateParts should parse YYYY-MM-DD correctly without timezone shifts", () => {
    expect(getDateParts("2026-04-15")).toEqual({
      monthName: "April",
      year: 2026,
      monthIndex: 3,
    });
    expect(getDateParts("2026-05-01")).toEqual({
      monthName: "May",
      year: 2026,
      monthIndex: 4,
    });
  });

  test("enrichTransactionsWithPoints should map transactions to add points field", () => {
    const enriched = enrichTransactionsWithPoints(mockTransactions);
    expect(enriched).toHaveLength(3);
    expect(enriched[0].points).toBe(90);
    expect(enriched[1].points).toBe(50);
    expect(enriched[2].points).toBe(30);
  });

  test("enrichTransactionsWithPoints should filter out invalid transactions and log warning", () => {
    const invalidTx = {
      id: "TX_INVALID",
      customerId: "C1",
      customerName: "John",
      date: "invalid-date",
      price: 100
    };
    const input = [mockTransactions[0], invalidTx, mockTransactions[1]];
    const enriched = enrichTransactionsWithPoints(input);
    expect(enriched).toHaveLength(2);
    expect(enriched[0].id).toBe("TX1");
    expect(enriched[1].id).toBe("TX2");
  });

  test("enrichTransactionsWithPoints should throw error for non-array inputs", () => {
    expect(() => enrichTransactionsWithPoints(null)).toThrow(
      "Transactions input must be a valid array",
    );
  });

  test("validateTransaction should validate records and throw appropriate errors", () => {
    // Valid transaction does not throw
    expect(() => validateTransaction(mockTransactions[0])).not.toThrow();

    // Invalid transactions throw errors
    expect(() => validateTransaction(null)).toThrow(
      "Transaction record is missing",
    );
    expect(() => validateTransaction({ id: "TX" })).toThrow(
      "Transaction date is missing",
    );
    expect(() => validateTransaction({ id: "TX", date: "2026-01-10" })).toThrow(
      "Transaction price is invalid",
    );
    expect(() =>
      validateTransaction({ id: "TX", date: "2026-01-10", price: "invalid" }),
    ).toThrow("Transaction price is invalid");
    expect(() =>
      validateTransaction({ id: "TX", date: "invalid-date", price: 100 }),
    ).toThrow("Invalid date format");
  });

  test("aggregateMonthlyRewards should group customer points by month and year", () => {
    const enriched = enrichTransactionsWithPoints(mockTransactions);
    const aggregated = aggregateMonthlyRewards(enriched);
    expect(aggregated).toHaveLength(3);

    const johnApr = aggregated.find(
      (r) => r.customerId === "C1" && r.year === 2026 && r.monthIndex === 3,
    );
    const johnMay = aggregated.find(
      (r) => r.customerId === "C1" && r.year === 2026 && r.monthIndex === 4,
    );
    const aliceApr = aggregated.find(
      (r) => r.customerId === "C2" && r.year === 2026 && r.monthIndex === 3,
    );

    expect(johnApr.points).toBe(90);
    expect(johnMay.points).toBe(50);
    expect(aliceApr.points).toBe(30);
  });

  test("aggregateMonthlyRewards should throw error for non-array inputs", () => {
    expect(() => aggregateMonthlyRewards(null)).toThrow(
      "Transactions input must be a valid array",
    );
  });

  test("aggregateTotalRewards should group customer points cumulatively", () => {
    const enriched = enrichTransactionsWithPoints(mockTransactions);
    const aggregated = aggregateTotalRewards(enriched);
    expect(aggregated).toHaveLength(2);
    const johnTotal = aggregated.find((r) => r.customerId === "C1");
    const aliceTotal = aggregated.find((r) => r.customerId === "C2");

    expect(johnTotal.points).toBe(140);
    expect(aliceTotal.points).toBe(30);
  });

  test("aggregateTotalRewards should throw error for non-array inputs", () => {
    expect(() => aggregateTotalRewards(null)).toThrow(
      "Transactions input must be a valid array",
    );
  });

  test("sortTransactionsByDate should sort transactions descending (newest first)", () => {
    const sorted = sortTransactionsByDate(mockTransactions);
    expect(sorted[0].date).toBe("2026-05-10");
    expect(sorted[1].date).toBe("2026-04-15");
    expect(sorted[2].date).toBe("2026-04-05");
  });

  test("sortTransactionsByDate should throw error for non-array inputs", () => {
    expect(() => sortTransactionsByDate(null)).toThrow(
      "Transactions input must be a valid array",
    );
  });

  test("sortMonthlyRewards should sort alphabetically by name, then chronologically by year and month index", () => {
    const monthlyList = [
      {
        customerId: "C1",
        name: "John",
        monthName: "February",
        monthIndex: 1,
        year: 2026,
        points: 75,
      },
      {
        customerId: "C1",
        name: "John",
        monthName: "January",
        monthIndex: 0,
        year: 2026,
        points: 50,
      },
      {
        customerId: "C1",
        name: "John",
        monthName: "December",
        monthIndex: 11,
        year: 2025,
        points: 90,
      },
      {
        customerId: "C2",
        name: "Alice",
        monthName: "December",
        monthIndex: 11,
        year: 2025,
        points: 30,
      },
    ];

    const sorted = sortMonthlyRewards(monthlyList);

    // Alice Dec 2025 comes first ('Alice' < 'John')
    expect(sorted[0].name).toBe("Alice");
    expect(sorted[0].year).toBe(2025);
    expect(sorted[0].monthIndex).toBe(11);

    // John Feb 2026 comes second (latest year/month first)
    expect(sorted[1].name).toBe("John");
    expect(sorted[1].year).toBe(2026);
    expect(sorted[1].monthIndex).toBe(1);

    // John Jan 2026 comes third (latest year/month first)
    expect(sorted[2].name).toBe("John");
    expect(sorted[2].year).toBe(2026);
    expect(sorted[2].monthIndex).toBe(0);

    // John Dec 2025 comes last (oldest year/month last)
    expect(sorted[3].name).toBe("John");
    expect(sorted[3].year).toBe(2025);
    expect(sorted[3].monthIndex).toBe(11);
  });

  test("sortMonthlyRewards should throw error for non-array inputs", () => {
    expect(() => sortMonthlyRewards(null)).toThrow(
      "Monthly rewards input must be a valid array",
    );
  });

  test("getDateParts should throw errors for missing and invalid date strings", () => {
    expect(() => getDateParts(null)).toThrow(
      "Date string is missing or invalid",
    );
    expect(() => getDateParts("")).toThrow("Date string is missing or invalid");
    expect(() => getDateParts(12345)).toThrow(
      "Date string is missing or invalid",
    );
    expect(() => getDateParts("2026")).toThrow("Invalid date format");
    expect(() => getDateParts("2026-ab-cd")).toThrow("Invalid date format");
    expect(() => getDateParts("2026-13-01")).toThrow("Invalid date format");
    expect(() => getDateParts("2025-02-29")).toThrow("Invalid date format");

    expect(getDateParts("2024-02-29")).toEqual({
      monthName: "February",
      year: 2024,
      monthIndex: 1,
    });
  });
});
