// ===========================================================================
// Spell Types for Player Spellbook
// ===========================================================================

// Spell slot with remaining count
export interface SpellSlot {
  max: number;
  remaining: number;
}

// Spell effects (damage, saves, area)
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

// Upcasting scaling information
export interface SpellScaling {
  type: "damage" | "healing" | "targets" | "duration" | "dice";
  dice_per_level?: string;  // e.g., "1d6" - added per level above base
  base_level: number;       // spell's base level (for scaling calculation)
  description?: string;     // description of what scales
}

// Higher levels upcasting info
export interface HigherLevels {
  description?: string;
  scaling?: SpellScaling;
}

// Full spell data (from API)
export interface Spell {
  slug: string;
  name: string;
  level: number;
  school: string;
  casting_time: string;
  range: string;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  components: SpellComponents;
  description: string;
  higher_levels?: HigherLevels | null;
  classes: string[];
  effects?: SpellEffects | null;
}

// Spell components
export interface SpellComponents {
  verbal: boolean;
  somatic: boolean;
  material: boolean;
  material_description?: string;
  material_cost?: number;
  material_consumed?: boolean;
}

// Spellbook data from API
export interface Spellbook {
  is_spellcaster: boolean;
  cantrips: Spell[];
  known_spells: Spell[];
  prepared_spells: Spell[];
  circle_spells: Spell[];      // Circle of the Land spells (always prepared)
  circle_terrain: string | null;  // Terrain name for Circle of the Land
  spell_slots: Record<string, SpellSlot>;
  concentration_spell: ConcentrationSpell | null;
  spellcasting_ability: string | null;
  spell_save_dc: number;
  spell_attack_bonus: number;
  max_prepared: number;
  is_prepared_caster: boolean;
}

// Active concentration spell
export interface ConcentrationSpell {
  spell_slug: string;
  spell_name: string;
  started_at: string;
  duration: string;
}

// API Response types
export interface SpellbookResponse {
  success: boolean;
  data: Spellbook;
  message?: string;
}

export interface AvailableSpellsResponse {
  success: boolean;
  data: Spell[];
  message?: string;
}

export interface SpellSlotResponse {
  success: boolean;
  data: {
    spell_slots_remaining: Record<string, number>;
  };
  message?: string;
}

export interface RestResponse {
  success: boolean;
  data: {
    spell_slots_remaining: Record<string, number>;
    concentration_spell: ConcentrationSpell | null;
  };
  message?: string;
}

export interface PreparedSpellsResponse {
  success: boolean;
  data: {
    prepared_spells: string[];
  };
  message?: string;
}

export interface ConcentrationResponse {
  success: boolean;
  data: {
    concentration_spell: ConcentrationSpell | null;
  };
  message?: string;
}

// Request types
export interface UseSlotRequest {
  level: number;
}

export interface RestoreSlotRequest {
  level: number;
  count?: number;
}

export interface RestRequest {
  type: "short" | "long";
}

export interface UpdatePreparedRequest {
  prepared_spells: string[];
}

export interface StartConcentrationRequest {
  spell_slug: string;
}

// Recovery option for short rest (Natural Recovery, Arcane Recovery, etc.)
export interface RecoveryOption {
  key: string;
  name: string;
  description: string;
  max_slot_levels: number;  // Max combined slot levels that can be restored
  is_used: boolean;         // Already used today
  available: boolean;       // Can be used (not used and has budget)
}

// ===========================================================================
// Upcasting Utilities
// ===========================================================================

/**
 * Parse dice string into components
 * e.g., "8d6" => { count: 8, die: 6 }
 */
export function parseDice(dice: string): { count: number; die: number } | null {
  const match = dice.match(/^(\d+)d(\d+)$/);
  if (!match) return null;
  return { count: parseInt(match[1], 10), die: parseInt(match[2], 10) };
}

/**
 * Calculate upcast damage dice
 * @param baseDice - Base damage dice (e.g., "8d6")
 * @param spellLevel - Spell's base level
 * @param slotLevel - Level of slot used for casting
 * @param scaling - Scaling info from spell data
 * @returns Upcast damage dice string (e.g., "10d6")
 */
export function calculateUpcastDamage(
  baseDice: string,
  spellLevel: number,
  slotLevel: number,
  scaling?: SpellScaling | null
): string {
  if (!scaling || slotLevel <= spellLevel) return baseDice;

  const base = parseDice(baseDice);
  const extra = scaling.dice_per_level ? parseDice(scaling.dice_per_level) : null;

  if (!base) return baseDice;

  const levelDiff = slotLevel - spellLevel;

  if (extra && extra.die === base.die) {
    // Same die type - add to count (e.g., 8d6 + 2*1d6 = 10d6)
    return `${base.count + extra.count * levelDiff}d${base.die}`;
  } else if (extra) {
    // Different die type - show separately (e.g., 2d8 + 2d6)
    return `${baseDice} + ${extra.count * levelDiff}d${extra.die}`;
  }

  return baseDice;
}

/**
 * Get available slot levels for a spell
 * @param spellLevel - Spell's base level
 * @param availableSlots - Available spell slots with remaining counts
 * @returns Array of slot levels that can cast this spell
 */
export function getAvailableSlotLevels(
  spellLevel: number,
  availableSlots: Record<string, SpellSlot>
): number[] {
  return Object.entries(availableSlots)
    .filter(([level, slot]) => {
      const lvl = parseInt(level, 10);
      return lvl >= spellLevel && slot.remaining > 0;
    })
    .map(([level]) => parseInt(level, 10))
    .sort((a, b) => a - b);
}
