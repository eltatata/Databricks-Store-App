export const ASSISTANT_AGENT = 'supervisor';

export const ASSISTANT_SUGGESTIONS = [
  'What were GMV, orders and average order value in the first half of 2018?',
  'Which 5 categories grew the most from 2017 to 2018?',
  'Show me GMV by state in 2018 on the map',
  'Find active products whose name mentions lamp',
  'Create a product called Linen Throw in bed_bath_table priced at 189.90 BRL',
] as const;

export const MUTATING_TOOLS = new Set(['create_product', 'update_product', 'deactivate_product']);

const TOOL_LABELS: Record<string, { running: string; done: string }> = {
  ask_analytics: { running: 'Asking Genie', done: 'Asked Genie' },
  get_kpi_summary: { running: 'Reading the headline KPIs', done: 'Read the headline KPIs' },
  get_sales_by_state: { running: 'Reading sales by state', done: 'Read sales by state' },
  search_products: { running: 'Searching the catalog', done: 'Searched the catalog' },
  get_product: { running: 'Reading the product', done: 'Read the product' },
  create_product: { running: 'Creating the product', done: 'Create product' },
  update_product: { running: 'Updating the product', done: 'Update product' },
  deactivate_product: { running: 'Deactivating the product', done: 'Deactivate product' },
};

export const toolLabelOf = (toolName: string, isRunning: boolean) => {
  const labels = TOOL_LABELS[toolName];
  if (!labels) {
    return isRunning ? `Running ${toolName}` : `Ran ${toolName}`;
  }
  return isRunning ? labels.running : labels.done;
};
