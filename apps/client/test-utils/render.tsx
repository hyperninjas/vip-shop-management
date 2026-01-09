import { render as testingLibraryRender, RenderOptions } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import React, { ReactElement } from 'react';
import JotaiProvider from '@/lib/jotai/providers/JotaiProvider';
import { theme } from '../theme';

/**
 * Custom render function that includes all necessary providers for testing.
 * This ensures components have access to Mantine theme and Jotai state management.
 *
 * @param ui - The component to render
 * @param options - Additional render options from @testing-library/react
 * @returns Render result with all queries and utilities
 *
 * @example
 * ```tsx
 * import { render, screen } from '@/test-utils';
 *
 * test('renders component', () => {
 *   render(<MyComponent />);
 *   expect(screen.getByText('Hello')).toBeInTheDocument();
 * });
 * ```
 */
export function render(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return testingLibraryRender(ui, {
    wrapper: ({ children }) => (
      <MantineProvider theme={theme}>
        <JotaiProvider>{children}</JotaiProvider>
      </MantineProvider>
    ),
    ...options,
  });
}
