import { defineEval } from '@databricks/appkit/beta';
import { didNotCallTools, MUTATING_TOOLS } from './assertions';

export default defineEval({
  description: 'A question about sales by state reads the Lakebase state breakdown for the range',
  tags: ['routing', 'read', 'map'],
  async test(t) {
    await t.send('Show me GMV by state for 2017');
    t.succeeded();
    t.calledToolWith('get_sales_by_state', { from: '2017-01-01', to: '2017-12-31' });
    didNotCallTools(t, MUTATING_TOOLS);
  },
});
