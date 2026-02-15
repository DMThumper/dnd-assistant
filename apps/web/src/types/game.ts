// Setting
export interface Setting {
  id: number;
  name: string;
  slug: string;
}

// Campaign Owner (DM)
export interface CampaignOwner {
  id: number;
  name: string;
}

// Campaign
export interface Campaign {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  status: "active" | "paused" | "completed";
  settings: CampaignSettings;
  setting: Setting | null;
  owner: CampaignOwner;
  players_count: number;
  characters_count: number;
  created_at: string;
  updated_at: string;
}

// Campaign with player-specific data
export interface PlayerCampaign extends Campaign {
  my_characters: Character[];
  my_alive_characters_count: number;
}

// Campaign settings
export interface CampaignSettings {
  allowed_races?: string[] | null;
  allowed_classes?: string[] | null;
  starting_level?: number;
  ability_method?: "point_buy" | "standard_array" | "roll";
  hp_method?: "average" | "roll";
  encumbrance?: boolean;
  multiclassing?: boolean;
  feats?: boolean;
  description?: string;
  tone?: string;
}

// Character abilities (stats)
export interface Abilities {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

// Character speed
export interface Speed {
  walk: number;
  fly?: number;
  swim?: number;
  climb?: number;
  burrow?: number;
}

// Death saves
export interface DeathSaves {
  successes: number;
  failures: number;
}

// Proficiencies
export interface Proficiencies {
  armor: string[];
  weapons: string[];
  tools: string[];
  languages: string[];
}

// Currency
export interface Currency {
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;
}

// Class resource (Ki, Rage, etc.)
export interface ClassResource {
  name: string;
  current: number;
  max: number;
  recharge: "short_rest" | "long_rest";
}

// Feature (racial, class, feat)
export interface Feature {
  source: "race" | "class" | "feat" | "item" | "other";
  name: string;
  description: string;
}

// Death info (for graveyard)
export interface DeathInfo {
  killed_by: string;
  killing_blow: string;
  cause: "combat" | "trap" | "fall" | "spell" | "other";
  session_number: number;
  death_date: string;
  last_words?: string;
  revived: boolean;
}

// Character stats (cumulative)
export interface CharacterStats {
  sessions_played?: number;
  monsters_killed?: number;
  damage_dealt?: number;
  damage_taken?: number;
  critical_hits?: number;
  natural_ones?: number;
  potions_used?: number;
  gold_earned?: number;
  gold_spent?: number;
}

// D&D Condition (standard conditions like poisoned, stunned)
export interface Condition {
  key: string;
  name?: string;
  source?: string;
  duration?: number;
  applied_at?: string;
}

// Custom Rule Effect (bonus or penalty)
export interface CustomRuleEffect {
  type: "bonus" | "penalty";
  category: "skill" | "ability" | "saving_throw" | "attack" | "damage" | "ac" | "hp" | "speed" | "custom";
  target?: string;
  value?: number;
  description?: string;
  condition?: string;
}

// Custom Rule (perks, afflictions, curses, blessings)
export interface CustomRule {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  effects: CustomRuleEffect[];
  permanent: boolean;
  duration?: string;
  source?: string;
  applied_at?: string;
  notes?: string;
}

// Inventory Item
export interface InventoryItem {
  item_slug?: string;
  name?: string;
  custom?: boolean;
  quantity: number;
  notes?: string;
}

// Equipment slots
export interface Equipment {
  armor?: string | null;
  main_hand?: string | null;
  off_hand?: string | null;
  ring_1?: string | null;
  ring_2?: string | null;
  amulet?: string | null;
  cloak?: string | null;
  boots?: string | null;
  gloves?: string | null;
  belt?: string | null;
  helm?: string | null;
}

// ASI/Feat choice at level up
export interface AsiChoice {
  level: number;
  type: "asi" | "feat";
  choices?: Record<string, number>; // For ASI: {"strength": 2}
  feat?: string; // For feat: slug
}

// Character
export interface Character {
  id: number;
  name: string;
  backstory: string | null;
  race_slug: string | null;
  class_slug: string | null;
  level: number;
  experience_points: number;
  abilities: Abilities;
  current_hp: number;
  max_hp: number;
  temp_hp: number;
  armor_class: number;
  speed: Speed;
  inspiration: boolean;
  proficiency_bonus: number;
  skill_proficiencies: string[];
  skill_expertise: string[];
  saving_throw_proficiencies: string[];
  proficiencies: Proficiencies;
  death_saves: DeathSaves;
  hit_dice_remaining: Record<string, number>;
  features: Feature[];
  class_resources: ClassResource[];
  currency: Currency;
  is_alive: boolean;
  is_active: boolean;
  death_info: DeathInfo | null;
  stats: CharacterStats;
  can_be_deleted: boolean;
  campaign_id: number;
  // Game state fields for real-time sync
  conditions: Condition[];
  custom_rules: CustomRule[];
  inventory: InventoryItem[];
  equipment: Equipment;
  prepared_spells: string[];
  known_spells: string[];
  spell_slots_remaining: Record<string, number>;
  class_levels: Record<string, number>;
  subclasses: Record<string, string>;
  asi_choices: AsiChoice[];
  created_at: string;
  updated_at: string;
}

// API Response types
export interface CampaignsResponse {
  campaigns: PlayerCampaign[];
}

export interface CampaignResponse {
  campaign: PlayerCampaign;
}

export interface CharactersResponse {
  alive: Character[];
  dead: Character[];
}

export interface CharacterResponse {
  character: Character;
}

export interface ActiveCharacterResponse {
  character: Character | null;
  auto_selected?: boolean;
  needs_creation?: boolean;
  needs_selection?: boolean;
  available?: Character[];
}

// Campaign Player (for backoffice)
export interface CampaignPlayer {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  joined_at: string;
  characters_count: number;
}

// ===========================================================================
// Campaign Control Types (for DM character management)
// ===========================================================================

// HP modification types
export type HpModificationType = "damage" | "healing" | "temp_hp" | "set";

// HP modification request
export interface HpModificationRequest {
  amount: number;
  type: HpModificationType;
  source?: string;
}

// Condition modification request
export interface ConditionModificationRequest {
  action: "add" | "remove";
  condition: Condition;
}

// Custom rule modification request
export interface CustomRuleRequest {
  action: "add" | "update" | "remove";
  rule: CustomRule;
}

// XP award request
export interface XpAwardRequest {
  character_ids: number[] | "all_active";
  amount: number;
  reason?: string;
}

// XP award result
export interface XpAwardResult {
  awarded_to: number;
  amount: number;
  reason?: string;
  characters: Array<{
    id: number;
    name: string;
    previous_xp: number;
    new_xp: number;
    leveled_up: boolean;
    new_level?: number;
  }>;
}

// Give item request
export interface GiveItemRequest {
  item: InventoryItem;
  quantity?: number;
  source?: string;
}

// Currency modification request
export interface CurrencyModificationRequest {
  type: keyof Currency;
  amount: number;
}

// Kill character request
export interface KillCharacterRequest {
  killed_by: string;
  killing_blow?: string;
  cause?: "combat" | "trap" | "fall" | "spell" | "other";
  last_words?: string;
}

// Campaign characters list response (for backoffice)
export interface CampaignCharactersResponse {
  characters: Character[];
  campaign: {
    id: number;
    name: string;
    slug: string;
  };
}

// ===========================================================================
// Acts and Sessions (Campaign Structure)
// ===========================================================================

// Act status
export type ActStatus = "planned" | "active" | "completed";

// Act (story arc within a campaign)
export interface Act {
  id: number;
  campaign_id: number;
  number: number;
  name: string;
  description: string | null;
  intro: string | null;
  epilogue: string | null;
  status: ActStatus;
  sort_order: number;
  formatted_title: string;
  sessions_count: number;
  completed_sessions_count: number;
  is_active: boolean;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

// Game Session status
export type GameSessionStatus = "planned" | "active" | "completed";

// Game Session (a single play session within an act)
export interface GameSession {
  id: number;
  act_id: number;
  number: number;
  global_number: number;
  name: string;
  summary: string | null;
  status: GameSessionStatus;
  played_at: string | null;
  sort_order: number;
  formatted_title: string;
  is_planned: boolean;
  is_active: boolean;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

// Create/Update Act request
export interface ActRequest {
  name: string;
  description?: string | null;
  intro?: string | null;
  epilogue?: string | null;
  status?: ActStatus;
}

// Create/Update Session request
export interface GameSessionRequest {
  name: string;
  summary?: string | null;
  status?: GameSessionStatus;
  played_at?: string | null;
}

// Reorder request
export interface ReorderRequest {
  act_ids?: number[];
  session_ids?: number[];
}

// Move session request
export interface MoveSessionRequest {
  target_act_id: number;
}
