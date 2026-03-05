import { Node, Edge } from 'reactflow';

export interface TerraformPlan {
  resource_changes: ResourceChange[];
  configuration?: {
    root_module?: {
      resources?: ResourceConfig[];
    };
  };
}

export interface ResourceChange {
  address: string;
  type: string;
  name: string;
  provider_name: string;
  change: {
    actions: string[];
    before: any;
    after: any;
  };
}

export interface ResourceConfig {
  address: string;
  expressions?: Record<string, any>;
}

export const parsePlan = (plan: TerraformPlan): { nodes: Node[], edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const addressToIdMap: Record<string, string> = {};

  if (!plan || !plan.resource_changes) {
    return { nodes, edges };
  }

  const moduleNodes = new Set<string>();

  // Create Nodes
  const groupNodesMap: Record<string, boolean> = {};

  plan.resource_changes.forEach((resource) => {
    // Generate a unique ID for the node
    const id = resource.address;
    addressToIdMap[resource.address] = id;

    // Determine the action (create, update, delete, no-op)
    const actions = resource.change.actions;
    let actionType = 'no-op';
    if (actions.includes('create')) actionType = 'create';
    else if (actions.includes('delete')) actionType = 'delete';
    else if (actions.includes('update')) actionType = 'update';

    // Determine module path (parent node)
    let parentNode: string | undefined = undefined;
    const parts = id.split('.');

    // Extract all consecutive module.X pairs
    const modulePrefixes: string[] = [];
    let i = 0;
    while (i < parts.length - 1 && parts[i] === 'module') {
      modulePrefixes.push(`module.${parts[i + 1]}`);
      i += 2;
    }

    if (modulePrefixes.length > 0) {
      parentNode = modulePrefixes.join('.');
    }

    const groupId = parentNode ? `group-${parentNode}-${resource.type}` : `group-${resource.type}`;

    if (!groupNodesMap[groupId]) {
      groupNodesMap[groupId] = true;
      nodes.push({
        id: groupId,
        type: 'group',
        position: { x: 0, y: 0 },
        data: { label: resource.type },
        style: {
          backgroundColor: 'rgba(240, 240, 240, 0.2)',
          border: '1px dashed #ccc',
          borderRadius: '8px',
        },
      });
    }

    nodes.push({
      id,
      position: { x: 0, y: 0 }, // Initial position, will be calculated by Dagre
      data: {
        label: resource.name,
        resourceName: resource.name,
        resourceType: resource.type,
        address: resource.address,
        action: actionType,
        details: resource,
        moduleName: parentNode,
      },
      type: 'custom',
      parentNode: groupId,
      extent: 'parent',
    });
  });

  const finalNodes = nodes;



  // Helper to recursively find dependencies in expressions
  const findReferences = (expr: any, dependencies: Set<string>) => {
    if (!expr) return;

    if (Array.isArray(expr)) {
      expr.forEach((item) => findReferences(item, dependencies));
    } else if (typeof expr === 'object') {
      if (expr.references && Array.isArray(expr.references)) {
        expr.references.forEach((ref: string) => {
          // Just add the raw ref! We will resolve it later in processModule
          dependencies.add(ref);
        });
      }
      // Recursively check nested objects
      Object.values(expr).forEach((val) => findReferences(val, dependencies));
    }
  };

  // Helper to process a module (root or child) and extract dependencies
  const processModule = (mod: any, pathPrefix: string = '') => {
    if (!mod) return;

    // Process resources in this module
    if (mod.resources) {
      mod.resources.forEach((config: any) => {
        // Construct the full address for this resource, because relative addresses are found in module configs
        const sourceId = pathPrefix ? `${pathPrefix}.${config.address}` : config.address;

        // If this resource isn't in our list of changes, we might still want to track it if we visualize existing resources
        // but for now let's stick to what's in resource_changes
        if (!addressToIdMap[sourceId]) return;

        const dependencies = new Set<string>();
        findReferences(config.expressions, dependencies);

        // Also check depends_on
        if (config.depends_on && Array.isArray(config.depends_on)) {
          config.depends_on.forEach((dep: string) => {
            // depends_on might just be the exact relative or absolute address
            let resolvedDep = dep;
            if (pathPrefix && !dep.startsWith('module.')) {
              resolvedDep = `${pathPrefix}.${dep}`;
            }
            if (addressToIdMap[resolvedDep]) {
              dependencies.add(resolvedDep);
            } else if (addressToIdMap[dep]) {
              dependencies.add(dep);
            }
          });
        }

        dependencies.forEach((targetAddress) => {
          // Resolve target address just like source if it is local
          let resolvedTarget = targetAddress;
          if (pathPrefix && !targetAddress.startsWith('module.')) {
            resolvedTarget = `${pathPrefix}.${targetAddress}`;
          }

          if (addressToIdMap[resolvedTarget]) {
            resolvedTarget = addressToIdMap[resolvedTarget];
          } else if (addressToIdMap[targetAddress]) {
            resolvedTarget = addressToIdMap[targetAddress];
          }

          // Prevent self-loops
          if (sourceId !== resolvedTarget) {
            edges.push({
              id: `${resolvedTarget}-${sourceId}`, // Dependency -> Dependent
              source: resolvedTarget, // Dependency is the source (e.g., VPC)
              target: sourceId,      // Dependent is the target (e.g., Subnet)
              type: 'smoothstep',
              animated: true,
            });
          }
        });
      });
    }

    // Recursively process child modules (older format)
    if (mod.child_modules) {
      mod.child_modules.forEach((childMod: any) => {
        // Find module name from address
        const parts = childMod.address.split('.');
        const moduleName = parts[parts.length - 1];
        const newPrefix = pathPrefix ? `${pathPrefix}.module.${moduleName}` : `module.${moduleName}`;
        processModule(childMod, newPrefix);
      });
    }

    // Recursively process module_calls (newer terraform format)
    if (mod.module_calls) {
      Object.keys(mod.module_calls).forEach((callName) => {
        const callObj = mod.module_calls[callName];
        const newPrefix = pathPrefix ? `${pathPrefix}.module.${callName}` : `module.${callName}`;

        // Sometimes expressions are defined in the module call block mapping inputs
        if (callObj.expressions) {
          // We can also parse module-level dependencies if needed,
          // but for resource-to-resource edges, variables usually flow through.
        }

        if (callObj.module) {
          processModule(callObj.module, newPrefix);
        }
      });
    }
  };

  // Create Edges based on configuration expressions and explicit depends_on
  if (plan.configuration?.root_module) {
    processModule(plan.configuration.root_module);
  }

  // Deduplicate edges
  const uniqueEdges = edges.filter((edge, index, self) =>
    index === self.findIndex((t) => (
      t.source === edge.source && t.target === edge.target
    ))
  );

  return { nodes: finalNodes, edges: uniqueEdges };
};
