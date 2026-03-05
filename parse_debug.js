const fs = require('fs');
const plan = JSON.parse(fs.readFileSync('lab.json'));

const addressToIdMap = Object.fromEntries(plan.resource_changes.map(r => [r.address, r.address]));
const edges = [];

const findReferences = (expr, dependencies) => {
  if (!expr) return;

  if (Array.isArray(expr)) {
    expr.forEach((item) => findReferences(item, dependencies));
  } else if (typeof expr === 'object') {
    if (expr.references && Array.isArray(expr.references)) {
      expr.references.forEach((ref) => {
        // Just add the raw ref! We will resolve it later in processModule
        dependencies.add(ref);
      });
    }
    Object.values(expr).forEach((val) => findReferences(val, dependencies));
  }
};

const processModule = (mod, pathPrefix = '') => {
  if (!mod) return;

  if (mod.resources) {
    mod.resources.forEach((config) => {
      const sourceId = pathPrefix ? `${pathPrefix}.${config.address}` : config.address;

      if (!addressToIdMap[sourceId]) return;

      const dependencies = new Set();
      findReferences(config.expressions, dependencies);

      if (sourceId.includes('aws_volume_attachment.cache_attach')) {
         console.log('ATTACH DEPENDENCIES RAW:', dependencies);
      }

      dependencies.forEach((targetAddress) => {
        let resolvedTarget = targetAddress;
        if (pathPrefix && !targetAddress.startsWith('module.')) {
            resolvedTarget = `${pathPrefix}.${targetAddress}`;
        }

        if (addressToIdMap[resolvedTarget]) {
           resolvedTarget = addressToIdMap[resolvedTarget];
        } else if (addressToIdMap[targetAddress]) {
           resolvedTarget = addressToIdMap[targetAddress];
        }

        if (sourceId.includes('aws_volume_attachment.cache_attach')) {
           console.log('Resolving', targetAddress, '->', resolvedTarget);
        }

        if (sourceId !== resolvedTarget && addressToIdMap[resolvedTarget]) {
          edges.push({
            id: `${resolvedTarget}-${sourceId}`,
            source: resolvedTarget,
            target: sourceId,
            type: 'smoothstep',
            animated: true,
          });
        }
      });
    });
  }

  if (mod.module_calls) {
    Object.keys(mod.module_calls).forEach((callName) => {
      const callObj = mod.module_calls[callName];
      const newPrefix = pathPrefix ? `${pathPrefix}.module.${callName}` : `module.${callName}`;
      if (callObj.module) {
        processModule(callObj.module, newPrefix);
      }
    });
  }
};

processModule(plan.configuration.root_module);
console.log('Edges for aws_volume_attachment.cache_attach:', edges.filter(e => e.target.includes('aws_volume_attachment.cache_attach')));
