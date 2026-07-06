import { render, screen } from '@testing-library/react';
import EnvironmentBadge from './EnvironmentBadge';
import type { SadhanaEnvironment } from '../../lib/env';

const makeEnvironment = (
  name: SadhanaEnvironment['name'],
  overrides: Partial<SadhanaEnvironment> = {},
): SadhanaEnvironment => ({
  name,
  label: name === 'local' ? 'Local Dev' : name[0]!.toUpperCase() + name.slice(1),
  description: `${name === 'local' ? 'Local development' : `${name[0]!.toUpperCase()}${name.slice(1)}`} environment. This does not describe cloud sync status.`,
  isProduction: name === 'production',
  showBadge: name !== 'production',
  ...overrides,
});

describe('EnvironmentBadge', () => {
  it('shows a staging badge for staging builds', () => {
    render(<EnvironmentBadge environment={makeEnvironment('staging')} />);

    expect(screen.getByLabelText('App environment: Staging environment. This does not describe cloud sync status.')).toBeInTheDocument();
    expect(screen.getByText('ENV')).toBeInTheDocument();
    expect(screen.getByText('Staging')).toBeInTheDocument();
  });

  it('shows a local badge for local development', () => {
    render(<EnvironmentBadge environment={makeEnvironment('local')} />);

    expect(screen.getByLabelText('App environment: Local development environment. This does not describe cloud sync status.')).toBeInTheDocument();
    expect(screen.getByText('Local Dev')).toBeInTheDocument();
    expect(screen.queryByText('Local')).not.toBeInTheDocument();
  });

  it('does not render in production', () => {
    const { container } = render(<EnvironmentBadge environment={makeEnvironment('production')} />);

    expect(container).toBeEmptyDOMElement();
  });
});
