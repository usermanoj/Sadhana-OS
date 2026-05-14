import {
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Calendar,
  CheckCircle,
  Dumbbell,
  Eye,
  Flame,
  Flower2,
  Brain,
  HeartHandshake,
  Home,
  HelpCircle,
  Leaf,
  Lightbulb,
  MessageCircle,
  MessagesSquare,
  Moon,
  Mountain,
  Music,
  PenLine,
  Shield,
  Smile,
  Sparkles,
  Star,
  Sun,
  Target,
  Timer,
  Users,
  Waves,
} from 'lucide-react';

/**
 * Maps Lucide icon names (from seed data) to actual components.
 * Using a static map avoids pulling in the entire icon library.
 */
const iconMap: Record<string, typeof Flower2> = {
  'bar-chart-3': BarChart3,
  'book-open': BookOpen,
  'briefcase-business': BriefcaseBusiness,
  'calendar': Calendar,
  'check-circle': CheckCircle,
  'dumbbell': Dumbbell,
  'eye': Eye,
  'flame': Flame,
  'lotus': Flower2,          // closest match for lotus
  'leaf': Leaf,
  'lightbulb': Lightbulb,
  'message-circle': MessageCircle,
  'messages-square': MessagesSquare,
  'brain': Brain,
  'hand-heart': HeartHandshake,
  'home-heart': Home,        // Home as fallback for home-heart
  'moon': Moon,
  'mountain': Mountain,
  'music': Music,
  'pen-line': PenLine,
  'shield': Shield,
  'smile': Smile,
  'sparkles': Sparkles,
  'star': Star,
  'sun': Sun,
  'target': Target,
  'timer': Timer,
  'users': Users,
  'waves': Waves,
};

export const CATEGORY_ICON_OPTIONS = Object.keys(iconMap);

interface DynamicCategoryIconProps {
  iconName: string;
  color?: string;
  size?: number;
}

export function DynamicCategoryIcon({ iconName, color, size = 20 }: DynamicCategoryIconProps) {
  const IconComponent = iconMap[iconName] ?? HelpCircle;
  return <IconComponent size={size} style={{ color }} strokeWidth={2} />;
}
