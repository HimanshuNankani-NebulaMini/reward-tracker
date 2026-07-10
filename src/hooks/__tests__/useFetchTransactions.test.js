import { renderHook, waitFor, act } from "@testing-library/react";
import { useFetchTransactions } from "../useFetchTransactions";

describe("useFetchTransactions custom hook", () => {
  let originalFetch;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return loading state initially and then success state with complete data", async () => {
    const mockData = Array.from({ length: 12 }, (_, i) => ({
      id: `TX-${i + 1}`,
      customerId: `CUST-00${i + 1}`,
      customerName: `Customer ${i + 1}`,
      date: "2026-01-10",
      product: "Coffee Maker",
      price: 100,
    }));

    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData),
      }),
    );

    const { result } = renderHook(() => useFetchTransactions());

    expect(result.current.loading).toBe(true);
    expect(result.current.transactions).toEqual([]);
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.transactions).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  test("should return error state when fetch fails", async () => {
    global.fetch = jest
      .fn()
      .mockImplementation(() =>
        Promise.reject(new Error("Network disconnected")),
      );

    const { result } = renderHook(() => useFetchTransactions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.transactions).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error.message).toBe(
      "An unexpected error occurred while loading data. Details: Network disconnected",
    );
  });

  test("should return error state when response is not ok", async () => {
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 404,
      }),
    );

    const { result } = renderHook(() => useFetchTransactions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.transactions).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error.message).toBe(
      "An unexpected error occurred while loading data. Details: Failed to fetch transactions (HTTP 404)",
    );
  });

  test("should trigger refetch and fetch data again when refetch is called", async () => {
    let callCount = 0;
    const mockData1 = [
      {
        id: "TX-1",
        customerId: "C1",
        customerName: "John",
        date: "2026-01-10",
        product: "A",
        price: 100,
      },
    ];
    const mockData2 = [
      {
        id: "TX-2",
        customerId: "C2",
        customerName: "Alice",
        date: "2026-01-11",
        product: "B",
        price: 150,
      },
    ];

    global.fetch = jest.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(callCount === 1 ? mockData1 : mockData2),
      });
    });

    const { result } = renderHook(() => useFetchTransactions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.transactions).toEqual(mockData1);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refetch();
    });
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.transactions).toEqual(mockData2);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test("should abort active fetch request when unmounted", async () => {
    const abortSpy = jest.spyOn(AbortController.prototype, "abort");

    global.fetch = jest.fn().mockImplementation(() => new Promise(() => {}));

    const { unmount } = renderHook(() => useFetchTransactions());

    expect(global.fetch).toHaveBeenCalledWith(
      "/transactions.json",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );

    unmount();

    expect(abortSpy).toHaveBeenCalled();
    abortSpy.mockRestore();
  });

  test("should ignore AbortError and not update state or log error", async () => {
    const abortError = new Error("The user aborted a request.");
    abortError.name = "AbortError";

    global.fetch = jest
      .fn()
      .mockImplementation(() => Promise.reject(abortError));

    const { result } = renderHook(() => useFetchTransactions());

    // Flush microtasks to execute the catch block
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.transactions).toEqual([]);
  });

  test("should format error with string details when rejected with string", async () => {
    global.fetch = jest
      .fn()
      .mockImplementation(() => Promise.reject("Raw string error details"));

    const { result } = renderHook(() => useFetchTransactions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error.message).toBe(
      "An unexpected error occurred while loading data. Details: Raw string error details",
    );
  });

  test("should format error with empty details when rejected with null", async () => {
    global.fetch = jest.fn().mockImplementation(() => Promise.reject(null));

    const { result } = renderHook(() => useFetchTransactions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error.message).toBe(
      "An unexpected error occurred while loading data.",
    );
  });
});
