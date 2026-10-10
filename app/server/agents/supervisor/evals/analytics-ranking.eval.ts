import { defineEval } from '@databricks/appkit/beta';
import { didNotCallTools } from './assertions';

export default defineEval({
  description: 'A ranking across states goes to Genie',
  tags: ['routing', 'genie'],
  timeoutMs: 150_000,
  async test(t) {
    await t.send('Which 3 states had the most orders in 2018?');
    t.succeeded();
    t.calledTool('ask_analytics');
    didNotCallTools(t, ['search_products']);
  },
});
