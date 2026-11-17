import { defineEval } from '@databricks/appkit/beta';
import { didNotCallTools } from './assertions';

export default defineEval({
  description: 'A state ranking by late deliveries goes to Genie, not to the state sales tool',
  tags: ['routing', 'genie'],
  timeoutMs: 150_000,
  async test(t) {
    await t.send('Which 3 states had the highest late delivery rate in 2018?');
    t.succeeded();
    t.calledTool('ask_analytics');
    didNotCallTools(t, ['search_products', 'get_sales_by_state']);
  },
});
