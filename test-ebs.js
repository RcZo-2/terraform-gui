const fs = require('fs');
const plan = JSON.parse(fs.readFileSync('lab.json'));

const deps = new Set();
const findReferences = (expr, dependencies) => {
    if (!expr) return;

    if (Array.isArray(expr)) {
      expr.forEach((item) => findReferences(item, dependencies));
    } else if (typeof expr === 'object') {
      if (expr.references && Array.isArray(expr.references)) {
        expr.references.forEach((ref) => {
          dependencies.add(ref);
        });
      }
      Object.values(expr).forEach((val) => findReferences(val, dependencies));
    }
};

plan.configuration.root_module.module_calls.storage_gateway.module.resources.forEach(r => {
  if (r.type === 'aws_ebs_volume') {
      findReferences(r.expressions, deps);
      console.log('aws_ebs_volume refs:', deps);
  }
  if (r.type === 'aws_volume_attachment') {
      findReferences(r.expressions, deps);
      console.log('aws_volume_attachment refs:', deps);
  }
});
