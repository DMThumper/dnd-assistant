/**
 * Level-up utility functions
 * Extracted from level-up page for SOLID compliance
 */

// Step types for level-up wizard
export type LevelUpStep =
  | "hp"
  | "class"
  | "subclass"
  | "subclass_choices"
  | "asi"
  | "feat_choices"
  | "features"
  | "confirm";

// Ability names in Russian
const ABILITY_NAMES: Record<string, string> = {
  strength: "СИЛ",
  dexterity: "ЛОВ",
  constitution: "ТЕЛ",
  intelligence: "ИНТ",
  wisdom: "МДР",
  charisma: "ХАР",
};

const ABILITY_NAMES_FULL: Record<string, string> = {
  strength: "Сила",
  dexterity: "Ловкость",
  constitution: "Телосложение",
  intelligence: "Интеллект",
  wisdom: "Мудрость",
  charisma: "Харизма",
};

/**
 * Get abbreviated ability name in Russian
 */
export function getAbilityName(key: string): string {
  return ABILITY_NAMES[key] || key;
}

/**
 * Get full ability name in Russian
 */
export function getAbilityNameFull(key: string): string {
  return ABILITY_NAMES_FULL[key] || key;
}

/**
 * Calculate proficiency bonus for a given level
 */
export function getProficiencyBonus(level: number): number {
  return Math.floor((level - 1) / 4) + 2;
}

/**
 * Evaluate a formula string with level and proficiency bonus
 * Supports: level, proficiency_bonus, ceil(), floor(), basic math
 */
export function evaluateFormula(
  formula: string,
  level: number,
  proficiencyBonus?: number
): number {
  if (!formula) return 0;

  const pb = proficiencyBonus ?? getProficiencyBonus(level);

  // Replace variables
  let expr = formula
    .replace(/level/g, String(level))
    .replace(/proficiency_bonus/g, String(pb))
    .replace(/proficiency/g, String(pb));

  // Handle ceil() function
  expr = expr.replace(/ceil\(([^)]+)\)/g, (_, inner) => {
    try {
      const value = Function(`"use strict"; return (${inner})`)();
      return String(Math.ceil(value));
    } catch {
      return "0";
    }
  });

  // Handle floor() function
  expr = expr.replace(/floor\(([^)]+)\)/g, (_, inner) => {
    try {
      const value = Function(`"use strict"; return (${inner})`)();
      return String(Math.floor(value));
    } catch {
      return "0";
    }
  });

  // Evaluate the final expression
  try {
    return Function(`"use strict"; return (${expr})`)();
  } catch {
    return 0;
  }
}

/**
 * Feature type for formatting
 */
export interface FeatureForFormat {
  name: string;
  description?: string;
  short_description?: string;
  type?: string;
  resource_max_formula?: string;
  resource_use_max_formula?: string;
  resource_die?: string;
}

/**
 * Calculated values from feature formatting
 */
export interface CalculatedValues {
  total?: string;
  maxPerUse?: string;
}

/**
 * Format feature description with calculated values based on level
 */
export function formatFeatureWithCalculatedValues(
  feature: FeatureForFormat,
  level: number
): {
  description: string;
  calculatedValues?: CalculatedValues;
} {
  // Use short_description if available, otherwise description
  let description = feature.short_description || feature.description || "";

  // Calculate values if this is a resource type
  const calculatedValues: CalculatedValues = {};

  if (feature.resource_max_formula) {
    const total = evaluateFormula(feature.resource_max_formula, level);
    const die = feature.resource_die || "";
    calculatedValues.total = `${total}${die}`;

    // Replace text patterns with calculated values
    description = description
      .replace(/5 × уровень друида d6/g, `${total}d6`)
      .replace(/5 × уровень/g, String(total))
      .replace(/level \* 5/g, String(total));
  }

  if (feature.resource_use_max_formula) {
    const maxPerUse = evaluateFormula(feature.resource_use_max_formula, level);
    calculatedValues.maxPerUse = String(maxPerUse);

    // Replace text patterns
    description = description
      .replace(/половина уровня/g, String(maxPerUse))
      .replace(/макс\. за раз = половина уровня/g, `макс. за раз: ${maxPerUse}`)
      .replace(/ceil\(level \/ 2\)/g, String(maxPerUse));
  }

  return {
    description,
    calculatedValues: Object.keys(calculatedValues).length > 0 ? calculatedValues : undefined,
  };
}

/**
 * Get human-readable step name
 */
export function getStepName(step: LevelUpStep): string {
  const names: Record<LevelUpStep, string> = {
    hp: "Здоровье",
    class: "Класс",
    subclass: "Подкласс",
    subclass_choices: "Выбор круга",
    asi: "Характеристики",
    feat_choices: "Выбор черты",
    features: "Способности",
    confirm: "Подтверждение",
  };
  return names[step] || "";
}

/**
 * Get step icon name for UI
 */
export function getStepIcon(step: LevelUpStep): string {
  const icons: Record<LevelUpStep, string> = {
    hp: "Heart",
    class: "Swords",
    subclass: "GitBranch",
    subclass_choices: "Settings",
    asi: "TrendingUp",
    feat_choices: "Star",
    features: "Sparkles",
    confirm: "Check",
  };
  return icons[step] || "Circle";
}

/**
 * Calculate ability modifier from score
 */
export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Format modifier with + or - sign
 */
export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : String(mod);
}
