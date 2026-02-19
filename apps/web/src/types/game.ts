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
  has_active_live_session?: boolean;
  live_session?: LiveSession | null;
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

// Class resource (Ki, Rage, Balm dice, etc.)
export interface ClassResource {
  key?: string;
  name: string;
  source?: string;
  current: number;
  max: number;
  max_formula?: string;
  die?: string;  // e.g., "d6" for Balm of Summer Court
  use_max?: number;  // Max per use (e.g., half druid level for Balm)
  use_max_formula?: string;
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

// Concentration spell (active spell requiring concentration)
export interface ConcentrationSpell {
  spell_slug: string;
  spell_name: string;
  started_at: string;
  duration: string;
}

// Known spell entry (can be string slug or full object)
export interface KnownSpellEntry {
  slug: string;
  name: string;
  level: number;
  is_cantrip?: boolean;
  source?: string;
}

// Union type for known_spells array elements
export type KnownSpellItem = string | KnownSpellEntry;

// Spell components for display
export interface SpellComponents {
  verbal: boolean;
  somatic: boolean;
  material: boolean;
  material_description?: string;
  material_cost?: number;
  material_consumed?: boolean;
}

// Spell effects for display
export interface SpellEffects {
  damage?: {
    dice: string;
    type: string;
  };
  healing?: {
    dice: string;
  };
  save?: {
    ability: string;
    on_success?: string;
  };
  area?: {
    shape: string;
    radius?: string;
    size?: string;
    length?: string;
    width?: string;
    height?: string;
  };
}

// Spell preview for feat selection (cantrip/spell choice)
export interface SpellPreview {
  slug: string;
  name: string;
  level?: number;
  classes?: string[];
  school?: string;
  casting_time?: string;
  range?: string;
  duration?: string;
  components?: SpellComponents;
  effects?: SpellEffects | null;
  description?: string;
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

// Feat bonuses stored on character (from feats like Alert, Tough, etc.)
export interface FeatBonuses {
  initiative?: number; // Alert: +5
  ac?: number; // Dual Wielder: +1
  speed?: number; // Mobile: +3
  passive_perception?: number; // Observant: +5
  passive_investigation?: number; // Observant: +5
  hp_per_level?: number; // Tough: +2 per level
  luck_points?: number; // Lucky feat
  sorcery_points?: number; // Metamagic Adept
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
  known_spells: KnownSpellItem[];
  always_prepared_spells: string[];
  spell_slots_remaining: Record<string, number>;
  concentration_spell: ConcentrationSpell | null;
  class_levels: Record<string, number>;
  subclasses: Record<string, string>;
  asi_choices: AsiChoice[];
  feat_bonuses: FeatBonuses;
  player_notes: string;
  summoned_creatures: import("@/types/summon").SummonedCreature[];
  wild_shape_charges: number;
  wild_shape_form: WildShapeForm | null;
  created_at: string;
  updated_at: string;
}

// Wild Shape trait
export interface WildShapeTrait {
  name: string;
  description: string;
}

// Wild Shape action
export interface WildShapeAction {
  name: string;
  type?: string;
  description?: string;
  attack_bonus?: number;
  reach?: string;
  range?: string;
  damage?: string;
  damage_type?: string;
}

// Wild Shape form (when druid is transformed into a beast)
export interface WildShapeForm {
  beast_slug: string;
  beast_name: string;
  monster_id: number;
  max_hp: number;
  current_hp: number;
  temp_hp: number;
  armor_class: number;
  speed: Speed;
  abilities: Abilities;
  traits?: WildShapeTrait[];
  actions?: WildShapeAction[];
  senses?: Record<string, string | number>;
  skills?: Record<string, number>;
  transformed_at: string;
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

// Character owner (player who owns the character)
export interface CharacterOwner {
  id: number;
  name: string;
  email: string;
}

// Race info (for display)
export interface RaceInfo {
  slug: string;
  name: string;
}

// Class info (for display)
export interface ClassInfo {
  slug: string;
  name: string;
}

// Character with relations (for DM backoffice views)
export interface CharacterWithRelations extends Character {
  owner?: CharacterOwner;
  race?: RaceInfo;
  character_class?: ClassInfo;
}

// Campaign characters list response (for backoffice)
export interface CampaignCharactersResponse {
  characters: CharacterWithRelations[];
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

// ===========================================================================
// Live Session (Real-time Game Session)
// ===========================================================================

// Live session participant
export interface LiveSessionParticipant {
  user_id: number;
  character_id: number | null;
  joined_at: string;
}

// Live session (active game session)
export interface LiveSession {
  id: number;
  campaign_id: number;
  game_session_id: number | null;
  started_by: {
    id: number;
    name: string;
  };
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
  participants: LiveSessionParticipant[];
  duration_minutes: number | null;
}

// Live session status response
export interface LiveSessionStatusResponse {
  has_active_session: boolean;
  live_session: LiveSession | null;
}

// Live session started event payload
export interface LiveSessionStartedPayload {
  live_session: LiveSession;
  campaign_id: number;
  started_by: {
    id: number;
    name: string;
  };
}

// Live session ended event payload
export interface LiveSessionEndedPayload {
  live_session: LiveSession;
  campaign_id: number;
  duration_minutes: number | null;
}

// ===========================================================================
// Display (TV/Monitor Control)
// ===========================================================================

// Display status
export type DisplayStatus = "waiting" | "paired" | "disconnected";

// Display (for DM to manage)
export interface Display {
  id: number;
  name: string | null;
  status: DisplayStatus;
  is_alive: boolean;
  campaign: {
    id: number;
    name: string;
    slug: string;
  } | null;
  paired_at: string | null;
  last_heartbeat_at: string | null;
}

// Display registration response (for display client)
export interface DisplayRegistration {
  token: string;
  code: string;
  code_ttl: number;
  status: DisplayStatus;
}

// Display status response (for display client polling)
export interface DisplayStatusResponse {
  status: DisplayStatus;
  code: string | null;
  code_ttl: number | null;
  campaign: {
    id: number;
    name: string;
    slug: string;
  } | null;
}

// Display pair request
export interface DisplayPairRequest {
  code: string;
  campaign_id: number;
  name?: string;
}

// Display command types
export type DisplayCommandType = "scene" | "music" | "text" | "blackout" | "choice";

// Display command payload
export interface DisplayCommandPayload {
  scene_id?: number;
  soundtrack_id?: number;
  text?: string;
  choices?: Array<{
    label: string;
    target_scene_id?: number;
  }>;
}

// Display command request
export interface DisplayCommandRequest {
  command: DisplayCommandType;
  payload?: DisplayCommandPayload;
}

// ===========================================================================
// Level Up Types
// ===========================================================================

// Level up check response
export interface LevelUpCheckResponse {
  can_level_up: boolean;
  reason?: string;
  current_level: number;
  current_xp: number;
  next_level: number;
  xp_required: number;
  xp_remaining: number;
  max_level?: number;
}

// HP options for level up
export interface LevelUpHpOptions {
  method: "average" | "roll";
  hit_die: string;
  constitution_modifier: number;
  average_hp: number;
  max_roll: number;
  min_hp: number;
}

// Class option for multiclass
export interface LevelUpClassOption {
  current: boolean;
  meets_prerequisites: boolean;
  prerequisites?: Record<string, number | Record<string, number>>; // e.g. { "strength": 13, "or": {"dexterity": 13, "strength": 13} }
  name?: string; // Class name in Russian
}

// ASI ability option
export interface AsiAbilityOption {
  key: string;
  name: string;
  current: number;
  can_increase: boolean;
}

// ASI options
export interface LevelUpAsiOptions {
  points: number;
  max_per_ability: number;
  abilities: AsiAbilityOption[];
}

// Feat option for level up
export interface LevelUpFeatOption {
  slug: string;
  name: string;
  description: string;
  prerequisites?: Record<string, unknown>;
  benefits?: FeatBenefits;
  repeatable?: boolean;
  available: boolean;
  already_taken: boolean;
  meets_prerequisites: boolean;
  failed_prerequisites?: string[];
  // Available cantrips for feats that grant cantrip choice
  available_cantrips?: SpellPreview[];
  // Available spells for feats that grant spell choice
  available_spells?: SpellPreview[];
}

// Feat benefits structure
export interface FeatBenefits {
  ability_increase?: {
    ability?: string;
    options?: string[];
    amount: number;
    choice?: boolean;
  };
  ac_bonus?: number;
  initiative_bonus?: number;
  speed_bonus?: number;
  hp_per_level?: number;
  skill_proficiency?: number;
  skill_expertise?: number;
  saving_throw_proficiency?: { choice: boolean } | string;
  proficiency_choices?: number;
  cantrips?: number;
  cantrip?: { choice: boolean; attack_roll_required?: boolean };
  spells?: string[];
  spell?: { choice: boolean; level?: number; school?: string };
  spell_1st_level?: number;
  spell_choice?: { level: number; schools: string[] };
  languages?: number;
  luck_points?: number;
  sorcery_points?: number;
  passive_bonus?: number;
  features?: Array<{ name: string; description: string }>;
}

// Class feature from level up
export interface LevelUpFeature {
  name: string;
  description: string;
  short_description?: string;
  type?: "feature" | "choice" | "subclass" | "asi" | "resource";
  options?: string[];
  // Resource fields (for type === "resource")
  resource_key?: string;
  resource_name?: string;
  resource_die?: string;
  resource_max_formula?: string;
  resource_use_max_formula?: string;
  recharge?: "short_rest" | "long_rest";
}

// Subclass choice options (terrain, bonus cantrip, etc.)
export interface SubclassChoices {
  terrain?: {
    required: boolean;
    feature_name: string;
    options: Array<{ key: string; name: string; spells?: string[] }>;
  };
  bonus_cantrip?: {
    required: boolean;
    feature_name: string;
    from_class: string;
    count: number;
    available_cantrips?: Array<{ slug: string; name: string }>;
  };
}

// Subclass option
export interface SubclassOption {
  slug: string;
  name: string;
  description?: string;
  level_features?: Record<string, LevelUpFeature[]>;
  choices?: SubclassChoices;
  has_circle_spells?: boolean;
}

// Level up options response
export interface LevelUpOptionsResponse {
  new_level: number;
  proficiency_bonus: number;
  hp_options: LevelUpHpOptions;
  class_options: {
    multiclass_enabled: boolean;
    available_classes: Record<string, LevelUpClassOption>;
  };
  asi_available: boolean;
  asi_options?: {
    asi: LevelUpAsiOptions;
    feats_enabled: boolean;
    feats?: LevelUpFeatOption[];
  };
  features: LevelUpFeature[];
  // Subclass selection (e.g., Rogue archetype at level 3)
  subclass_required?: boolean;
  subclass_name?: string; // e.g., "Архетип плута"
  subclass_options?: SubclassOption[];
}

// Feat choices for feats that require additional decisions
export interface FeatChoicesPayload {
  feat: string;
  ability_increase?: string; // chosen ability for +1
  saving_throw_proficiency?: string; // for Resilient
  skill_proficiencies?: string[]; // for Skill Expert, Skilled
  skill_expertise?: string[]; // for Skill Expert
  languages?: string[]; // for Linguist
  cantrip?: string; // for Magic Initiate
  spell?: string; // for Magic Initiate, Ritual Caster
}

// Level up choices (request body)
export interface LevelUpChoices {
  class?: string;
  hp_roll?: number;
  asi?: {
    type: "asi" | "feat";
    choices?: Record<string, number> | FeatChoicesPayload;
  };
  subclass?: string;
  subclass_terrain?: string;
  subclass_bonus_cantrip?: string;
  features?: LevelUpFeature[];
}
