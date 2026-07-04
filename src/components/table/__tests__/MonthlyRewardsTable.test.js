import { render, screen } from '@testing-library/react';
import MonthlyRewardsTable from '../MonthlyRewardsTable';

describe('MonthlyRewardsTable Component', () => {
  const mockData = [
    {
      customerId: 'CUST-001',
      name: 'John Doe',
      monthName: 'December',
      monthIndex: 11,
      year: 2025,
      points: 120
    },
    {
      customerId: 'CUST-002',
      name: 'Alice Smith',
      monthName: 'January',
      monthIndex: 0,
      year: 2026,
      points: 80
    }
  ];

  test('renders aggregated monthly rewards headers and rows correctly', () => {
    render(<MonthlyRewardsTable monthlyRewards={mockData} />);

    // Verify Title
    expect(screen.getByText('Monthly Rewards Summary')).toBeInTheDocument();

    // Verify Table Headers
    expect(screen.getByText('Customer ID')).toBeInTheDocument();
    expect(screen.getByText('Month')).toBeInTheDocument();
    expect(screen.getByText('Year')).toBeInTheDocument();
    expect(screen.getByText('Reward Points')).toBeInTheDocument();

    // Verify Customer Name and points cells
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('120 pts')).toBeInTheDocument();
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('80 pts')).toBeInTheDocument();
  });

  test('renders empty state message when no monthly records are provided', () => {
    render(<MonthlyRewardsTable monthlyRewards={[]} />);
    expect(screen.getByText('No rewards aggregated yet.')).toBeInTheDocument();
  });
});
