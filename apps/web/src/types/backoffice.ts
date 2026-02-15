// Backoffice API types

// Setting for selection
export interface SettingOption {
  id: number;
  name: string;
  slug: string;
}

// Settings list response
export interface SettingsListResponse {
  settings: SettingOption[];
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

// Character Class (Backoffice)
export interface CharacterClassBackoffice {
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
  starting_equipment: unknown[];
  starting_gold_formula: string | null;
  level_features: { [level: string]: ClassFeature[] };
  progression: { [level: string]: Record<string, unknown> };
  is_spellcaster: boolean;
  spellcasting_ability: string | null;
  spell_slots: { [level: string]: { [slotLevel: string]: number } } | null;
  spells_known: { [level: string]: number } | null;
  subclass_level: string | null;
  subclass_name: string | null;
  is_system: boolean;
  sort_order: number;
}

// Classes list response
export interface ClassesResponse {
  classes: CharacterClassBackoffice[];
}

// Class detail response (with settings)
export interface ClassDetailResponse {
  class: CharacterClassBackoffice;
  settings: SettingOption[];
}

// Single class response
export interface ClassResponse {
  class: CharacterClassBackoffice;
}

// Create class request
export interface CreateClassRequest {
  name: string;
  description?: string;
  slug?: string;
  hit_die: string;
  primary_abilities: string[];
  saving_throws: string[];
  armor_proficiencies?: string[];
  weapon_proficiencies?: string[];
  tool_proficiencies?: string[];
  skill_choices: number;
  skill_options: string[];
  starting_equipment?: unknown[];
  starting_gold_formula?: string;
  level_features?: { [level: string]: ClassFeature[] };
  progression?: { [level: string]: Record<string, unknown> };
  is_spellcaster?: boolean;
  spellcasting_ability?: string;
  spell_slots?: { [level: string]: { [slotLevel: string]: number } };
  spells_known?: { [level: string]: number };
  subclass_level?: number;
  subclass_name?: string;
  sort_order?: number;
  setting_ids?: number[];
}

// Update class request (same as create, all optional)
export interface UpdateClassRequest {
  name?: string;
  description?: string;
  slug?: string;
  hit_die?: string;
  primary_abilities?: string[];
  saving_throws?: string[];
  armor_proficiencies?: string[];
  weapon_proficiencies?: string[];
  tool_proficiencies?: string[];
  skill_choices?: number;
  skill_options?: string[];
  starting_equipment?: unknown[];
  starting_gold_formula?: string;
  level_features?: { [level: string]: ClassFeature[] };
  progression?: { [level: string]: Record<string, unknown> };
  is_spellcaster?: boolean;
  spellcasting_ability?: string;
  spell_slots?: { [level: string]: { [slotLevel: string]: number } };
  spells_known?: { [level: string]: number };
  subclass_level?: number;
  subclass_name?: string;
  sort_order?: number;
  setting_ids?: number[];
}

// ===========================================================================
// Races
// ===========================================================================

// Race trait
export interface RaceTrait {
  key: string;
  name: string;
  description: string;
}

// Race ability bonuses
export interface RaceAbilityBonuses {
  strength?: number;
  dexterity?: number;
  constitution?: number;
  intelligence?: number;
  wisdom?: number;
  charisma?: number;
  choice?: {
    count: number;
    amount: number;
  };
}

// Race speed
export interface RaceSpeed {
  walk: number;
  fly?: number;
  swim?: number;
  climb?: number;
  burrow?: number;
}

// Race proficiencies
export interface RaceProficiencies {
  weapons?: string[];
  armor?: string[];
  tools?: string[];
}

// Race age info
export interface RaceAgeInfo {
  maturity?: number;
  lifespan?: number;
}

// Race size info
export interface RaceSizeInfo {
  height_range?: string;
  weight_range?: string;
}

// Parent race option
export interface ParentRaceOption {
  id: number;
  name: string;
  slug: string;
}

// Race (Backoffice)
export interface RaceBackoffice {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  size: "tiny" | "small" | "medium" | "large" | "huge" | "gargantuan";
  ability_bonuses: RaceAbilityBonuses;
  speed: RaceSpeed;
  traits: RaceTrait[];
  languages: string[];
  proficiencies: RaceProficiencies;
  skill_proficiencies: string[];
  parent_slug: string | null;
  is_subrace: boolean;
  age_info: RaceAgeInfo | null;
  size_info: RaceSizeInfo | null;
  is_system: boolean;
  sort_order: number;
}

// Races list response
export interface RacesResponse {
  races: RaceBackoffice[];
}

// Race detail response (with settings and subraces)
export interface RaceDetailResponse {
  race: RaceBackoffice;
  settings: SettingOption[];
  subraces: RaceBackoffice[];
}

// Single race response
export interface RaceResponse {
  race: RaceBackoffice;
}

// Parent races response
export interface ParentRacesResponse {
  parents: ParentRaceOption[];
}

// Create race request
export interface CreateRaceRequest {
  name: string;
  description?: string;
  slug?: string;
  size: "tiny" | "small" | "medium" | "large" | "huge" | "gargantuan";
  ability_bonuses: RaceAbilityBonuses;
  speed: RaceSpeed;
  traits?: RaceTrait[];
  languages?: string[];
  proficiencies?: RaceProficiencies;
  skill_proficiencies?: string[];
  parent_slug?: string;
  age_info?: RaceAgeInfo;
  size_info?: RaceSizeInfo;
  sort_order?: number;
  setting_ids?: number[];
}

// Update race request (all optional)
export interface UpdateRaceRequest {
  name?: string;
  description?: string;
  slug?: string;
  size?: "tiny" | "small" | "medium" | "large" | "huge" | "gargantuan";
  ability_bonuses?: RaceAbilityBonuses;
  speed?: RaceSpeed;
  traits?: RaceTrait[];
  languages?: string[];
  proficiencies?: RaceProficiencies;
  skill_proficiencies?: string[];
  parent_slug?: string;
  age_info?: RaceAgeInfo;
  size_info?: RaceSizeInfo;
  sort_order?: number;
  setting_ids?: number[];
}

// ===========================================================================
// Monsters
// ===========================================================================

// Monster size type
export type MonsterSize = "tiny" | "small" | "medium" | "large" | "huge" | "gargantuan";

// Monster abilities
export interface MonsterAbilities {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

// Monster speed
export interface MonsterSpeed {
  walk: number;
  fly?: number;
  swim?: number;
  climb?: number;
  burrow?: number;
}

// Monster trait/feature
export interface MonsterTrait {
  name: string;
  description: string;
}

// Monster action
export interface MonsterAction {
  name: string;
  description: string;
  type?: "melee" | "ranged" | "special";
  attack_bonus?: number;
  damage?: string;
  reach?: string;
  range?: string;
  recharge?: string;
}

// Legendary action
export interface LegendaryAction {
  name: string;
  cost: number;
  description: string;
}

// Legendary actions container
export interface LegendaryActions {
  per_round: number;
  actions: LegendaryAction[];
}

// Monster senses
export interface MonsterSenses {
  darkvision?: string;
  blindsight?: string;
  tremorsense?: string;
  truesight?: string;
  passive_perception?: number;
}

// Monster (Backoffice)
export interface MonsterBackoffice {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  size: MonsterSize;
  type: string;
  alignment: string | null;
  armor_class: number;
  armor_type: string | null;
  hit_points: number;
  hit_dice: string | null;
  challenge_rating: number | null;
  challenge_rating_string: string;
  experience_points: number | null;
  abilities: MonsterAbilities;
  speed: MonsterSpeed;
  saving_throws: Record<string, number>;
  skills: Record<string, number>;
  senses: MonsterSenses;
  languages: string[];
  damage_resistances: string[];
  damage_immunities: string[];
  damage_vulnerabilities: string[];
  condition_immunities: string[];
  traits: MonsterTrait[];
  actions: MonsterAction[];
  legendary_actions: LegendaryActions | null;
  lair_actions: unknown[] | null;
  regional_effects: unknown[] | null;
  has_legendary_actions: boolean;
  has_lair_actions: boolean;
  is_system: boolean;
  sort_order: number;
}

// Monsters list response
export interface MonstersResponse {
  monsters: MonsterBackoffice[];
}

// Monster detail response (with settings)
export interface MonsterDetailResponse {
  monster: MonsterBackoffice;
  settings: SettingOption[];
}

// Single monster response
export interface MonsterResponse {
  monster: MonsterBackoffice;
}

// Monster types response
export interface MonsterTypesResponse {
  types: string[];
}

// Create monster request
export interface CreateMonsterRequest {
  name: string;
  description?: string;
  slug?: string;
  size: MonsterSize;
  type: string;
  alignment?: string;
  armor_class: number;
  armor_type?: string;
  hit_points: number;
  hit_dice?: string;
  challenge_rating?: number;
  experience_points?: number;
  abilities: MonsterAbilities;
  speed: MonsterSpeed;
  saving_throws?: Record<string, number>;
  skills?: Record<string, number>;
  senses?: MonsterSenses;
  languages?: string[];
  damage_resistances?: string[];
  damage_immunities?: string[];
  damage_vulnerabilities?: string[];
  condition_immunities?: string[];
  traits?: MonsterTrait[];
  actions?: MonsterAction[];
  legendary_actions?: LegendaryActions;
  lair_actions?: unknown[];
  regional_effects?: unknown[];
  sort_order?: number;
  setting_ids?: number[];
}

// Update monster request (all optional)
export interface UpdateMonsterRequest {
  name?: string;
  description?: string;
  slug?: string;
  size?: MonsterSize;
  type?: string;
  alignment?: string;
  armor_class?: number;
  armor_type?: string;
  hit_points?: number;
  hit_dice?: string;
  challenge_rating?: number;
  experience_points?: number;
  abilities?: MonsterAbilities;
  speed?: MonsterSpeed;
  saving_throws?: Record<string, number>;
  skills?: Record<string, number>;
  senses?: MonsterSenses;
  languages?: string[];
  damage_resistances?: string[];
  damage_immunities?: string[];
  damage_vulnerabilities?: string[];
  condition_immunities?: string[];
  traits?: MonsterTrait[];
  actions?: MonsterAction[];
  legendary_actions?: LegendaryActions;
  lair_actions?: unknown[];
  regional_effects?: unknown[];
  sort_order?: number;
  setting_ids?: number[];
}

// =============================================================================
// SPELLS
// =============================================================================

// Spell school type
export type SpellSchool =
  | "abjuration"
  | "conjuration"
  | "divination"
  | "enchantment"
  | "evocation"
  | "illusion"
  | "necromancy"
  | "transmutation";

// Spell components
export interface SpellComponents {
  verbal: boolean;
  somatic: boolean;
  material: boolean;
  material_description?: string;
  material_cost?: string;
}

// Higher levels description
export interface SpellHigherLevels {
  description?: string;
}

// Cantrip scaling by character level
export interface CantripScaling {
  [level: string]: string; // "5": "2d10", "11": "3d10"
}

// Spell effects for automation
export interface SpellEffects {
  damage?: {
    dice: string;
    type: string;
  };
  save?: {
    ability: string;
    on_success?: string;
  };
  area?: {
    shape: string;
    radius?: string;
  };
}

// Spell model
export interface SpellBackoffice {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  level: number;
  level_string: string;
  school: SpellSchool;
  casting_time: string;
  range: string;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  components: SpellComponents;
  components_string: string;
  classes: string[];
  higher_levels: SpellHigherLevels | null;
  cantrip_scaling: CantripScaling | null;
  effects: SpellEffects | null;
  is_cantrip: boolean;
  is_system: boolean;
  sort_order: number;
}

// Spells list response
export interface SpellsResponse {
  spells: SpellBackoffice[];
}

// Spell detail response (with settings)
export interface SpellDetailResponse {
  spell: SpellBackoffice;
  settings: SettingOption[];
}

// Single spell response
export interface SpellResponse {
  spell: SpellBackoffice;
}

// Spell schools response
export interface SpellSchoolsResponse {
  schools: string[];
}

// Spell classes response
export interface SpellClassesResponse {
  classes: string[];
}

// Create spell request
export interface CreateSpellRequest {
  name: string;
  description: string;
  slug?: string;
  level: number;
  school: SpellSchool;
  casting_time: string;
  range: string;
  duration: string;
  concentration?: boolean;
  ritual?: boolean;
  components: SpellComponents;
  classes: string[];
  higher_levels?: SpellHigherLevels;
  cantrip_scaling?: CantripScaling;
  effects?: SpellEffects;
  sort_order?: number;
  setting_ids?: number[];
}

// Update spell request
export interface UpdateSpellRequest {
  name?: string;
  description?: string;
  slug?: string;
  level?: number;
  school?: SpellSchool;
  casting_time?: string;
  range?: string;
  duration?: string;
  concentration?: boolean;
  ritual?: boolean;
  components?: SpellComponents;
  classes?: string[];
  higher_levels?: SpellHigherLevels;
  cantrip_scaling?: CantripScaling;
  effects?: SpellEffects;
  sort_order?: number;
  setting_ids?: number[];
}
