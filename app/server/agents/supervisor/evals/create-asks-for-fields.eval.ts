import { defineEval, matches } from '@databricks/appkit/beta';
import { didNotCallTools, MUTATING_TOOLS } from './assertions';

export default defineEval({
  description: 'Creating a product without a name or category asks for them instead of writing',
  tags: ['clarify', 'mutation'],
  async test(t) {
    await t.send('I want to add a new product to the catalog');
    t.succeeded();
    didNotCallTools(t, MUTATING_TOOLS);
    t.check(t.reply, matches(/name|category/i));
  },
});
