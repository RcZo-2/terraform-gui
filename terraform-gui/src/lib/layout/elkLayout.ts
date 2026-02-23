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

    // Convert back to React Flow nodes with ABSOLUTE positions (flattened)
    const newNodes: Node[] = [];

    // Helper to calculate absolute position
    const getAbsolutePos = (node: any, parentX = 0, parentY = 0) => {
      const x = parentX + (node.x || 0);
      const y = parentY + (node.y || 0);
      return { x, y };
    };

    // 1. Add Groups (as background nodes)
    (layoutedGraph.children || []).forEach((group: any) => {
      // For root children, position is absolute (relative to root)
      const groupPos = getAbsolutePos(group);

      newNodes.push({
        id: group.id,
        position: { x: groupPos.x, y: groupPos.y },
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
        // DO NOT set parentNode or expandParent: flatten structure
      });

      // 2. Add Children (as independent nodes with absolute positions)
      (group.children || []).forEach((child: any) => {
        const originalData = child.properties?.originalData || {};

        // Calculate absolute position based on parent group
        const childPos = getAbsolutePos(child, groupPos.x, groupPos.y);

        newNodes.push({
          id: child.id,
          // Use absolute position
          position: { x: childPos.x, y: childPos.y },
          data: originalData,
          type: 'custom',
          // DO NOT set parentNode: flatten structure
          zIndex: 1, // Ensure children are above groups
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
