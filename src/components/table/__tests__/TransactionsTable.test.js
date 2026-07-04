import { render, screen, fireEvent } from '@testing-library/react';
import TransactionsTable from '../TransactionsTable';

describe('TransactionsTable Component', () => {
  const mockTransactions = [
    {
      id: 'TX-1000',
      customerId: 'CUST-001',
      customerName: 'John Doe',
      date: '2026-04-15',
      product: 'Wireless Headphones',
      price: 120,
      points: 90
    },
    {
      id: 'TX-1001',
      customerId: 'CUST-002',
      customerName: 'Alice Smith',
      date: '2026-05-05',
      product: 'Mechanical Keyboard',
      price: 80,
      points: 30
    }
  ];

  test('renders transaction ledger headings and records correctly', () => {
    render(<TransactionsTable transactions={mockTransactions} />);

    // Verify Title
    expect(screen.getByText('Transactions Ledger')).toBeInTheDocument();

    // Verify Headers
    expect(screen.getByText('Transaction ID')).toBeInTheDocument();
    expect(screen.getByText('Customer Name')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('Reward Points')).toBeInTheDocument();

    // Verify Data Rows
    expect(screen.getByText('TX-1000')).toBeInTheDocument();
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('$120.00')).toBeInTheDocument();
    expect(screen.getByText('90')).toBeInTheDocument();

    expect(screen.getByText('TX-1001')).toBeInTheDocument();
    expect(screen.getByText('Mechanical Keyboard')).toBeInTheDocument();
    expect(screen.getByText('$80.00')).toBeInTheDocument();
    expect(screen.getAllByText('30')[0]).toBeInTheDocument();
  });

  test('changes page size and updates pagination stats correctly', () => {
    render(<TransactionsTable transactions={mockTransactions} />);

    // Initial page size is 10, stats show "Showing 1–2 of 2 transactions"
    expect(screen.getByTestId('pagination-stats')).toHaveTextContent('Showing 1–2 of 2 transactions');

    // Change page size select to 20
    const selectElement = screen.getByLabelText('Show');
    fireEvent.change(selectElement, { target: { value: '20' } });

    // Verify it updates correctly
    expect(screen.getByTestId('pagination-stats')).toHaveTextContent('Showing 1–2 of 2 transactions');
  });

  test('applies scrollable class when page size is set to 20 or 30', () => {
    render(<TransactionsTable transactions={mockTransactions} />);
    
    const tableContainer = screen.getByTestId('table-responsive');
    expect(tableContainer).not.toHaveClass('scrollable');
    
    const selectElement = screen.getByLabelText('Show');
    
    // Change to 20
    fireEvent.change(selectElement, { target: { value: '20' } });
    expect(tableContainer).toHaveClass('scrollable');
    
    // Change to 30
    fireEvent.change(selectElement, { target: { value: '30' } });
    expect(tableContainer).toHaveClass('scrollable');
    
    // Change back to 10
    fireEvent.change(selectElement, { target: { value: '10' } });
    expect(tableContainer).not.toHaveClass('scrollable');
  });
});
