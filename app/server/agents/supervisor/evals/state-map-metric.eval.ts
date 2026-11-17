import { defineEval } from '@databricks/appkit/beta';

export default defineEval({
  description: 'A question about orders by state opens the state map on orders',
  tags: ['routing', 'read', 'map'],
  async test(t) {
    await t.send('How many orders came from each state in the first half of 2018?');
    t.succeeded();
    t.calledToolWith('get_sales_by_state', { from: '2018-01-01', to: '2018-06-30', metric: 'orders' });
  },
});
