'use client';

import { Resource, ResourceDefinition } from '@/lib/types';

interface ResourceDisplayProps {
  resources: Resource[];
  resourceDefinitions?: ResourceDefinition[];
}

const defaultResourceIcons: Record<string, string> = {
  gold: '💰',
  reputation: '⭐',
  influence: '💼',
  item: '📦',
};

const defaultResourceNames: Record<string, string> = {
  gold: '金币',
  reputation: '声望',
  influence: '影响力',
  item: '道具',
};

export default function ResourceDisplay({ resources, resourceDefinitions }: ResourceDisplayProps) {
  // If resource definitions exist, only show defined resources
  let displayResources = resources;
  
  if (resourceDefinitions && resourceDefinitions.length > 0) {
    // Show all defined resource types, even if amount is 0
    const definedTypes = new Set(resourceDefinitions.map(rd => rd.type));
    const definedResources: Resource[] = resourceDefinitions.map(rd => {
      const existing = resources.find(r => r.type === rd.type && r.type !== 'item');
      return existing || {
        type: rd.type,
        amount: rd.initialAmount || 0
      };
    });
    
    // Add items separately
    const items = resources.filter(r => r.type === 'item');
    displayResources = [...definedResources, ...items];
  }
  
  const simpleResources = displayResources.filter(r => r.type !== 'item');
  const items = displayResources.filter(r => r.type === 'item');

  const getResourceInfo = (type: string) => {
    if (resourceDefinitions) {
      const def = resourceDefinitions.find(rd => rd.type === type);
      if (def) {
        return {
          name: def.name,
          icon: def.icon || defaultResourceIcons[type] || '📦'
        };
      }
    }
    return {
      name: defaultResourceNames[type] || type,
      icon: defaultResourceIcons[type] || '📦'
    };
  };

  return (
    <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
      <h3 className="text-sm font-medium text-gray-400 mb-3">资源</h3>
      {displayResources.length === 0 ? (
        <p className="text-gray-500 text-sm">暂无资源</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {simpleResources.map((resource, index) => {
            const info = getResourceInfo(resource.type);
            return (
              <div
                key={`${resource.type}-${index}`}
                className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 rounded-lg"
              >
                <span className="text-lg">{info.icon}</span>
                <span className="text-gray-300 text-sm">
                  {info.name}: {resource.amount || 0}
                </span>
              </div>
            );
          })}
          {items.map((item, index) => (
            <div
              key={`item-${item.name}-${index}`}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 rounded-lg"
              title={item.description}
            >
              <span className="text-lg">{defaultResourceIcons.item}</span>
              <span className="text-gray-300 text-sm">{item.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
