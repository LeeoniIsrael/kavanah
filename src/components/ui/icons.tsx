import { memo } from "react";
import type { LucideIcon, LucideProps } from "lucide-react-native";
import {
  ArrowUp as ArrowUpGlyph,
  Award as AwardGlyph,
  Bell as BellGlyph,
  BellRing as BellRingGlyph,
  BookOpen as BookOpenGlyph,
  BookOpenCheck as BookOpenCheckGlyph,
  Bookmark as BookmarkGlyph,
  BookmarkCheck as BookmarkCheckGlyph,
  BookmarkMinus as BookmarkMinusGlyph,
  CalendarDays as CalendarDaysGlyph,
  Camera as CameraGlyph,
  ChartColumn as ChartColumnGlyph,
  Check as CheckGlyph,
  ChevronDown as ChevronDownGlyph,
  ChevronLeft as ChevronLeftGlyph,
  ChevronRight as ChevronRightGlyph,
  CircleDot as CircleDotGlyph,
  CircleHelp as CircleHelpGlyph,
  CornerDownLeft as CornerDownLeftGlyph,
  ExternalLink as ExternalLinkGlyph,
  Heart as HeartGlyph,
  ImagePlus as ImagePlusGlyph,
  Info as InfoGlyph,
  Languages as LanguagesGlyph,
  LockKeyhole as LockKeyholeGlyph,
  MapPin as MapPinGlyph,
  MessageCircle as MessageCircleGlyph,
  MoonStar as MoonStarGlyph,
  Navigation as NavigationGlyph,
  Plus as PlusGlyph,
  Quote as QuoteGlyph,
  RefreshCw as RefreshCwGlyph,
  Search as SearchGlyph,
  Share as ShareGlyph,
  Share2 as Share2Glyph,
  ShieldCheck as ShieldCheckGlyph,
  SlidersHorizontal as SlidersHorizontalGlyph,
  UserRound as UserRoundGlyph,
  Users as UsersGlyph,
  Utensils as UtensilsGlyph,
  X as XGlyph,
} from "lucide-react-native";
import { iconMetrics } from "@/design/iconography";

// Named imports keep the catalog tree-shakeable. The parent control owns semantics.
function interfaceIcon(Glyph: LucideIcon): LucideIcon {
  function Component({ size = iconMetrics.control, ...props }: LucideProps) {
    return (
      <Glyph
        {...props}
        size={size}
        strokeWidth={iconMetrics.stroke}
        absoluteStrokeWidth
        pointerEvents="none"
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    );
  }
  Component.displayName = Glyph.displayName;
  return memo(Component);
}

export const ArrowUp = interfaceIcon(ArrowUpGlyph);
export const Award = interfaceIcon(AwardGlyph);
export const Bell = interfaceIcon(BellGlyph);
export const BellRing = interfaceIcon(BellRingGlyph);
export const BookOpen = interfaceIcon(BookOpenGlyph);
export const BookOpenCheck = interfaceIcon(BookOpenCheckGlyph);
export const Bookmark = interfaceIcon(BookmarkGlyph);
export const BookmarkCheck = interfaceIcon(BookmarkCheckGlyph);
export const BookmarkMinus = interfaceIcon(BookmarkMinusGlyph);
export const CalendarDays = interfaceIcon(CalendarDaysGlyph);
export const Camera = interfaceIcon(CameraGlyph);
export const ChartColumn = interfaceIcon(ChartColumnGlyph);
export const Check = interfaceIcon(CheckGlyph);
export const ChevronDown = interfaceIcon(ChevronDownGlyph);
export const ChevronLeft = interfaceIcon(ChevronLeftGlyph);
export const ChevronRight = interfaceIcon(ChevronRightGlyph);
export const CircleDot = interfaceIcon(CircleDotGlyph);
export const CircleHelp = interfaceIcon(CircleHelpGlyph);
export const CornerDownLeft = interfaceIcon(CornerDownLeftGlyph);
export const ExternalLink = interfaceIcon(ExternalLinkGlyph);
export const Heart = interfaceIcon(HeartGlyph);
export const ImagePlus = interfaceIcon(ImagePlusGlyph);
export const Info = interfaceIcon(InfoGlyph);
export const Languages = interfaceIcon(LanguagesGlyph);
export const LockKeyhole = interfaceIcon(LockKeyholeGlyph);
export const MapPin = interfaceIcon(MapPinGlyph);
export const MessageCircle = interfaceIcon(MessageCircleGlyph);
export const MoonStar = interfaceIcon(MoonStarGlyph);
export const Navigation = interfaceIcon(NavigationGlyph);
export const Plus = interfaceIcon(PlusGlyph);
export const Quote = interfaceIcon(QuoteGlyph);
export const RefreshCw = interfaceIcon(RefreshCwGlyph);
export const Search = interfaceIcon(SearchGlyph);
export const Share = interfaceIcon(ShareGlyph);
export const Share2 = interfaceIcon(Share2Glyph);
export const ShieldCheck = interfaceIcon(ShieldCheckGlyph);
export const SlidersHorizontal = interfaceIcon(SlidersHorizontalGlyph);
export const UserRound = interfaceIcon(UserRoundGlyph);
export const Users = interfaceIcon(UsersGlyph);
export const Utensils = interfaceIcon(UtensilsGlyph);
export const X = interfaceIcon(XGlyph);
