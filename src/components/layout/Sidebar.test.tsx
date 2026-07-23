import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import Sidebar from './Sidebar';

describe('Sidebar', () => {
  it('shows the build version and changes the active destination', () => {
    const onTabChange = vi.fn();

    render(<Sidebar activeTab="today" onTabChange={onTabChange} />);

    expect(screen.getByText('v0.2.0-alpha.3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Journal' }));
    expect(onTabChange).toHaveBeenCalledWith('journal');
  });
});
