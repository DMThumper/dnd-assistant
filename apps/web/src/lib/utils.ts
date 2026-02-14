import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number with sign prefix (+/-)
 * Used for ability modifiers, attack bonuses, etc.
 */
export function formatModifier(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

/**
 * Calculate ability modifier from ability score
 * Formula: floor((score - 10) / 2)
 */
export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Calculate proficiency bonus from level
 * Formula: floor((level - 1) / 4) + 2
 */
export function calculateProficiencyBonus(level: number): number {
  return Math.floor((level - 1) / 4) + 2;
}

/**
 * Format distance in meters (D&D uses feet, we convert)
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} км`;
  }
  return `${meters} м`;
}

/**
 * Format weight in kilograms
 */
export function formatWeight(kg: number): string {
  if (kg < 1) {
    return `${(kg * 1000).toFixed(0)} г`;
  }
  return `${kg.toFixed(1)} кг`;
}

/**
 * Parse dice notation (e.g., "2d6+3") and return components
 */
export function parseDiceNotation(notation: string): {
  count: number;
  sides: number;
  modifier: number;
} | null {
  const match = notation.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!match) return null;

  return {
    count: parseInt(match[1], 10),
    sides: parseInt(match[2], 10),
    modifier: match[3] ? parseInt(match[3], 10) : 0,
  };
}

/**
 * Format currency (D&D coins)
 */
export function formatCurrency(currency: {
  cp?: number;
  sp?: number;
  ep?: number;
  gp?: number;
  pp?: number;
}): string {
  const parts: string[] = [];
  if (currency.pp && currency.pp > 0) parts.push(`${currency.pp} пм`);
  if (currency.gp && currency.gp > 0) parts.push(`${currency.gp} зм`);
  if (currency.ep && currency.ep > 0) parts.push(`${currency.ep} эм`);
  if (currency.sp && currency.sp > 0) parts.push(`${currency.sp} см`);
  if (currency.cp && currency.cp > 0) parts.push(`${currency.cp} мм`);
  return parts.join(", ") || "0 зм";
}

/**
 * Get HP bar color based on percentage
 */
export function getHpBarColor(current: number, max: number): string {
  const percentage = (current / max) * 100;
  if (percentage <= 25) return "bg-destructive";
  if (percentage <= 50) return "bg-warning";
  return "bg-success";
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Sleep utility for animations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
