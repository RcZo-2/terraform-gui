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

  // Create Nodes
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

    nodes.push({
      id,
      position: { x: 0, y: 0 }, // Initial position, will be calculated by Dagre
      data: {
        label: resource.name,
        resourceName: resource.name,
        resourceType: resource.type,
        address: resource.address,
        action: actionType,
        details: resource
      },
      type: 'custom', // We will implement a custom node component later
    });
  });

  // Helper to recursively find dependencies in expressions
  const findReferences = (expr: any, dependencies: Set<string>) => {
    if (!expr) return;

    if (Array.isArray(expr)) {
      expr.forEach((item) => findReferences(item, dependencies));
    } else if (typeof expr === 'object') {
      if (expr.references && Array.isArray(expr.references)) {
        expr.references.forEach((ref: string) => {
          // Check if this reference matches a known resource address
          Object.keys(addressToIdMap).forEach((targetAddress) => {
            if (ref === targetAddress) {
              dependencies.add(targetAddress);
            }
          });
        });
      }
      // Recursively check nested objects
      Object.values(expr).forEach((val) => findReferences(val, dependencies));
    }
  };

  // Create Edges based on configuration expressions
  if (plan.configuration?.root_module?.resources) {
    plan.configuration.root_module.resources.forEach((config) => {
      const sourceId = config.address; // This is the dependent resource (e.g., Subnet)

      // If this resource isn't in our list of changes, we might still want to track it if we visualize existing resources
      // but for now let's stick to what's in resource_changes
      if (!addressToIdMap[sourceId]) return;

      const dependencies = new Set<string>();
      findReferences(config.expressions, dependencies);

      dependencies.forEach((targetAddress) => {
        // Prevent self-loops
        if (sourceId !== targetAddress) {
          edges.push({
            id: `${targetAddress}-${sourceId}`, // Dependency -> Dependent
            source: targetAddress, // Dependency is the source (e.g., VPC)
            target: sourceId,      // Dependent is the target (e.g., Subnet)
            type: 'smoothstep',
            animated: true,
          });
        }
      });
    });
  }

  // Deduplicate edges
  const uniqueEdges = edges.filter((edge, index, self) =>
    index === self.findIndex((t) => (
      t.source === edge.source && t.target === edge.target
    ))
  );

  return { nodes, edges: uniqueEdges };
};
