import { defineEval, matches } from '@databricks/appkit/beta';
import { didNotCallTools, MUTATING_TOOLS } from './assertions';

export default defineEval({
  description: 'Headline KPIs for a year go to the Lakebase KPI tool with the full date range',
  tags: ['routing', 'read'],
  async test(t) {
    await t.send('What was the GMV and the number of orders in 2017?');
    t.succeeded();
    t.calledToolWith('get_kpi_summary', { from: '2017-01-01', to: '2017-12-31' });
    didNotCallTools(t, ['ask_analytics', ...MUTATING_TOOLS]);
    t.check(t.reply, matches(/R\$\s?[\d.,]+/));
  },
});
