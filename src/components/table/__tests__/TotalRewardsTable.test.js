import { render, screen } from '@testing-library/react';
import TotalRewardsTable from '../TotalRewardsTable';

describe('TotalRewardsTable Component', () => {
  const mockData = [
    {
      customerId: 'CUST-001',
      name: 'John Doe',
      points: 250
    },
    {
      customerId: 'CUST-002',
      name: 'Alice Smith',
      points: 150
    }
  ];

  test('renders customer names and total points correctly', () => {
    render(<TotalRewardsTable totalRewards={mockData} />);

    // Verify Title
    expect(screen.getByText('Total Rewards')).toBeInTheDocument();

    // Verify Table Headers
    expect(screen.getByText('Customer Name')).toBeInTheDocument();
    expect(screen.getByText('Total Reward Points')).toBeInTheDocument();

    // Verify Row Contents
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('250 pts')).toBeInTheDocument();
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('150 pts')).toBeInTheDocument();
  });

  test('renders empty state message when no cumulative records are provided', () => {
    render(<TotalRewardsTable totalRewards={[]} />);
    expect(screen.getByText('No rewards computed.')).toBeInTheDocument();
  });
});
