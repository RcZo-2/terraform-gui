import ELK from 'elkjs/lib/elk.bundled.js';
import { Node, Edge } from 'reactflow';

// Create ELK instance.
const elk = new ELK();

const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.layered.spacing.nodeNodeBetweenLayers': '120',
  'elk.spacing.nodeNode': '100',
  'elk.direction': 'DOWN',
  'elk.padding': '[top=50,left=50,bottom=50,right=50]',
  'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
  'elk.edgeRouting': 'ORTHOGONAL',
};

export const getElkLayout = async (nodes: Node[], edges: Edge[]) => {
  const elkNodes: any[] = [];
  const elkEdges: any[] = [];

  // Store groups
  const groups: Record<string, any> = {};

  // Group nodes by Module or Parent Address component
  nodes.forEach((node) => {
    let groupKey = 'root';
    const parts = node.data.address.split('.');

    if (parts.length > 2) {
      const moduleIndex = parts.indexOf('module');
      if (moduleIndex !== -1 && parts.length > moduleIndex + 2) {
         // group by module name e.g., module.vpc
         groupKey = parts.slice(0, moduleIndex + 2).join('.');
      } else {
         groupKey = node.data.resourceType;
      }
    } else {
       groupKey = node.data.resourceType;
    }

    if (!groups[groupKey]) {
      const groupNode = {
        id: `group-${groupKey}`,
        labels: [{ text: groupKey }], // Label for ELK
        children: [],
        layoutOptions: {
          'elk.padding': '[top=40,left=20,bottom=20,right=20]',
          'elk.spacing.nodeNode': '30',
          'elk.algorithm': 'rectpacking', // Tighter packing inside groups
          'elk.aspectRatio': '2.5', // Try to keep groups slightly wider
        },
        properties: { type: 'group' },
      };
      groups[groupKey] = groupNode;
      elkNodes.push(groupNode);
    }

    // Add child node to group
    groups[groupKey].children.push({
      id: node.id,
      width: 250,
      height: 80,
      labels: [{ text: node.data.label }],
      layoutOptions: {
        'elk.portConstraints': 'FIXED_ORDER',
      },
      properties: {
        originalData: node.data,
      },
    });
  });

  edges.forEach((edge) => {
    elkEdges.push({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    });
  });

  const graph: any = {
    id: 'root',
    layoutOptions: elkOptions,
    children: elkNodes,
    edges: elkEdges,
  };

  try {
    const layoutedGraph = await elk.layout(graph);

    // Convert back to React Flow nodes
    const newNodes: Node[] = [];

    // 1. Add Groups
    (layoutedGraph.children || []).forEach((group: any) => {
      // Note: ELK returns x,y relative to parent. For root children, it's absolute.
      newNodes.push({
        id: group.id,
        position: { x: group.x, y: group.y },
        data: { label: group.labels?.[0]?.text },
        style: {
          width: group.width,
          height: group.height,
          backgroundColor: 'rgba(240, 245, 255, 0.5)',
          border: '1px dashed #cbd5e1',
          borderRadius: '8px',
          color: '#64748b',
          fontWeight: 'bold',
          padding: '10px',
        },
        type: 'group',
        zIndex: -1,
      });

      // 2. Add Children
      (group.children || []).forEach((child: any) => {
        const originalData = child.properties?.originalData || {};

        // IMPORTANT FIX:
        // React Flow `parentNode` expects `position` to be RELATIVE to the parent node's top-left corner (0,0).
        // ELK returns `x` and `y` relative to parent's content box (usually).
        // However, if we use `extent: 'parent'`, the node must fit inside.
        // Let's verify coordinates. If ELK returns absolute coords for nested nodes (which it sometimes does depending on options),
        // we might need to adjust. But `layered` usually handles hierarchy.
        // BUT: If the group node has padding, ELK's child coordinates might be relative to the content area,
        // whereas React Flow coordinates are relative to the top-left corner of the parent node div.
        // Let's assume ELK returns relative to parent's top-left for now.

        newNodes.push({
          id: child.id,
          // Relative position to parent
          position: { x: child.x, y: child.y },
          data: originalData,
          type: 'custom',
          parentNode: group.id,
          extent: 'parent',
          expandParent: true,
        });
      });
    });

    const newEdges = edges.map(edge => ({
      ...edge,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#b1b1b7', strokeWidth: 2 },
    }));

    return { nodes: newNodes, edges: newEdges };
  } catch (error) {
    console.error('ELK Layout Failed:', error);
    return { nodes, edges };
  }
};
