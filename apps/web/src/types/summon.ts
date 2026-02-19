// Monster stats from bestiary
export interface Monster {
  id: number;
  name: string;
  description?: string;
  slug: string;
  size: string;
  type: string;
  alignment?: string;
  armor_class: number;
  armor_type?: string;
  hit_points: number;
  hit_dice?: string;
  challenge_rating: number;
  challenge_rating_string: string;
  experience_points?: number;
  abilities: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  speed: {
    walk?: number;
    fly?: number;
    swim?: number;
    burrow?: number;
    climb?: number;
  };
  saving_throws?: Record<string, number>;
  skills?: Record<string, number>;
  senses?: Record<string, string | number>;
  languages?: string[];
  damage_resistances?: string[];
  damage_immunities?: string[];
  damage_vulnerabilities?: string[];
  condition_immunities?: string[];
  traits?: MonsterTrait[];
  actions?: MonsterAction[];
  legendary_actions?: MonsterAction[];
  is_common: boolean;
  has_swim: boolean;
  has_fly: boolean;
}

export interface MonsterTrait {
  name: string;
  description: string;
}

export interface MonsterAction {
  name: string;
  type?: string;
  description?: string;
  attack_bonus?: number;
  reach?: string;
  range?: string;
  damage?: string;
  damage_type?: string;
}

// Types of summoned creatures
export type SummonType = "familiar" | "spirit" | "beast" | "conjured" | "animated" | "other";

// A summoned creature instance
export interface SummonedCreature {
  id: string;
  name: string;
  type: SummonType;
  monster_id?: number;
  monster?: Monster;
  max_hp: number;
  current_hp: number;
  temp_hp: number;
  conditions: string[];
  custom_stats?: Record<string, unknown>;
  source_spell?: string;
  duration?: string;
  summoned_at: string;
}

// Request to summon a creature
export interface SummonCreatureRequest {
  name: string;
  type: SummonType;
  monster_id?: number;
  max_hp?: number;
  current_hp?: number;
  temp_hp?: number;
  custom_stats?: Record<string, unknown>;
  source_spell?: string;
  duration?: string;
}

// Request to update a summoned creature
export interface UpdateSummonRequest {
  current_hp?: number;
  temp_hp?: number;
  conditions?: string[];
  custom_stats?: Record<string, unknown>;
}
