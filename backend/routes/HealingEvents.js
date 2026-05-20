const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'healing_events', fields: ['workflow_name','step_no','original_selector','patched_selector','confidence'] });
