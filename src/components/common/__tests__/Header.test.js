import { render, screen } from '@testing-library/react';
import Header from '../Header';

describe('Header Component', () => {
  test('renders the main title RewardTracker', () => {
    render(<Header />);
    const titleElement = screen.getByRole('heading', { level: 1 });
    expect(titleElement).toHaveTextContent('RewardTracker');
  });

  test('renders the correct subtitle text', () => {
    render(<Header />);
    const subtitleElement = screen.getByText(/Track transactions and calculate customer rewards/i);
    expect(subtitleElement).toBeInTheDocument();
  });
});
