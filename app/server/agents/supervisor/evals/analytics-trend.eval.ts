import { defineEval } from '@databricks/appkit/beta';

export default defineEval({
  description: 'A month by month trend goes to Genie',
  tags: ['routing', 'genie'],
  timeoutMs: 150_000,
  async test(t) {
    await t.send('How did the late delivery rate change month by month during 2017?');
    t.succeeded();
    t.calledTool('ask_analytics');
  },
});
