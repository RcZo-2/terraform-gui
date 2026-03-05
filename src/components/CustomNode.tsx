import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
  Plus, Trash2, Edit3, Circle,
  AlertTriangle, RefreshCw, Component,
  Network, Map, Waypoints, Shield
} from 'lucide-react';
import { clsx } from 'clsx';

const CustomNode = ({ data, selected }: NodeProps) => {
  const { label, resourceType, action, moduleName, isHighlighted, isDimmed } = data;

  const getIcon = () => {
    switch (action) {
      case 'create':
        return <Plus className="w-5 h-5 text-green-700 font-bold" />;
      case 'delete':
        return <AlertTriangle className="w-5 h-5 text-red-800 font-bold" />;
      case 'update':
        return <Edit3 className="w-5 h-5 text-orange-600 font-bold" />;
      case 'replace':
        return <RefreshCw className="w-5 h-5 text-red-500 font-bold" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getBorderColor = () => {
    let bg = 'bg-white';
    let border = 'border-gray-200';

    if (action === 'create') { bg = 'bg-green-100'; border = 'border-green-500'; }
    else if (action === 'delete') { bg = 'bg-red-200'; border = 'border-red-700'; }
    else if (action === 'update') { bg = 'bg-orange-100'; border = 'border-orange-500'; }
    else if (action === 'replace') { bg = 'bg-red-50'; border = 'border-red-300'; }

    if (selected) return `border-blue-500 ring-4 ring-blue-200 ${bg}`;

    return `${border} ${bg}`;
  };

  // Helper to guess icon for resource type based on common AWS terraform resources
  const getResourceIcon = () => {
    // 1. Exact AWS Service Icons
    let iconSrc = null;

    // Compute
    if (resourceType.includes('instance') || resourceType.includes('ami')) iconSrc = '/aws-icon/Compute/EC2.svg';
    else if (resourceType.includes('autoscaling')) iconSrc = '/aws-icon/Compute/EC2-Auto-Scaling.svg';
    else if (resourceType.includes('lambda')) iconSrc = '/aws-icon/Compute/Lambda.svg';
    else if (resourceType.includes('ecs')) iconSrc = '/aws-icon/Containers/Elastic-Container-Service.svg';
    else if (resourceType.includes('eks')) iconSrc = '/aws-icon/Containers/Elastic-Kubernetes-Service.svg';
    else if (resourceType.includes('ecr')) iconSrc = '/aws-icon/Containers/Elastic-Container-Registry.svg';

    // Storage
    else if (resourceType.includes('s3_bucket')) iconSrc = '/aws-icon/Storage/Simple-Storage-Service.svg';
    else if (resourceType.includes('glacier')) iconSrc = '/aws-icon/Storage/Simple-Storage-Service-Glacier.svg';
    else if (resourceType.includes('ebs_volume')) iconSrc = '/aws-icon/Storage/Elastic-Block-Store.svg';
    else if (resourceType.includes('efs')) iconSrc = '/aws-icon/Storage/EFS.svg';

    // Database
    else if (resourceType.includes('db_') || resourceType.includes('rds')) iconSrc = '/aws-icon/Database/RDS.svg';
    else if (resourceType.includes('dynamodb')) iconSrc = '/aws-icon/Database/DynamoDB.svg';
    else if (resourceType.includes('elasticache')) iconSrc = '/aws-icon/Database/ElastiCache.svg';

    // Network & Content Delivery
    else if (resourceType === 'aws_vpc' || resourceType.includes('vpc_peering_connection')) iconSrc = '/aws-icon/Networking-Content-Delivery/Virtual-Private-Cloud.svg';
    else if (resourceType.includes('route53')) iconSrc = '/aws-icon/Networking-Content-Delivery/Route-53.svg';
    else if (resourceType.includes('cloudfront')) iconSrc = '/aws-icon/Networking-Content-Delivery/CloudFront.svg';
    else if (resourceType.includes('lb') || resourceType.includes('alb') || resourceType.includes('elb')) iconSrc = '/aws-icon/Networking-Content-Delivery/Elastic-Load-Balancing.svg';

    // Security, Identity & Compliance
    else if (resourceType.includes('iam_role') || resourceType.includes('iam_policy') || resourceType.includes('iam_user') || resourceType.includes('iam_instance_profile')) iconSrc = '/aws-icon/Security-Identity-Compliance/Identity-and-Access-Management.svg';
    else if (resourceType.includes('cognito')) iconSrc = '/aws-icon/Security-Identity-Compliance/Cognito.svg';
    else if (resourceType.includes('kms')) iconSrc = '/aws-icon/Security-Identity-Compliance/Key-Management-Service.svg';
    else if (resourceType.includes('secretsmanager')) iconSrc = '/aws-icon/Security-Identity-Compliance/Secrets-Manager.svg';
    else if (resourceType.includes('cert')) iconSrc = '/aws-icon/Security-Identity-Compliance/Certificate-Manager.svg';

    // App Integration / Messaging
    else if (resourceType.includes('sns')) iconSrc = '/aws-icon/App-Integration/Simple-Notification-Service.svg';
    else if (resourceType.includes('sqs')) iconSrc = '/aws-icon/App-Integration/Simple-Queue-Service.svg';

    // Management & Governance
    else if (resourceType.includes('cloudwatch')) iconSrc = '/aws-icon/Management-Governance/CloudWatch.svg';
    else if (resourceType.includes('trail')) iconSrc = '/aws-icon/Management-Governance/CloudTrail.svg';

    if (iconSrc) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={iconSrc} alt={resourceType} className="w-6 h-6 object-contain" />;
    }

    // 2. Fallbacks for structural components (Lucide Icons)
    // Network Fallbacks
    if (resourceType.includes('vpc') || resourceType.includes('subnet')) return <Network className="w-5 h-5 text-purple-500" />;
    if (resourceType.includes('route_table')) return <Map className="w-5 h-5 text-purple-500" />;
    if (resourceType.includes('gateway') || resourceType.includes('eip')) return <Waypoints className="w-5 h-5 text-purple-500" />;

    // Security Fallbacks
    if (resourceType.includes('security_group')) return <Shield className="w-5 h-5 text-red-500" />;

    // Default icon
    return <Component className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div className={clsx(
      "px-4 py-2 shadow-md rounded-md border-2 min-w-[200px] transition-all duration-300 relative",
      getBorderColor(),
      isDimmed ? "grayscale opacity-75" : "opacity-100",
      isHighlighted ? "scale-105 shadow-xl ring-4 ring-blue-300 z-50" : ""
    )}>
      {moduleName && (
        <div className="absolute -top-3 left-2 bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full border border-purple-200 shadow-sm font-semibold tracking-wide z-10 max-w-[90%] truncate">
          {moduleName}
        </div>
      )}
      <Handle type="target" position={Position.Left} className="!bg-gray-400" />

      <div className="flex items-center">
        <div className="mr-3 p-2 bg-white rounded-full border border-gray-100 shadow-sm">
          {getResourceIcon() || <div className="w-5 h-5" />}
        </div>
        <div className="flex-1">
          <div className="text-xs text-gray-500 font-mono">{resourceType}</div>
          <div className="text-sm font-bold text-gray-800">{label}</div>
        </div>
        <div className="ml-2">
          {getIcon()}
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-gray-400" />
    </div>
  );
};

export default memo(CustomNode);
