"use client";

import {
  User, Home, Briefcase, TrendingUp, TrendingDown, Building, Award, FileText,
  ClipboardList, GraduationCap, Heart, Sparkles, CreditCard,
  Landmark, DollarSign, Users, Calculator, Settings, Target,
  Paperclip, CheckSquare, ChevronDown, ChevronRight, Check,
  AlertCircle, Circle, Leaf, MapPin, Calendar, Shield, type LucideProps
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  user: User,
  home: Home,
  briefcase: Briefcase,
  "trending-up": TrendingUp,
  building: Building,
  award: Award,
  "file-text": FileText,
  "clipboard-list": ClipboardList,
  "graduation-cap": GraduationCap,
  heart: Heart,
  sparkles: Sparkles,
  "credit-card": CreditCard,
  landmark: Landmark,
  "dollar-sign": DollarSign,
  users: Users,
  calculator: Calculator,
  settings: Settings,
  target: Target,
  paperclip: Paperclip,
  "check-square": CheckSquare,
  "chevron-down": ChevronDown,
  "chevron-right": ChevronRight,
  check: Check,
  "alert-circle": AlertCircle,
  circle: Circle,
  leaf: Leaf,
  "trending-down": TrendingDown,
  "map-pin": MapPin,
  calendar: Calendar,
  shield: Shield
};

interface LucideIconProps extends LucideProps {
  name: string;
}

export function LucideIcon({ name, ...props }: LucideIconProps) {
  const IconComponent = iconMap[name];
  if (!IconComponent) return <Circle {...props} />;
  return <IconComponent {...props} />;
}
