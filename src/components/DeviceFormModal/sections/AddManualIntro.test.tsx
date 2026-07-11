import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import AddManualIntro from './AddManualIntro';

describe('AddManualIntro', () => {
  it('renders guidance about manual device add', () => {
    renderWithProviders(<AddManualIntro />);

    expect(screen.getByText(/Register new device/i)).toBeInTheDocument();
    expect(screen.getByText(/Manual add is for advanced cases/i)).toBeInTheDocument();
  });
});
