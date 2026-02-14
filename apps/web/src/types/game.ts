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
  death_info: DeathInfo | null;
  stats: CharacterStats;
  can_be_deleted: boolean;
  campaign_id: number;
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
