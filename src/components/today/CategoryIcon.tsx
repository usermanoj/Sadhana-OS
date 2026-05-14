import {
  Flower2,
  MessagesSquare,
  Eye,
  Sparkles,
  Dumbbell,
  Brain,
  HeartHandshake,
  BriefcaseBusiness,
  Home,
  HelpCircle,
} from 'lucide-react';

/**
 * Maps Lucide icon names (from seed data) to actual components.
 * Using a static map avoids pulling in the entire icon library.
 */
const iconMap: Record<string, typeof Flower2> = {
  'lotus': Flower2,          // closest match for lotus
  'messages-square': MessagesSquare,
  'eye': Eye,
  'sparkles': Sparkles,
  'dumbbell': Dumbbell,
  'brain': Brain,
  'hand-heart': HeartHandshake,
  'briefcase-business': BriefcaseBusiness,
  'home-heart': Home,        // Home as fallback for home-heart
};

interface DynamicCategoryIconProps {
  iconName: string;
  color?: string;
  size?: number;
}

export function DynamicCategoryIcon({ iconName, color, size = 20 }: DynamicCategoryIconProps) {
  const IconComponent = iconMap[iconName] ?? HelpCircle;
  return <IconComponent size={size} style={{ color }} strokeWidth={2} />;
}
