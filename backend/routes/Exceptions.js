const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'exceptions', fields: ['workflow_name','step_no','kind','status','notes'] });
