/**
 * palette-shaded.ts - Typed color palette providing fill, lit, shade, and stroke colors.
 */

export interface ShadedColor {
  fill: string;
  lit: string;
  shade: string;
  stroke: string;
}

export const SHADED: Record<string, ShadedColor> = {
  skin: { fill: '#F5C596', lit: '#FDE2C8', shade: '#D89B6A', stroke: '#7A4822' },
  cream: { fill: '#F5E9CF', lit: '#FFF7E6', shade: '#D8C6A0', stroke: '#75633E' },
  bluePants: { fill: '#2563EB', lit: '#60A5FA', shade: '#1D4ED8', stroke: '#1E3A8A' },
  bowlerShirt: { fill: '#F2C14E', lit: '#FDE68A', shade: '#D99B26', stroke: '#785108' },
  bowlerPants: { fill: '#3B3F4A', lit: '#555B6A', shade: '#262930', stroke: '#16181D' },
  uncleVest: { fill: '#FAF6EC', lit: '#FFFFFF', shade: '#DDD6C5', stroke: '#7A7263' },
  uncleLungi: { fill: '#EBD9B0', lit: '#F5E9CF', shade: '#C8B586', stroke: '#6B5B37' },
  schoolShirt: { fill: '#FFFFFF', lit: '#FFFFFF', shade: '#CBD5E1', stroke: '#64748B' },
  schoolPants: { fill: '#1E3A8A', lit: '#3B82F6', shade: '#172554', stroke: '#0F172A' },
  gullyShirt: { fill: '#4A7FB5', lit: '#7BA8D4', shade: '#366291', stroke: '#1E3D60' },
  gullyShirtOrange: { fill: '#F97316', lit: '#FDBA74', shade: '#C2410C', stroke: '#7C2D12' },
  batWillow: { fill: '#E0A868', lit: '#F0C48E', shade: '#B57E44', stroke: '#5C3814' },
  batHandle: { fill: '#EBD9B0', lit: '#F8EED8', shade: '#C8B485', stroke: '#695A38' },
  redStripe: { fill: '#D62828', lit: '#EF4444', shade: '#991B1B', stroke: '#5A0B0B' },
  shoes: { fill: '#262A33', lit: '#3F4452', shade: '#181B22', stroke: '#0F1116' },
  uncleChappals: { fill: '#6B4226', lit: '#8C5632', shade: '#4A2D18', stroke: '#2B170B' },
};
