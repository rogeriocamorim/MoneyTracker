import {
  UtensilsCrossed,
  Car,
  Zap,
  Gamepad2,
  ShoppingBag,
  Heart,
  Home,
  GraduationCap,
  Sparkles,
  CreditCard,
  Plane,
  Gift,
  Shield,
  Store,
  MoreHorizontal,
  Briefcase,
  Laptop,
  TrendingUp,
  Wallet,
  Banknote,
  ArrowRightLeft,
  Landmark,
  PiggyBank,
  Tag,
  CircleDot,
} from 'lucide-react'

/**
 * Map of icon name strings → Lucide React components.
 * Only includes icons actually used in categories.js + fallbacks.
 */
const iconMap = {
  UtensilsCrossed,
  Car,
  Zap,
  Gamepad2,
  ShoppingBag,
  Heart,
  Home,
  GraduationCap,
  Sparkles,
  CreditCard,
  Plane,
  Gift,
  Shield,
  Store,
  MoreHorizontal,
  Briefcase,
  Laptop,
  TrendingUp,
  Wallet,
  Banknote,
  ArrowRightLeft,
  Landmark,
  PiggyBank,
  Tag,
  CircleDot,
}

/**
 * Resolve a Lucide icon name string (e.g. 'UtensilsCrossed') to its React component.
 * Returns the CircleDot fallback icon if the name isn't found in the map.
 */
export function getIconComponent(iconName) {
  if (!iconName) return CircleDot
  return iconMap[iconName] || CircleDot
}
