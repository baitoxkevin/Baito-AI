import {
  Car,
  Utensils,
  Hotel,
  Laptop,
  Phone,
  GraduationCap,
  Package,
  type LucideIcon
} from "lucide-react";

export const statusGradients = {
  'pending': 'from-yellow-400 to-orange-500',
  'in-progress': 'from-blue-400 to-indigo-500',
  'completed': 'from-green-400 to-emerald-500',
  'cancelled': 'from-red-400 to-pink-500',
};

export const priorityColors = {
  'low': 'from-gray-400 to-slate-500',
  'medium': 'from-yellow-400 to-amber-500',
  'high': 'from-orange-400 to-red-500',
  'urgent': 'from-red-500 to-rose-600',
};

export const categoryColors: Record<string, { bg: string; text: string; icon: LucideIcon }> = {
  'fuel': { bg: 'bg-purple-100', text: 'text-purple-800', icon: Car },
  'food': { bg: 'bg-orange-100', text: 'text-orange-800', icon: Utensils },
  'accommodation': { bg: 'bg-blue-100', text: 'text-blue-800', icon: Hotel },
  'equipment': { bg: 'bg-green-100', text: 'text-green-800', icon: Laptop },
  'communication': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Phone },
  'training': { bg: 'bg-red-100', text: 'text-red-800', icon: GraduationCap },
  'other': { bg: 'bg-gray-100', text: 'text-gray-800', icon: Package },
};