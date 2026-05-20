const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'selector_library', fields: ['app_name','semantic_label','css_selector','success_count'] });
