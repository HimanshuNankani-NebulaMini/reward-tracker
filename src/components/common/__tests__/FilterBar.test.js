import { render, screen, fireEvent } from "@testing-library/react";
import FilterBar from "../FilterBar";

describe("FilterBar Component", () => {
  let onSearchChangeSpy;
  let onStartDateChangeSpy;
  let onEndDateChangeSpy;
  let onClearSpy;

  beforeEach(() => {
    onSearchChangeSpy = jest.fn();
    onStartDateChangeSpy = jest.fn();
    onEndDateChangeSpy = jest.fn();
    onClearSpy = jest.fn();
  });

  test("renders inputs and labels correctly", () => {
    render(
      <FilterBar
        searchQuery=""
        onSearchChange={onSearchChangeSpy}
        startDate=""
        onStartDateChange={onStartDateChangeSpy}
        endDate=""
        onEndDateChange={onEndDateChangeSpy}
        onClear={onClearSpy}
      />,
    );

    // Verify search input
    expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/search id, customer, product/i),
    ).toBeInTheDocument();

    // Verify date range inputs
    expect(screen.getByLabelText(/^from$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^to$/i)).toBeInTheDocument();

    // Clear button should not be rendered initially since values are empty
    expect(screen.queryByTestId("clear-filters-btn")).not.toBeInTheDocument();
  });

  test("displays clear button and triggers onClear when filters are active", () => {
    render(
      <FilterBar
        searchQuery="john"
        onSearchChange={onSearchChangeSpy}
        startDate=""
        onStartDateChange={onStartDateChangeSpy}
        endDate=""
        onEndDateChange={onEndDateChangeSpy}
        onClear={onClearSpy}
      />,
    );

    const clearBtn = screen.getByTestId("clear-filters-btn");
    expect(clearBtn).toBeInTheDocument();

    fireEvent.click(clearBtn);
    expect(onClearSpy).toHaveBeenCalledTimes(1);
  });

  test("triggers callback on search input change only when Apply button is clicked", () => {
    render(
      <FilterBar
        searchQuery=""
        onSearchChange={onSearchChangeSpy}
        startDate=""
        onStartDateChange={onStartDateChangeSpy}
        endDate=""
        onEndDateChange={onEndDateChangeSpy}
        onClear={onClearSpy}
      />,
    );

    // Apply button should not be present initially
    expect(screen.queryByTestId("apply-filters-btn")).toBeNull();

    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "laptop" } });

    // Callback should not be triggered immediately on typing
    expect(onSearchChangeSpy).not.toHaveBeenCalled();

    // Apply button should now be visible
    const applyBtn = screen.getByTestId("apply-filters-btn");
    expect(applyBtn).toBeInTheDocument();

    fireEvent.click(applyBtn);
    expect(onSearchChangeSpy).toHaveBeenCalledTimes(1);
    expect(onSearchChangeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ target: { value: "laptop" } }),
    );
  });

  test("triggers callback on start date change when Apply button is clicked", () => {
    render(
      <FilterBar
        searchQuery=""
        onSearchChange={onSearchChangeSpy}
        startDate=""
        onStartDateChange={onStartDateChangeSpy}
        endDate=""
        onEndDateChange={onEndDateChangeSpy}
        onClear={onClearSpy}
      />,
    );

    const startDateInput = screen.getByTestId("start-date-input");
    expect(screen.queryByTestId("apply-filters-btn")).toBeNull();

    fireEvent.change(startDateInput, { target: { value: "2026-01-01" } });
    expect(onStartDateChangeSpy).not.toHaveBeenCalled();

    const applyBtn = screen.getByTestId("apply-filters-btn");
    fireEvent.click(applyBtn);
    expect(onStartDateChangeSpy).toHaveBeenCalledTimes(1);
  });

  test("triggers callback on start date change when Enter key is pressed", () => {
    render(
      <FilterBar
        searchQuery=""
        onSearchChange={onSearchChangeSpy}
        startDate=""
        onStartDateChange={onStartDateChangeSpy}
        endDate=""
        onEndDateChange={onEndDateChangeSpy}
        onClear={onClearSpy}
      />,
    );

    const startDateInput = screen.getByTestId("start-date-input");

    fireEvent.change(startDateInput, { target: { value: "2026-01-01" } });
    expect(onStartDateChangeSpy).not.toHaveBeenCalled();

    // Press key other than Enter
    fireEvent.keyDown(startDateInput, { key: "Escape" });
    expect(onStartDateChangeSpy).not.toHaveBeenCalled();

    // Press Enter key
    fireEvent.keyDown(startDateInput, { key: "Enter" });
    expect(onStartDateChangeSpy).toHaveBeenCalledTimes(1);
  });

  test("triggers callback on end date change when Apply button is clicked", () => {
    render(
      <FilterBar
        searchQuery=""
        onSearchChange={onSearchChangeSpy}
        startDate=""
        onStartDateChange={onStartDateChangeSpy}
        endDate=""
        onEndDateChange={onEndDateChangeSpy}
        onClear={onClearSpy}
      />,
    );

    const endDateInput = screen.getByTestId("end-date-input");
    expect(screen.queryByTestId("apply-filters-btn")).toBeNull();

    fireEvent.change(endDateInput, { target: { value: "2026-02-01" } });
    expect(onEndDateChangeSpy).not.toHaveBeenCalled();

    const applyBtn = screen.getByTestId("apply-filters-btn");
    fireEvent.click(applyBtn);
    expect(onEndDateChangeSpy).toHaveBeenCalledTimes(1);
  });

  test("handles click events on date inputs to invoke showPicker if available", () => {
    render(
      <FilterBar
        searchQuery=""
        onSearchChange={onSearchChangeSpy}
        startDate=""
        onStartDateChange={onStartDateChangeSpy}
        endDate=""
        onEndDateChange={onEndDateChangeSpy}
        onClear={onClearSpy}
      />,
    );

    const startDateInput = screen.getByTestId("start-date-input");
    const endDateInput = screen.getByTestId("end-date-input");

    // Case 1: showPicker is not a function in jsdom
    fireEvent.click(startDateInput);
    fireEvent.click(endDateInput);

    // Case 2: mock showPicker
    const mockShowPicker = jest.fn();
    startDateInput.showPicker = mockShowPicker;
    endDateInput.showPicker = mockShowPicker;

    fireEvent.click(startDateInput);
    fireEvent.click(endDateInput);

    expect(mockShowPicker).toHaveBeenCalledTimes(2);
  });

  describe("Automatic 3-month date defaulting and capping to today", () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date("2026-06-24"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test("sets To date to 3 months after From date if To date is empty", () => {
      render(
        <FilterBar
          searchQuery=""
          onSearchChange={onSearchChangeSpy}
          startDate=""
          onStartDateChange={onStartDateChangeSpy}
          endDate=""
          onEndDateChange={onEndDateChangeSpy}
          onClear={onClearSpy}
        />,
      );

      const startDateInput = screen.getByTestId("start-date-input");
      const endDateInput = screen.getByTestId("end-date-input");

      // Set From date to 2026-01-10 (which is 3 months before 2026-04-10, well before today 2026-06-24)
      fireEvent.change(startDateInput, { target: { value: "2026-01-10" } });
      const applyBtn = screen.getByTestId("apply-filters-btn");
      fireEvent.click(applyBtn);

      expect(endDateInput.value).toBe("2026-04-10");
      expect(onStartDateChangeSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ target: { value: "2026-01-10" } }),
      );
      expect(onEndDateChangeSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ target: { value: "2026-04-10" } }),
      );
    });

    test("sets From date to 3 months before To date if From date is empty", () => {
      render(
        <FilterBar
          searchQuery=""
          onSearchChange={onSearchChangeSpy}
          startDate=""
          onStartDateChange={onStartDateChangeSpy}
          endDate=""
          onEndDateChange={onEndDateChangeSpy}
          onClear={onClearSpy}
        />,
      );

      const startDateInput = screen.getByTestId("start-date-input");
      const endDateInput = screen.getByTestId("end-date-input");

      // Set To date to 2026-05-15
      fireEvent.change(endDateInput, { target: { value: "2026-05-15" } });
      const applyBtn = screen.getByTestId("apply-filters-btn");
      fireEvent.click(applyBtn);

      expect(startDateInput.value).toBe("2026-02-15");
      expect(onStartDateChangeSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ target: { value: "2026-02-15" } }),
      );
      expect(onEndDateChangeSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ target: { value: "2026-05-15" } }),
      );
    });

    test("caps calculated To date to today if it exceeds today", () => {
      render(
        <FilterBar
          searchQuery=""
          onSearchChange={onSearchChangeSpy}
          startDate=""
          onStartDateChange={onStartDateChangeSpy}
          endDate=""
          onEndDateChange={onEndDateChangeSpy}
          onClear={onClearSpy}
        />,
      );

      const startDateInput = screen.getByTestId("start-date-input");
      const endDateInput = screen.getByTestId("end-date-input");

      // Set From date to 2026-05-10. 3 months after is 2026-08-10 (which is after today 2026-06-24)
      fireEvent.change(startDateInput, { target: { value: "2026-05-10" } });
      const applyBtn = screen.getByTestId("apply-filters-btn");
      fireEvent.click(applyBtn);

      expect(endDateInput.value).toBe("2026-06-24");
      expect(onEndDateChangeSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ target: { value: "2026-06-24" } }),
      );
    });

    test("caps manually entered future dates to today", () => {
      render(
        <FilterBar
          searchQuery=""
          onSearchChange={onSearchChangeSpy}
          startDate=""
          onStartDateChange={onStartDateChangeSpy}
          endDate=""
          onEndDateChange={onEndDateChangeSpy}
          onClear={onClearSpy}
        />,
      );

      const startDateInput = screen.getByTestId("start-date-input");
      const endDateInput = screen.getByTestId("end-date-input");

      // Set manually typed future dates: Start = 2026-07-01, End = 2026-08-01
      fireEvent.change(startDateInput, { target: { value: "2026-07-01" } });
      fireEvent.change(endDateInput, { target: { value: "2026-08-01" } });
      const applyBtn = screen.getByTestId("apply-filters-btn");
      fireEvent.click(applyBtn);

      expect(startDateInput.value).toBe("2026-06-24");
      expect(endDateInput.value).toBe("2026-06-24");
      expect(onStartDateChangeSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ target: { value: "2026-06-24" } }),
      );
      expect(onEndDateChangeSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ target: { value: "2026-06-24" } }),
      );
    });

    test("sets the max attribute on native picker inputs to today", () => {
      render(
        <FilterBar
          searchQuery=""
          onSearchChange={onSearchChangeSpy}
          startDate=""
          onStartDateChange={onStartDateChangeSpy}
          endDate=""
          onEndDateChange={onEndDateChangeSpy}
          onClear={onClearSpy}
        />,
      );

      const startDateInput = screen.getByTestId("start-date-input");
      const endDateInput = screen.getByTestId("end-date-input");

      expect(startDateInput).toHaveAttribute("max", "2026-06-24");
      expect(endDateInput).toHaveAttribute("max", "2026-06-24");
    });
  });
});
