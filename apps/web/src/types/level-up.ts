/**
 * Level-up related types
 */

import type { Character, SpellPreview } from "./game";

// Step type for level-up wizard
export type LevelUpStep =
  | "hp"
  | "class"
  | "subclass"
  | "subclass_choices"
  | "asi"
  | "feat_choices"
  | "features"
  | "confirm";

// Feat choices structure
export interface FeatChoicesState {
  ability?: string; // chosen ability for +1
  saving_throw?: string; // chosen saving throw proficiency
  skill_proficiencies?: string[]; // chosen skill proficiencies
  skill_expertise?: string[]; // chosen skill expertise
  languages?: string[]; // chosen languages
  cantrip?: string; // chosen cantrip slug
  spell?: string; // chosen spell slug
}

// Subclass choices structure
export interface SubclassChoicesState {
  terrain?: string;
  bonus_cantrip?: string;
}

// Feat data with benefits
export interface FeatData {
  slug: string;
  name: string;
  description: string;
  benefits?: {
    ability_increase?: { amount: number; choice?: boolean; options?: string[] };
    saving_throw_proficiency?: { choice: boolean } | string;
    skill_proficiency?: number;
    skill_expertise?: number;
    languages?: number;
    cantrip?: { choice: boolean; attack_roll_required?: boolean };
    spell?: { choice: boolean; level?: number; school?: string };
    spells?: string[];
  };
  available_cantrips?: SpellPreview[];
  available_spells?: SpellPreview[];
}

// Subclass data with choices
export interface SubclassData {
  slug: string;
  name: string;
  description?: string;
  choices?: {
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
  };
}

// Ability option for selection UI
export interface AbilityOption {
  key: string;
  name: string;
}

// Skill option for selection UI
export interface SkillOption {
  key: string;
  name: string;
  ability: string;
}

// Constants for abilities and skills
export const ALL_ABILITIES: AbilityOption[] = [
  { key: "strength", name: "Сила" },
  { key: "dexterity", name: "Ловкость" },
  { key: "constitution", name: "Телосложение" },
  { key: "intelligence", name: "Интеллект" },
  { key: "wisdom", name: "Мудрость" },
  { key: "charisma", name: "Харизма" },
];

export const ALL_SKILLS: SkillOption[] = [
  { key: "acrobatics", name: "Акробатика", ability: "dexterity" },
  { key: "animal_handling", name: "Уход за животными", ability: "wisdom" },
  { key: "arcana", name: "Магия", ability: "intelligence" },
  { key: "athletics", name: "Атлетика", ability: "strength" },
  { key: "deception", name: "Обман", ability: "charisma" },
  { key: "history", name: "История", ability: "intelligence" },
  { key: "insight", name: "Проницательность", ability: "wisdom" },
  { key: "intimidation", name: "Запугивание", ability: "charisma" },
  { key: "investigation", name: "Расследование", ability: "intelligence" },
  { key: "medicine", name: "Медицина", ability: "wisdom" },
  { key: "nature", name: "Природа", ability: "intelligence" },
  { key: "perception", name: "Внимательность", ability: "wisdom" },
  { key: "performance", name: "Выступление", ability: "charisma" },
  { key: "persuasion", name: "Убеждение", ability: "charisma" },
  { key: "religion", name: "Религия", ability: "intelligence" },
  { key: "sleight_of_hand", name: "Ловкость рук", ability: "dexterity" },
  { key: "stealth", name: "Скрытность", ability: "dexterity" },
  { key: "survival", name: "Выживание", ability: "wisdom" },
];

// Default druid cantrips (fallback if not provided by API)
export const DRUID_CANTRIPS = [
  { slug: "druidcraft", name: "Искусство друидов" },
  { slug: "guidance", name: "Указание" },
  { slug: "mending", name: "Починка" },
  { slug: "poison-spray", name: "Ядовитые брызги" },
  { slug: "produce-flame", name: "Сотворение пламени" },
  { slug: "resistance", name: "Сопротивление" },
  { slug: "shillelagh", name: "Дубинка" },
  { slug: "thorn-whip", name: "Терновый кнут" },
  { slug: "primal-savagery", name: "Дикость природы" },
  { slug: "magic-stone", name: "Волшебный камень" },
  { slug: "mold-earth", name: "Придание формы земле" },
  { slug: "gust", name: "Порыв ветра" },
  { slug: "control-flames", name: "Управление пламенем" },
  { slug: "shape-water", name: "Придание формы воде" },
  { slug: "infestation", name: "Заражение" },
  { slug: "frostbite", name: "Обморожение" },
  { slug: "thunderclap", name: "Громовой удар" },
];
