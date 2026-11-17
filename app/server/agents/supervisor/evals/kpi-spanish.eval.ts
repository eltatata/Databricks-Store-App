import { defineEval, matches } from '@databricks/appkit/beta';

export default defineEval({
  description: 'A Spanish question about average order value is answered in Spanish from the KPI tool',
  tags: ['routing', 'read', 'language'],
  async test(t) {
    await t.send('¿Cuál fue el ticket medio en el primer semestre de 2018?');
    t.succeeded();
    t.calledToolWith('get_kpi_summary', { from: '2018-01-01', to: '2018-06-30' });
    t.check(t.reply, matches(/137[.,]35/));
    t.check(t.reply, matches(/\b(?:el|la|de|fue|semestre)\b/i)).soft();
  },
});
