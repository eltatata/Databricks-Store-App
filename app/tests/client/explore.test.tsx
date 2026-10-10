import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SafeMarkdown } from '@/components/common/SafeMarkdown';
import { ExploreResultTable } from '@/components/explore/ExploreResultTable';

describe('SafeMarkdown', () => {
  it('renders bold text and bullet lists as elements', () => {
    render(<SafeMarkdown text={'Top categories:\n- **health_beauty** (R$770,002.81)\n- watches_gifts'} />);

    expect(screen.getByText('Top categories:')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('health_beauty').tagName).toBe('STRONG');
  });

  it('never turns model text into HTML', () => {
    const { container } = render(<SafeMarkdown text={'<img src=x onerror="alert(1)"> **<script>bad()</script>**'} />);

    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
    expect(container).toHaveTextContent('<img src=x onerror="alert(1)">');
  });
});

describe('ExploreResultTable', () => {
  it('formats numeric columns and caps the visible rows', () => {
    const rows = Array.from({ length: 60 }, (_, index) => ({ category_en: `cat_${index}`, gmv: '1234.5' }));
    render(
      <ExploreResultTable
        rows={rows}
        columns={[
          { name: 'category_en', category: 'string' },
          { name: 'gmv', category: 'numeric' },
        ]}
      />
    );

    expect(screen.getAllByRole('row')).toHaveLength(51);
    expect(screen.getAllByText('1,234.5')).toHaveLength(50);
    expect(screen.getByText('Showing the first 50 of 60 rows')).toBeInTheDocument();
  });
});
