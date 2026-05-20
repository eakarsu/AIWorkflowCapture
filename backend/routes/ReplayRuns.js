const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'replay_runs', fields: ['workflow_name','started_at','status','duration_ms','error_summary'] });
