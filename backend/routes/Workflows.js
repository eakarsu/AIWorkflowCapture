const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'workflows', fields: ['name','app_name','intent','status','step_count','notes'] });
