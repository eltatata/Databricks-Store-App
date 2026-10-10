import { defineEval, matches } from '@databricks/appkit/beta';

export default defineEval({
  description: 'A complete create request calls create_product, which waits for approval and is denied on timeout',
  tags: ['mutation', 'approval'],
  timeoutMs: 120_000,
  async test(t) {
    await t.send('Create a product called Eval Approval Probe in category home_decor priced at 10 BRL');
    t.succeeded();
    t.calledToolWith('create_product', { displayName: 'Eval Approval Probe', categoryEn: 'home_decor' });
    t.check(t.reply, matches(/not|no|cancel|denied|nothing/i));
  },
});
