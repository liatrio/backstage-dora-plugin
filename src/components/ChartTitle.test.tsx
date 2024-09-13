import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  ChartTitle,
  Props,
} from './ChartTitle';
import { Theme } from '@liatrio/react-dora-charts';
import {COLOR_DARK, COLOR_GREEN, COLOR_LIGHT} from "../helper";

describe('ChartTitle', () => {
  const defaultProps: Props = {
    title: 'Test Title',
    info: 'Test Info',
    theme: Theme.Light,
  };

  it('renders the title and info correctly', () => {
    render(<ChartTitle {...defaultProps} />);
    expect(screen.getByText('Test Title:')).toBeInTheDocument();
    expect(screen.getByTestId('metric_tooltip')).toHaveAttribute(
      'data-tooltip-content',
      'Test Info',
    );
  });

  it('applies the correct color based on theme', () => {
    const { rerender } = render(<ChartTitle {...defaultProps} />);
    let tooltipPaths = screen
      .getByTestId('metric_tooltip')
      .querySelectorAll('path');

    expect(tooltipPaths[0]).toHaveAttribute('fill', COLOR_GREEN);
    expect(tooltipPaths[1]).toHaveAttribute('fill', COLOR_DARK);
    expect(tooltipPaths[2]).toHaveAttribute('fill', COLOR_DARK);
    expect(tooltipPaths[3]).toHaveAttribute('fill', COLOR_DARK);

    rerender(<ChartTitle {...defaultProps} theme={Theme.Dark} />);
    tooltipPaths = screen
      .getByTestId('metric_tooltip')
      .querySelectorAll('path');
    expect(tooltipPaths[0]).toHaveAttribute('fill', COLOR_GREEN);
    expect(tooltipPaths[1]).toHaveAttribute('fill', COLOR_LIGHT);
    expect(tooltipPaths[2]).toHaveAttribute('fill', COLOR_LIGHT);
    expect(tooltipPaths[3]).toHaveAttribute('fill', COLOR_LIGHT);
  });

  it('displays the score display if provided', () => {
    render(<ChartTitle {...defaultProps} scoreDisplay="85" />);
    expect(screen.getByText('85')).toBeInTheDocument();
  });
});
