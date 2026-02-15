// Race trait
export interface RaceTrait {
  key: string;
  name: string;
  description: string;
}

// Race proficiencies
export interface RaceProficiencies {
  weapons: string[];
  armor: string[];
  tools: string[];
}

// Ability bonuses (can be fixed or flexible choice)
export interface AbilityBonuses {
  strength?: number;
  dexterity?: number;
  constitution?: number;
  intelligence?: number;
  wisdom?: number;
  charisma?: number;
  choice?: {
    count: number;
    amount: number;
    exclude?: string[];
    options?: string[];
  };
}

// Speed (in meters)
export interface Speed {
  walk: number;
  fly?: number;
  swim?: number;
  climb?: number;
  burrow?: number;
}

// Race
export interface Race {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  size: "tiny" | "small" | "medium" | "large" | "huge" | "gargantuan";
  ability_bonuses: AbilityBonuses;
  speed: Speed;
  traits: RaceTrait[];
  languages: string[];
  proficiencies: RaceProficiencies;
  skill_proficiencies: string[];
  parent_slug: string | null;
  is_subrace: boolean;
  age_info: { maturity: number; lifespan: number | null } | null;
  size_info: { height_range: string; weight_range: string } | null;
  is_system: boolean;
  sort_order: number;
}

// Class feature
export interface ClassFeature {
  key: string;
  name: string;
  description: string;
  type: "feature" | "choice" | "subclass" | "asi" | "spellcasting" | "resource" | "improvement";
  options?: string[];
  uses?: number | string;
  recharge?: "short_rest" | "long_rest";
  cost?: string;
  level?: number;
}

// Spell slots per level
export interface SpellSlots {
  [level: string]: {
    [slotLevel: string]: number;
  };
}

// Character class
export interface CharacterClass {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  hit_die: string;
  primary_abilities: string[];
  saving_throws: string[];
  armor_proficiencies: string[];
  weapon_proficiencies: string[];
  tool_proficiencies: string[];
  skill_choices: number;
  skill_options: string[];
  starting_equipment: StartingEquipment[];
  starting_gold_formula: string | null;
  level_features: { [level: string]: ClassFeature[] };
  progression: { [level: string]: Record<string, unknown> };
  is_spellcaster: boolean;
  spellcasting_ability: string | null;
  spell_slots: SpellSlots | null;
  spells_known: { [level: string]: number } | null;
  subclass_level: string | null;
  subclass_name: string | null;
  is_system: boolean;
  sort_order: number;
}

// Starting equipment item
export interface StartingEquipmentItem {
  item: string;
  qty: number;
  if?: string;
}

// Starting equipment (can be a choice or fixed)
export interface StartingEquipment {
  choice?: boolean;
  options?: StartingEquipmentItem[][];
  item?: string;
  qty?: number;
}

// Ability definition from rule system
export interface AbilityDefinition {
  key: string;
  name: string;
  short: string;
}

// Skill definition from rule system
export interface SkillDefinition {
  key: string;
  ability: string;
  name: string;
}

// Character creation rules
export interface CreationRules {
  methods: ("point_buy" | "standard_array" | "roll")[];
  point_buy_budget: number;
  point_buy_min: number;
  point_buy_max: number;
  standard_array: number[];
  roll_formula: string;
  min_ability_score: number;
  max_ability_score: number;
}

// Campaign info for creation
export interface CampaignCreationInfo {
  id: number;
  name: string;
  starting_level: number;
  ability_method: "point_buy" | "standard_array" | "roll";
  allowed_races: string[] | null;
  allowed_classes: string[] | null;
}

// Setting info for creation
export interface SettingCreationInfo {
  id: number;
  name: string;
  slug: string;
}

// Rules info for creation
export interface RulesInfo {
  abilities: AbilityDefinition[];
  skills: SkillDefinition[];
  creation: CreationRules;
}

// Full character creation data response
export interface CharacterCreationData {
  campaign: CampaignCreationInfo;
  setting: SettingCreationInfo;
  rules: RulesInfo;
  races: Race[];
  subraces: { [parentSlug: string]: Race[] };
  classes: CharacterClass[];
}

// Abilities object (character stats)
export interface Abilities {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

// Character creation request
export interface CreateCharacterRequest {
  name: string;
  race_slug: string;
  class_slug: string;
  abilities: Abilities;
  skill_proficiencies?: string[];
  backstory?: string;
}

// Wizard step state
export interface WizardState {
  step: number;
  race: Race | null;
  subrace: Race | null;
  characterClass: CharacterClass | null;
  abilities: Abilities;
  abilityBonusChoices: { [ability: string]: number };
  skillProficiencies: string[];
  name: string;
  backstory: string;
}

// Point buy costs
export const POINT_BUY_COSTS: { [score: number]: number } = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

// Calculate ability modifier
export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

// Format modifier for display (+2, -1, etc.)
export function formatModifier(score: number): string {
  const mod = calculateModifier(score);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

// Calculate total points spent in point buy
export function calculatePointsSpent(abilities: Abilities): number {
  return Object.values(abilities).reduce((total, score) => {
    return total + (POINT_BUY_COSTS[score] ?? 0);
  }, 0);
}
