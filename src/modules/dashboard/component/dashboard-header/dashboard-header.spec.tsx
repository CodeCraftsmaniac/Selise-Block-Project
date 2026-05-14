import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { DashboardHeader } from './dashboard-header';
import '../../../../lib/utils/test-utils/shared-test-utils';

// Mock UI components
vi.mock('@/components/ui-kit/button', () => ({
  Button: ({ children, variant, className, size, ...props }: any) => (
    <button data-variant={variant} data-size={size} className={className} {...props}>
      {children}
    </button>
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Download: ({ className }: any) => <div data-testid="download-icon" className={className} />,
  RefreshCcw: ({ className }: any) => <div data-testid="refresh-icon" className={className} />,
  Moon: ({ className }: any) => <div data-testid="moon-icon" className={className} />,
  Sun: ({ className }: any) => <div data-testid="sun-icon" className={className} />,
}));

// Mock useTheme
vi.mock('@/styles/theme/theme-provider', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}));

describe('DashboardHeader', () => {
  test('renders dashboard header with title', () => {
    render(<DashboardHeader />);

    // Test title is displayed
    expect(screen.getByText('DASHBOARD')).toBeInTheDocument();

    // Test title has correct styling classes
    const title = screen.getByText('DASHBOARD');
    expect(title).toHaveClass('text-2xl', 'font-bold', 'tracking-tight', 'text-high-emphasis');
  });

  test('renders sync button with correct attributes', () => {
    render(<DashboardHeader />);

    // Test sync button exists via aria-label
    const syncButton = screen.getByLabelText('SYNC_DASHBOARD_DATA');
    expect(syncButton).toBeInTheDocument();

    // Test button variant and styling
    expect(syncButton).toHaveAttribute('data-variant', 'outline');
    expect(syncButton).toHaveClass('text-high-emphasis', 'hover:text-high-emphasis', 'font-bold');

    // Test refresh icon is present
    expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    expect(screen.getByTestId('refresh-icon')).toHaveClass('w-2.5', 'h-2.5');

    // Test button text
    expect(screen.getByText('SYNC')).toBeInTheDocument();
  });

  test('renders export button with correct attributes', () => {
    render(<DashboardHeader />);

    // Test export button exists via aria-label
    const exportButton = screen.getByLabelText('EXPORT_DASHBOARD_DATA');
    expect(exportButton).toBeInTheDocument();

    // Test button styling (default variant)
    expect(exportButton).toHaveClass('font-bold');

    // Test download icon is present
    expect(screen.getByTestId('download-icon')).toBeInTheDocument();
    expect(screen.getByTestId('download-icon')).toHaveClass('w-2.5', 'h-2.5');

    // Test button text
    expect(screen.getByText('EXPORT')).toBeInTheDocument();
  });

  test('renders button text with responsive visibility classes', () => {
    render(<DashboardHeader />);

    // Test sync button text has responsive classes
    const syncText = screen.getByText('SYNC');
    expect(syncText).toHaveClass(
      'text-sm',
      'font-bold',
      'sr-only',
      'sm:not-sr-only',
      'sm:whitespace-nowrap'
    );

    // Test export button text has responsive classes
    const exportText = screen.getByText('EXPORT');
    expect(exportText).toHaveClass(
      'text-sm',
      'font-bold',
      'sr-only',
      'sm:not-sr-only',
      'sm:whitespace-nowrap'
    );
  });

  test('renders with correct layout structure', () => {
    render(<DashboardHeader />);

    // Test main container structure
    const container = screen.getByText('DASHBOARD').parentElement;
    expect(container).toHaveClass(
      'mb-[18px]',
      'flex',
      'items-center',
      'justify-between',
      'md:mb-[32px]'
    );

    // Test buttons container
    const buttonsContainer = screen.getByLabelText('TOGGLE_THEME').parentElement;
    expect(buttonsContainer).toHaveClass('flex', 'gap-4');
  });

  test('renders all three buttons in correct order', () => {
    render(<DashboardHeader />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);

    // First button should be theme toggle (outline variant, size sm)
    expect(buttons[0]).toHaveAttribute('data-variant', 'outline');
    expect(buttons[0]).toHaveAttribute('data-size', 'sm');
    expect(buttons[0]).toHaveAttribute('aria-label', 'TOGGLE_THEME');

    // Second button should be sync (outline variant)
    expect(buttons[1]).toHaveAttribute('data-variant', 'outline');
    expect(buttons[1]).toHaveTextContent('SYNC');

    // Third button should be export (default variant)
    expect(buttons[2]).not.toHaveAttribute('data-variant');
    expect(buttons[2]).toHaveTextContent('EXPORT');
  });
});
