import { matches, type TestContext } from '@databricks/appkit/beta';

export const MUTATING_TOOLS = ['create_product', 'update_product', 'deactivate_product'];

export const SAMPLE_PRODUCT_ID = '000d9be29b5207b54e86aa1b1ac54872';

export function didNotCallTools(t: TestContext, names: string[]) {
  const forbidden = names.join('|');
  return t.check(t.toolCalls.join(' '), matches(new RegExp(`^(?![\\s\\S]*\\b(?:${forbidden})\\b)`)));
}
