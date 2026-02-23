import ELK from 'elkjs/lib/elk.bundled.js';
import { Node, Edge } from 'reactflow';

// Create ELK instance.
const elk = new ELK();

const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.layered.spacing.nodeNodeBetweenLayers': '100',
  'elk.spacing.nodeNode': '80',
  'elk.direction': 'DOWN',
  'elk.padding': '[top=50,left=50,bottom=50,right=50]',
  'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
};

export const getElkLayout = async (nodes: Node[], edges: Edge[]) => {
  const elkNodes: any[] = [];
  const elkEdges: any[] = [];

  const groups: Record<string, any> = {};

  nodes.forEach((node) => {
    const groupKey = node.data.resourceType || 'unknown';

    if (!groups[groupKey]) {
      const groupNode = {
        id: `group-${groupKey}`,
        labels: [{ text: groupKey }],
        children: [],
        layoutOptions: {
          'elk.padding': '[top=40,left=20,bottom=20,right=20]',
          'elk.spacing.nodeNode': '20',
          'elk.algorithm': 'layered',
          'elk.direction': 'RIGHT',
        },
        properties: { type: 'group' },
      };
      groups[groupKey] = groupNode;
      elkNodes.push(groupNode);
    }

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

    const newNodes: Node[] = [];

    (layoutedGraph.children || []).forEach((group: any) => {
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

      (group.children || []).forEach((child: any) => {
        const originalData = child.properties?.originalData || {};

        newNodes.push({
          id: child.id,
          position: { x: child.x, y: child.y },
          data: originalData,
          type: 'custom',
          parentNode: group.id,
          extent: 'parent',
          expandParent: true,
        });
      });
    });

    return { nodes: newNodes, edges };
  } catch (error) {
    console.error('ELK Layout Failed:', error);
    return { nodes, edges };
  }
};
