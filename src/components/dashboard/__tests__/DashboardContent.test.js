import { render, screen, fireEvent } from '@testing-library/react';
import DashboardContent from '../DashboardContent';

const mockTransactions = [
  {
    id: 'TX-1000',
    customerId: 'CUST-001',
    customerName: 'John Doe',
    date: '2026-04-15',
    product: 'Wireless Headphones',
    price: 120.0,
    points: 90
  },
  {
    id: 'TX-1001',
    customerId: 'CUST-002',
    customerName: 'Jane Smith',
    date: '2026-05-05',
    product: 'Mechanical Keyboard',
    price: 80.0,
    points: 30
  }
];

describe('DashboardContent Component', () => {
  /**
   * Verifies that the dashboard components (filter bar, ledger, rewards tables)
   * render correctly with initial datasets.
   */
  test('renders filter bar and table sections successfully', async () => {
    render(<DashboardContent transactions={mockTransactions} />);

    expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
    expect(await screen.findByTestId('transactions-table-card')).toBeInTheDocument();
    expect(await screen.findByTestId('monthly-rewards-card')).toBeInTheDocument();
    expect(await screen.findByTestId('total-rewards-card')).toBeInTheDocument();
  });

  /**
   * Verifies that typing in the search input and clicking the Apply button
   * correctly filters rows in the transactions ledger.
   */
  test('applies search filters on text input change and apply click', async () => {
    render(<DashboardContent transactions={mockTransactions} />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'wireless' } });

    const applyBtn = screen.getByTestId('apply-filters-btn');
    fireEvent.click(applyBtn);

    expect(await screen.findByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.queryByText('Mechanical Keyboard')).not.toBeInTheDocument();
  });

  /**
   * Verifies that specifying a date range limits the ledger rows accordingly.
   */
  test('applies date range filters on input change and apply click', async () => {
    render(<DashboardContent transactions={mockTransactions} />);

    const startDateInput = screen.getByTestId('start-date-input');
    const endDateInput = screen.getByTestId('end-date-input');

    fireEvent.change(startDateInput, { target: { value: '2026-05-01' } });
    fireEvent.change(endDateInput, { target: { value: '2026-05-31' } });

    const applyBtn = screen.getByTestId('apply-filters-btn');
    fireEvent.click(applyBtn);

    expect(await screen.findByText('Mechanical Keyboard')).toBeInTheDocument();
    expect(screen.queryByText('Wireless Headphones')).not.toBeInTheDocument();
  });

  /**
   * Verifies that clicking the Clear Filters button resets the filter state
   * and displays all transaction rows.
   */
  test('clears active filters when clear button is clicked', async () => {
    render(<DashboardContent transactions={mockTransactions} />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'wireless' } });

    const applyBtn = screen.getByTestId('apply-filters-btn');
    fireEvent.click(applyBtn);

    expect(await screen.findByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.queryByText('Mechanical Keyboard')).not.toBeInTheDocument();

    const clearBtn = screen.getByTestId('clear-filters-btn');
    fireEvent.click(clearBtn);

    expect(await screen.findByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('Mechanical Keyboard')).toBeInTheDocument();
  });
});
