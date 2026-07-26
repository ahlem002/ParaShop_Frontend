import {
  FlaskConical,
  Pill,
  Sparkles,
  Leaf,
  type LucideIcon,
} from 'lucide-react';

export interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
}

export const categories: Category[] = [
  { id: 'medications', name: 'Medications', icon: Pill },
  {
    id: 'parapharmaceutical',
    name: 'Parapharmaceutical products',
    icon: FlaskConical,
  },
  { id: 'cosmetics', name: 'Cosmetics', icon: Sparkles },
  { id: 'dietary-supplements', name: 'Dietary supplements', icon: Leaf },
];
