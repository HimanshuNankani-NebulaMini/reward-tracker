import { render, screen, fireEvent, act } from "@testing-library/react";
import App from "../App";
import { useFetchTransactions } from "../hooks/useFetchTransactions";
import ErrorMessage from "../components/common/ErrorMessage";
import LoadingSpinner from "../components/common/LoadingSpinner";
import TransactionsTable from "../components/table/TransactionsTable";
import { enrichTransactionsWithPoints } from "../utils/dataAggregator";

// Mock the custom fetch hook
jest.mock("../hooks/useFetchTransactions");

// Create 12 mock transactions to test pagination (default pageSize = 10)
// Dates span across April 2026, May 2026, and June 2026
const rawMockTransactions = Array.from({ length: 12 }, (_, i) => ({
  id: `TX-${1000 + i}`,
  customerId: `CUST-00${i + 1}`,
  customerName: i === 0 ? "John Doe" : `Customer ${i + 1}`,
  date: i === 0 ? "2026-04-15" : i === 1 ? "2026-05-05" : "2026-06-10",
  product:
    i === 0
      ? "Wireless Headphones"
      : i === 1
        ? "Mechanical Keyboard"
        : "USB Cable",
  price: i === 0 ? 40.0 : i % 2 === 0 ? 120.0 : 80.0,
}));
const mockTransactions = enrichTransactionsWithPoints(rawMockTransactions);

describe("App Component Integrations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders loading spinner when loading is true", () => {
    useFetchTransactions.mockReturnValue({
      transactions: [],
      loading: true,
      error: null,
    });

    render(<App />);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  test("renders error message when error is present", () => {
    useFetchTransactions.mockReturnValue({
      transactions: [],
      loading: false,
      error: new Error("Network failure"),
    });

    render(<App />);
    expect(screen.getByTestId("error-message")).toBeInTheDocument();
    expect(screen.getByText("Network failure")).toBeInTheDocument();
  });

  test("calls refetch when retry button is clicked", () => {
    const refetchSpy = jest.fn();
    useFetchTransactions.mockReturnValue({
      transactions: [],
      loading: false,
      error: new Error("Network failure"),
      refetch: refetchSpy,
    });

    render(<App />);
    const retryBtn = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(retryBtn);
    expect(refetchSpy).toHaveBeenCalledTimes(1);
  });

  test("renders dashboard tables and handles traditional pagination", async () => {
    useFetchTransactions.mockReturnValue({
      transactions: mockTransactions,
      loading: false,
      error: null,
    });

    render(<App />);

    // Check main sections are present (async find to wait for lazy loaded components)
    expect(
      await screen.findByTestId("monthly-rewards-card"),
    ).toBeInTheDocument();
    expect(await screen.findByTestId("total-rewards-card")).toBeInTheDocument();
    expect(
      await screen.findByTestId("transactions-table-card"),
    ).toBeInTheDocument();

    // Verify initial pagination stats (Page 1)
    expect(screen.getByTestId("pagination-stats")).toHaveTextContent(
      "Showing 1–10 of 12 transactions",
    );

    // Page 1 items (the February items - all USB Cable) should be visible
    expect(screen.getAllByText("USB Cable")).toHaveLength(10);
    expect(screen.queryByText("Wireless Headphones")).not.toBeInTheDocument();
    expect(screen.queryByText("Mechanical Keyboard")).not.toBeInTheDocument();

    // Check pagination buttons states
    const firstBtn = screen.getByTestId("pagination-first");
    const prevBtn = screen.getByTestId("pagination-prev");
    const nextBtn = screen.getByTestId("pagination-next");
    const lastBtn = screen.getByTestId("pagination-last");

    expect(firstBtn).toBeDisabled();
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();
    expect(lastBtn).not.toBeDisabled();

    // Click Next to go to Page 2
    fireEvent.click(nextBtn);
    expect(screen.getByTestId("pagination-stats")).toHaveTextContent(
      "Showing 11–12 of 12 transactions",
    );

    // Page 1 items should be hidden now, Page 2 items visible
    expect(screen.queryByText("USB Cable")).not.toBeInTheDocument();
    expect(screen.getByText("Wireless Headphones")).toBeInTheDocument();
    expect(screen.getByText("Mechanical Keyboard")).toBeInTheDocument();
    expect(firstBtn).not.toBeDisabled();
    expect(prevBtn).not.toBeDisabled();
    expect(nextBtn).toBeDisabled();
    expect(lastBtn).toBeDisabled();

    // Click Prev to return to Page 1
    fireEvent.click(prevBtn);
    expect(screen.getByTestId("pagination-stats")).toHaveTextContent(
      "Showing 1–10 of 12 transactions",
    );
    expect(screen.getAllByText("USB Cable")).toHaveLength(10);

    // Click Page 2 button directly
    const page2Btn = screen.getByTestId("pagination-page-2");
    fireEvent.click(page2Btn);
    expect(screen.getByTestId("pagination-stats")).toHaveTextContent(
      "Showing 11–12 of 12 transactions",
    );
    expect(screen.getByText("Wireless Headphones")).toBeInTheDocument();

    // Click First to return to Page 1
    fireEvent.click(firstBtn);
    expect(screen.getByTestId("pagination-stats")).toHaveTextContent(
      "Showing 1–10 of 12 transactions",
    );
    expect(screen.getAllByText("USB Cable")).toHaveLength(10);

    // Click Last to go to Page 2
    fireEvent.click(lastBtn);
    expect(screen.getByTestId("pagination-stats")).toHaveTextContent(
      "Showing 11–12 of 12 transactions",
    );
    expect(screen.getByText("Wireless Headphones")).toBeInTheDocument();
  });

  test("filters transactions, monthly summary, and cumulative summary using global search and date range", async () => {
    jest.useFakeTimers();
    useFetchTransactions.mockReturnValue({
      transactions: mockTransactions,
      loading: false,
      error: null,
    });

    render(<App />);

    // Wait for lazy components
    expect(
      await screen.findByTestId("monthly-rewards-card"),
    ).toBeInTheDocument();

    const searchInput = screen.getByTestId("search-input");
    const startDateInput = screen.getByTestId("start-date-input");
    const endDateInput = screen.getByTestId("end-date-input");

    // 1. Test Text Search globally: search "john"
    // This matches TX-1000 (Wireless Headphones, Customer 'John Doe')
    fireEvent.change(searchInput, { target: { value: "john" } });
    fireEvent.click(screen.getByTestId("apply-filters-btn"));

    // Ledger should show 1 row
    expect(screen.getByTestId("pagination-stats")).toHaveTextContent(
      "Showing 1–1 of 1 transactions",
    );
    expect(screen.getByText("Wireless Headphones")).toBeInTheDocument();

    // Monthly Summary table should only contain John Doe's row
    const monthlyRows = screen.getAllByTestId("monthly-row");
    expect(monthlyRows).toHaveLength(1);
    expect(screen.getAllByText("John Doe")[0]).toBeInTheDocument();

    // Cumulative Summary table should only contain John Doe
    const totalRows = screen.getAllByTestId("total-row");
    expect(totalRows).toHaveLength(1);

    // 2. Test Date Range filter globally: set range for May 2026
    // This matches TX-1001 (Mechanical Keyboard, May 05, CUST-002: Customer 2)
    fireEvent.change(searchInput, { target: { value: "" } }); // Clear search
    fireEvent.change(startDateInput, { target: { value: "2026-05-01" } });
    fireEvent.change(endDateInput, { target: { value: "2026-05-31" } });

    const applyBtn = screen.getByTestId("apply-filters-btn");
    fireEvent.click(applyBtn);

    // Ledger should show 1 transaction (Mechanical Keyboard)
    expect(screen.getByTestId("pagination-stats")).toHaveTextContent(
      "Showing 1–1 of 1 transactions",
    );
    expect(screen.getByText("Mechanical Keyboard")).toBeInTheDocument();
    expect(screen.queryByText("Wireless Headphones")).not.toBeInTheDocument();

    // Monthly summary should remain unfiltered by date range
    expect(screen.getAllByTestId("monthly-row")).toHaveLength(12);
    expect(screen.getAllByText("John Doe")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Customer 2")[0]).toBeInTheDocument();

    // 3. Test Product Search globally: search "wireless"
    // This matches TX-1000 (Wireless Headphones, Customer 'John Doe')
    act(() => {
      // Clear date range first
      fireEvent.change(startDateInput, { target: { value: "" } });
      fireEvent.change(endDateInput, { target: { value: "" } });
      fireEvent.click(applyBtn);
    });

    fireEvent.change(searchInput, { target: { value: "wireless" } });
    fireEvent.click(screen.getByTestId("apply-filters-btn"));

    // Ledger filters to 1 transaction
    expect(screen.getByTestId("pagination-stats")).toHaveTextContent(
      "Showing 1–1 of 1 transactions",
    );
    expect(screen.getByText("Wireless Headphones")).toBeInTheDocument();

    // Summaries remain unfiltered because 'wireless' is not a customer name
    expect(screen.getAllByTestId("monthly-row")).toHaveLength(12);
    expect(screen.getAllByTestId("total-row")).toHaveLength(12);

    // Clear filters using the Clear button
    const clearBtn = screen.getByTestId("clear-filters-btn");
    fireEvent.click(clearBtn);

    // Everything should return to the default state (all 12 transactions)
    expect(screen.getByTestId("pagination-stats")).toHaveTextContent(
      "Showing 1–10 of 12 transactions",
    );
    expect(screen.queryByTestId("clear-filters-btn")).not.toBeInTheDocument();

    jest.useRealTimers();
  });

  test("renders empty tables correctly when transactions dataset is empty", async () => {
    useFetchTransactions.mockReturnValue({
      transactions: [],
      loading: false,
      error: null,
    });

    render(<App />);
    expect(await screen.findByTestId("empty-cell")).toHaveTextContent(
      "No transactions found.",
    );
    expect(screen.getByText("No rewards aggregated yet.")).toBeInTheDocument();
    expect(screen.getByText("No rewards computed.")).toBeInTheDocument();
  });

  test("renders LoadingSpinner with default message if none is provided", () => {
    render(<LoadingSpinner />);
    expect(screen.getByText("Loading rewards data...")).toBeInTheDocument();
  });

  test("renders ErrorMessage with default message if none is provided", () => {
    render(<ErrorMessage />);
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
  });

  test("renders ErrorMessage gracefully when transaction data contains an invalid date format", async () => {
    useFetchTransactions.mockReturnValue({
      transactions: [],
      loading: false,
      error: new Error("Invalid date format: 2026"),
    });

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(<App />);
    expect(await screen.findByTestId("error-message")).toBeInTheDocument();
    expect(screen.getByText("Invalid date format: 2026")).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  test("renders ErrorMessage gracefully when transaction date is missing", async () => {
    useFetchTransactions.mockReturnValue({
      transactions: [],
      loading: false,
      error: new Error("Transaction date is missing"),
    });

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(<App />);
    expect(await screen.findByTestId("error-message")).toBeInTheDocument();
    expect(screen.getByText("Transaction date is missing")).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  test("renders empty tables when selected date range contains no transactions", async () => {
    useFetchTransactions.mockReturnValue({
      transactions: mockTransactions,
      loading: false,
      error: null,
    });

    render(<App />);
    expect(
      await screen.findByTestId("transactions-table-card"),
    ).toBeInTheDocument();

    const startDateInput = screen.getByTestId("start-date-input");
    const endDateInput = screen.getByTestId("end-date-input");

    fireEvent.change(startDateInput, { target: { value: "2026-02-21" } });
    fireEvent.change(endDateInput, { target: { value: "2026-02-25" } });
    const applyBtn = screen.getByTestId("apply-filters-btn");
    fireEvent.click(applyBtn);

    expect(screen.queryByTestId("error-message")).not.toBeInTheDocument();
    expect(screen.getByTestId("empty-cell")).toHaveTextContent(
      "No transactions found.",
    );
    // Summaries should NOT show empty states because date range filters do not filter rewards summaries
    expect(
      screen.queryByText("No rewards aggregated yet."),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("No rewards computed.")).not.toBeInTheDocument();
  });

  test("filters transactions by product name, transaction ID, and customer ID (multi-column search)", async () => {
    jest.useFakeTimers();
    useFetchTransactions.mockReturnValue({
      transactions: mockTransactions,
      loading: false,
      error: null,
    });

    render(<App />);
    expect(
      await screen.findByTestId("transactions-table-card"),
    ).toBeInTheDocument();

    const searchInput = screen.getByTestId("search-input");

    // Search by Product name: "wireless"
    // This matches TX-1000 (Wireless Headphones)
    fireEvent.change(searchInput, { target: { value: "wireless" } });
    fireEvent.click(screen.getByTestId("apply-filters-btn"));

    expect(screen.getByTestId("pagination-stats")).toHaveTextContent(
      "Showing 1–1 of 1 transactions",
    );
    expect(screen.getByText("Wireless Headphones")).toBeInTheDocument();

    // Search by Transaction ID: "TX-1001"
    // This matches TX-1001 (Mechanical Keyboard)
    fireEvent.change(searchInput, { target: { value: "TX-1001" } });
    fireEvent.click(screen.getByTestId("apply-filters-btn"));

    expect(screen.getByTestId("pagination-stats")).toHaveTextContent(
      "Showing 1–1 of 1 transactions",
    );
    expect(screen.getByText("Mechanical Keyboard")).toBeInTheDocument();

    // Search by Customer ID: "CUST-003"
    // This matches Customer 3 (USB Cable)
    fireEvent.change(searchInput, { target: { value: "CUST-003" } });
    fireEvent.click(screen.getByTestId("apply-filters-btn"));

    expect(screen.getByTestId("pagination-stats")).toHaveTextContent(
      "Showing 1–1 of 1 transactions",
    );
    expect(screen.getByText("USB Cable")).toBeInTheDocument();

    jest.useRealTimers();
  });

  test("handles page size changes and resets current page to 1", async () => {
    useFetchTransactions.mockReturnValue({
      transactions: mockTransactions,
      loading: false,
      error: null,
    });

    render(<App />);
    expect(
      await screen.findByTestId("transactions-table-card"),
    ).toBeInTheDocument();

    // Verify initial default page size is 10
    expect(screen.getByTestId("pagination-stats")).toHaveTextContent(
      "Showing 1–10 of 12 transactions",
    );

    // Go to Page 2
    const nextBtn = screen.getByTestId("pagination-next");
    fireEvent.click(nextBtn);
    expect(screen.getByTestId("pagination-stats")).toHaveTextContent(
      "Showing 11–12 of 12 transactions",
    );

    // Change page size to 20
    const pageSizeSelect = screen.getByTestId("page-size-select");
    fireEvent.change(pageSizeSelect, { target: { value: "20" } });

    // Page stats should update to show all 12 items on one page, and page should reset to 1
    expect(screen.getByTestId("pagination-stats")).toHaveTextContent(
      "Showing 1–12 of 12 transactions",
    );

    // Page 2 button should not exist anymore since total pages is 1
    expect(screen.queryByTestId("pagination-page-2")).not.toBeInTheDocument();
  });

  test("toggles light and dark themes when theme toggle button is clicked", () => {
    useFetchTransactions.mockReturnValue({
      transactions: [],
      loading: false,
      error: null,
    });

    localStorage.clear();
    render(<App />);

    // Check initial state (dark mode by default, light-theme class is absent on wrapper)
    const themeWrapper = screen.getByTestId("theme-wrapper");
    expect(themeWrapper).not.toHaveClass("light-theme");

    // Find and click the toggle button
    const toggleBtn = screen.getByTestId("theme-toggle");
    expect(toggleBtn).toBeInTheDocument();

    fireEvent.click(toggleBtn);

    // Light-theme class should now be added to wrapper
    expect(themeWrapper).toHaveClass("light-theme");
    expect(localStorage.getItem("theme")).toBe("light");

    // Click it again
    fireEvent.click(toggleBtn);

    // Light-theme class should be removed
    expect(themeWrapper).not.toHaveClass("light-theme");
    expect(localStorage.getItem("theme")).toBe("dark");

    localStorage.clear();
  });

  test("initializes theme from localStorage if pre-saved value is present", async () => {
    useFetchTransactions.mockReturnValue({
      transactions: [],
      loading: false,
      error: null,
    });

    localStorage.setItem("theme", "light");
    render(<App />);

    const themeWrapper = screen.getByTestId("theme-wrapper");
    expect(themeWrapper).toHaveClass("light-theme");

    localStorage.clear();
  });

  test("handles truncated page window centering and boundary guards under large page counts", async () => {
    // Generate 60 transactions to result in 6 pages (pageSize = 10)
    const largeMockTransactions = Array.from({ length: 60 }, (_, i) => ({
      id: `TX-${1000 + i}`,
      customerId: `CUST-001`,
      customerName: "John Doe",
      date: "2026-06-10",
      product: "USB Cable",
      price: 80.0,
    }));

    useFetchTransactions.mockReturnValue({
      transactions: largeMockTransactions,
      loading: false,
      error: null,
    });

    render(<App />);
    expect(
      await screen.findByTestId("transactions-table-card"),
    ).toBeInTheDocument();

    // With 6 pages total:
    // On page 1: currentPage = 1. Window start < 1 guard triggers.
    // Pages should show [1, 2, 3, 4, 5].
    expect(screen.getByTestId("pagination-page-1")).toBeInTheDocument();
    expect(screen.getByTestId("pagination-page-5")).toBeInTheDocument();
    expect(screen.queryByTestId("pagination-page-6")).not.toBeInTheDocument();

    // Go to page 4 (middle page)
    const page4Btn = screen.getByTestId("pagination-page-4");
    fireEvent.click(page4Btn);
    // Page 4 is active. Centered window: start = 4-2=2, end = 4+2=6.
    // Pages should show [2, 3, 4, 5, 6].
    expect(screen.queryByTestId("pagination-page-1")).not.toBeInTheDocument();
    expect(screen.getByTestId("pagination-page-2")).toBeInTheDocument();
    expect(screen.getByTestId("pagination-page-6")).toBeInTheDocument();

    // Go to page 6 (last page)
    const nextBtn = screen.getByTestId("pagination-next");
    fireEvent.click(nextBtn); // Go to page 5
    fireEvent.click(nextBtn); // Go to page 6
    // Page 6 is active. Right boundary guard triggers: end = 6, start = 6-5+1 = 2.
    // Pages should show [2, 3, 4, 5, 6].
    expect(screen.queryByTestId("pagination-page-1")).not.toBeInTheDocument();
    expect(screen.getByTestId("pagination-page-2")).toBeInTheDocument();
    expect(screen.getByTestId("pagination-page-6")).toBeInTheDocument();
  });

  test("handles interactive sorting in the transactions table across all columns", async () => {
    useFetchTransactions.mockReturnValue({
      transactions: mockTransactions,
      loading: false,
      error: null,
    });

    render(<App />);
    expect(
      await screen.findByTestId("transactions-table-card"),
    ).toBeInTheDocument();

    // 1. Transaction ID sorting
    const idHeader = screen.getByTestId("sort-id");

    // Sort ID Ascending
    fireEvent.click(idHeader);
    let rows = screen.getAllByTestId("transaction-row");
    expect(rows[0].querySelector(".tx-id")).toHaveTextContent("TX-1000");
    expect(screen.getByTestId("sort-arrow-id")).toHaveTextContent("▲");

    // Sort ID Descending
    fireEvent.click(idHeader);
    rows = screen.getAllByTestId("transaction-row");
    expect(rows[0].querySelector(".tx-id")).toHaveTextContent("TX-1011");
    expect(screen.getByTestId("sort-arrow-id")).toHaveTextContent("▼");

    // 2. Customer Name sorting
    const nameHeader = screen.getByTestId("sort-customerName");

    // Sort Name Ascending
    fireEvent.click(nameHeader);
    rows = screen.getAllByTestId("transaction-row");
    // 'Customer 10' < 'Customer 2'
    expect(rows[0].querySelector(".customer-name")).toHaveTextContent(
      "Customer 10",
    );
    expect(screen.getByTestId("sort-arrow-customerName")).toHaveTextContent(
      "▲",
    );

    // Sort Name Descending
    fireEvent.click(nameHeader);
    rows = screen.getAllByTestId("transaction-row");
    // 'John Doe' > 'Customer'
    expect(rows[0].querySelector(".customer-name")).toHaveTextContent(
      "John Doe",
    );
    expect(screen.getByTestId("sort-arrow-customerName")).toHaveTextContent(
      "▼",
    );

    // 3. Purchase Date sorting
    const dateHeader = screen.getByTestId("sort-date");

    // Changing back to date sorts Descending first
    fireEvent.click(dateHeader);
    rows = screen.getAllByTestId("transaction-row");
    expect(rows[0].querySelector(".date")).toHaveTextContent("2026-06-10");
    expect(screen.getByTestId("sort-arrow-date")).toHaveTextContent("▼");

    // Click again to toggle to Ascending
    fireEvent.click(dateHeader);
    rows = screen.getAllByTestId("transaction-row");
    expect(rows[0].querySelector(".date")).toHaveTextContent("2026-04-15");
    expect(screen.getByTestId("sort-arrow-date")).toHaveTextContent("▲");

    // 4. Product Purchased sorting
    const productHeader = screen.getByTestId("sort-product");

    // Sort Product Ascending
    fireEvent.click(productHeader);
    rows = screen.getAllByTestId("transaction-row");
    expect(rows[0].querySelector(".product-name")).toHaveTextContent(
      "Mechanical Keyboard",
    );
    expect(screen.getByTestId("sort-arrow-product")).toHaveTextContent("▲");

    // 5. Price sorting
    const priceHeader = screen.getByTestId("sort-price");

    // Clicking price first time sorts Descending (since price defaults to desc)
    fireEvent.click(priceHeader);
    rows = screen.getAllByTestId("transaction-row");
    expect(rows[0].querySelector(".price")).toHaveTextContent("$120.00");
    expect(screen.getByTestId("sort-arrow-price")).toHaveTextContent("▼");

    // Clicking again sorts Ascending
    fireEvent.click(priceHeader);
    rows = screen.getAllByTestId("transaction-row");
    expect(rows[0].querySelector(".price")).toHaveTextContent("$40.00");
    expect(screen.getByTestId("sort-arrow-price")).toHaveTextContent("▲");

    // 6. Reward Points sorting
    const pointsHeader = screen.getByTestId("sort-points");

    // Clicking points first time sorts Descending (since points defaults to desc)
    fireEvent.click(pointsHeader);
    rows = screen.getAllByTestId("transaction-row");
    expect(rows[0].querySelector(".points-badge")).toHaveTextContent("90");
    expect(screen.getByTestId("sort-arrow-points")).toHaveTextContent("▼");

    // Clicking again sorts Ascending
    fireEvent.click(pointsHeader);
    rows = screen.getAllByTestId("transaction-row");
    expect(rows[0].querySelector(".points-badge")).toHaveTextContent("0");
    expect(screen.getByTestId("sort-arrow-points")).toHaveTextContent("▲");
  });

  test("TransactionsTable fallback sorting handles unsupported types gracefully", () => {
    const customTransactions = [
      {
        id: "TX-1",
        customerName: "Alice",
        date: "2026-02-10",
        product: "Item A",
        price: 10,
        points: true,
      },
      {
        id: "TX-2",
        customerName: "Bob",
        date: "2026-02-10",
        product: "Item B",
        price: 20,
        points: false,
      },
    ];

    render(<TransactionsTable transactions={customTransactions} />);

    const pointsHeader = screen.getByTestId("sort-points");
    fireEvent.click(pointsHeader);

    expect(screen.getByTestId("sort-arrow-points")).toHaveTextContent("▼"); // Defaults to desc
  });
});
