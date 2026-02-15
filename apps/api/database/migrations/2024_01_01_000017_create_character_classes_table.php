<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('character_classes', function (Blueprint $table) {
            $table->id();
            $table->jsonb('name');                          // {"ru": "Воин"}
            $table->jsonb('description')->nullable();       // {"ru": "Мастера боя..."}
            $table->string('slug', 50)->unique();           // "fighter"

            // Hit die: d6, d8, d10, d12
            $table->string('hit_die', 5);                   // "d10"

            // Primary abilities for multiclassing requirements
            $table->jsonb('primary_abilities')->default('[]');  // ["strength"] or ["dexterity", "wisdom"]

            // Saving throw proficiencies
            $table->jsonb('saving_throws')->default('[]');  // ["strength", "constitution"]

            // Armor proficiencies
            $table->jsonb('armor_proficiencies')->default('[]');
            // ["light", "medium", "heavy", "shields"]

            // Weapon proficiencies
            $table->jsonb('weapon_proficiencies')->default('[]');
            // ["simple", "martial"] or specific weapons ["longsword", "shortbow"]

            // Tool proficiencies
            $table->jsonb('tool_proficiencies')->default('[]');
            // [] or ["thieves_tools", "one_artisan"]

            // Number of skills to choose
            $table->integer('skill_choices')->default(2);

            // Available skills to choose from
            $table->jsonb('skill_options')->default('[]');
            // ["acrobatics", "athletics", "intimidation", "perception"]

            // Starting equipment options
            $table->jsonb('starting_equipment')->default('[]');
            // [
            //   {"choice": 1, "options": [
            //     [{"item": "chain-mail", "qty": 1}],
            //     [{"item": "leather-armor", "qty": 1}, {"item": "longbow", "qty": 1}, {"item": "arrows", "qty": 20}]
            //   ]},
            //   {"item": "longsword", "qty": 1}  // Not a choice, always get this
            // ]

            // Starting gold if buying equipment instead
            $table->string('starting_gold_formula')->nullable();  // "5d4 * 10"

            // Features by level
            $table->jsonb('level_features')->default('{}');
            // {
            //   "1": [
            //     {"key": "fighting_style", "name": "Боевой стиль", "description": "...", "type": "choice",
            //      "options": ["Защита", "Дуэль", "Бой двумя оружиями"]},
            //     {"key": "second_wind", "name": "Второе дыхание", "description": "...", "type": "feature",
            //      "recharge": "short_rest", "uses": 1}
            //   ],
            //   "2": [...]
            // }

            // Class progression table
            $table->jsonb('progression')->default('{}');
            // {
            //   "1": {"proficiency_bonus": 2, "features": ["fighting_style", "second_wind"]},
            //   "2": {"proficiency_bonus": 2, "features": ["action_surge"]},
            //   "5": {"proficiency_bonus": 3, "features": ["extra_attack"]}
            // }

            // For spellcasting classes
            $table->boolean('is_spellcaster')->default(false);
            $table->string('spellcasting_ability')->nullable();  // "intelligence", "wisdom", "charisma"

            // Spell slots per level (for spellcasters)
            $table->jsonb('spell_slots')->nullable();
            // {
            //   "1": {"cantrips": 3, "1st": 2},
            //   "2": {"cantrips": 3, "1st": 3},
            //   "3": {"cantrips": 3, "1st": 4, "2nd": 2}
            // }

            // Spells known per level (for classes like Sorcerer)
            $table->jsonb('spells_known')->nullable();
            // {"1": 2, "2": 3, "3": 4, ...}

            // Subclass info
            $table->string('subclass_level')->nullable();       // Level when you choose subclass: "3"
            $table->jsonb('subclass_name')->nullable();         // {"ru": "Воинский архетип"}

            // Is this a system class (from SRD) or user-created
            $table->boolean('is_system')->default(false);

            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // Pivot table for setting-class relationship with overrides
        Schema::create('setting_classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('setting_id')->constrained()->cascadeOnDelete();
            $table->foreignId('character_class_id')->constrained()->cascadeOnDelete();

            // Overrides allow customizing class data per setting
            $table->jsonb('overrides')->nullable();

            $table->unique(['setting_id', 'character_class_id']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('setting_classes');
        Schema::dropIfExists('character_classes');
    }
};
