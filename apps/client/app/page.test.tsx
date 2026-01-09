import { render, screen, userEvent } from '@/test-utils';
import HomePage from './page';

describe('HomePage - Increment Function', () => {
  it('should render the increment button and count display', () => {
    render(<HomePage />);

    const incrementButton = screen.getByRole('button', { name: /increment/i });
    const countDisplay = screen.getByText(/count:/i);

    expect(incrementButton).toBeInTheDocument();
    expect(countDisplay).toBeInTheDocument();
  });

  it('should display initial count as 0', () => {
    render(<HomePage />);

    const countDisplay = screen.getByText(/count: 0/i);
    expect(countDisplay).toBeInTheDocument();
  });

  it('should increment count when button is clicked', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    const incrementButton = screen.getByRole('button', { name: /increment/i });

    // Initial count should be 0
    expect(screen.getByText(/count: 0/i)).toBeInTheDocument();

    // Click increment button
    await user.click(incrementButton);

    // Count should be 1
    expect(screen.getByText(/count: 1/i)).toBeInTheDocument();
  });

  it('should increment count multiple times', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    const incrementButton = screen.getByRole('button', { name: /increment/i });

    // Click multiple times
    await user.click(incrementButton);
    await user.click(incrementButton);
    await user.click(incrementButton);

    // Count should be 3
    expect(screen.getByText(/count: 3/i)).toBeInTheDocument();
  });

  it('should update count display immediately after increment', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    const incrementButton = screen.getByRole('button', { name: /increment/i });

    await user.click(incrementButton);

    // Verify the count display updates
    const countDisplay = screen.getByText(/count: 1/i);
    expect(countDisplay).toBeInTheDocument();
  });

  it('should maintain state across re-renders', () => {
    const { rerender } = render(<HomePage />);

    // Initial state
    expect(screen.getByText(/count: 0/i)).toBeInTheDocument();

    // Rerender should maintain state (Jotai Provider persists)
    rerender(<HomePage />);
    expect(screen.getByText(/count: 0/i)).toBeInTheDocument();
  });
});

