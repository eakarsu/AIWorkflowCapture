const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'captured_steps', fields: ['workflow_name','step_no','semantic_label','element_hint','input_data'] });
