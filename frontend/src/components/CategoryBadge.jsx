import React from 'react';
import {
  AlertTriangle,
  Droplets,
  Zap,
  Trash2,
  Waves,
  Lightbulb,
  HelpCircle
} from 'lucide-react';

export const CATEGORY_DEFINITIONS = [
  { value: 'ROADS_AND_POTHOLES', label: 'Roads and potholes', icon: AlertTriangle },
  { value: 'WATER_SUPPLY', label: 'Water supply', icon: Droplets },
  { value: 'ELECTRICITY', label: 'Electricity', icon: Zap },
  { value: 'GARBAGE_COLLECTION', label: 'Garbage collection', icon: Trash2 },
  { value: 'DRAINAGE', label: 'Drainage', icon: Waves },
  { value: 'STREETLIGHTS', label: 'Streetlights', icon: Lightbulb },
  { value: 'OTHER', label: 'Other civic issues', icon: HelpCircle },
];

export const CategoryBadge = ({ category, displayName }) => {
  const match = CATEGORY_DEFINITIONS.find((c) => c.value === category);
  const IconComponent = match ? match.icon : HelpCircle;
  const label = displayName || (match ? match.label : category);

  return (
    <span className="category-tag">
      <IconComponent size={13} />
      <span>{label}</span>
    </span>
  );
};

export default CategoryBadge;
