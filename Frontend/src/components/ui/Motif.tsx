import {
  ArrowLeft,
  ArrowRight,
  Baby,
  Blocks,
  Briefcase,
  Cake,
  Candy,
  Check,
  Club,
  Coffee,
  Compass,
  CupSoda,
  Flame,
  Flower2,
  FolderOpen,
  Gem,
  Gift,
  Headphones,
  Heart,
  HeartHandshake,
  House,
  Lightbulb,
  Lock,
  Mail,
  Martini,
  PartyPopper,
  PenLine,
  Receipt,
  Ribbon,
  Ruler,
  Search,
  ShoppingBag,
  Snowflake,
  Sparkles,
  Sprout,
  Truck,
  Undo2,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Every pictogram in the CMS is an icon key, not an emoji, so the whole site
 * draws from one monochrome outline set that inherits `currentColor`.
 */
export const motifIcons = {
  gift: Gift,
  engrave: PenLine,
  candle: Flame,
  chocolate: Candy,
  headphones: Headphones,
  toy: Blocks,
  cake: Cake,
  anniversary: Heart,
  ring: Gem,
  diya: Sparkles,
  thanks: HeartHandshake,
  home: House,
  work: Briefcase,
  baby: Baby,
  compass: Compass,
  lamp: Lightbulb,
  stars: Sparkles,
  tea: CupSoda,
  coffee: Coffee,
  plant: Sprout,
  letter: Mail,
  desk: FolderOpen,
  ruler: Ruler,
  cocktail: Martini,
  cards: Club,
  ice: Snowflake,
  flower: Flower2,
  ribbon: Ribbon,
  truck: Truck,
  lock: Lock,
  returns: Undo2,
  fast: Zap,
  bag: ShoppingBag,
  celebrate: PartyPopper,
  receipt: Receipt,
  search: Search,
  check: Check,
  next: ArrowRight,
  prev: ArrowLeft,
} satisfies Record<string, LucideIcon>;

export type MotifName = keyof typeof motifIcons;

export function Motif({
  name,
  className = "size-6",
  strokeWidth = 1.4,
}: {
  name: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = motifIcons[name as MotifName] ?? Gift;
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden />;
}
