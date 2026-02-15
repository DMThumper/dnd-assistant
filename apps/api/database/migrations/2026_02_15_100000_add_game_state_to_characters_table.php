<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Add game state columns for real-time DM-Player sync:
     * - conditions: D&D standard conditions (poisoned, stunned, etc.)
     * - custom_rules: Custom perks/afflictions with bonuses and penalties
     * - inventory: Items in character's possession
     * - equipment: Currently equipped items
     * - spell management: prepared, known, remaining slots
     * - multiclass support: class_levels, subclasses
     * - level progression: asi_choices
     */
    public function up(): void
    {
        Schema::table('characters', function (Blueprint $table) {
            // D&D Standard Conditions (poisoned, stunned, etc.)
            // [{"key": "poisoned", "source": "Giant spider", "duration": 10, "applied_at": "2026-02-15"}]
            $table->jsonb('conditions')->default('[]')->after('stats');

            // Custom Rules - perks, afflictions with both bonuses and penalties
            // [{"id": "uuid", "name": "Lost Eye", "effects": [{"type": "penalty", ...}], "permanent": true}]
            $table->jsonb('custom_rules')->default('[]')->after('conditions');

            // Inventory - items in possession
            // [{"item_slug": "healing-potion", "qty": 2}, {"custom": true, "name": "Strange Key"}]
            $table->jsonb('inventory')->default('[]')->after('custom_rules');

            // Equipment - currently equipped items
            // {"armor": "chain-mail", "main_hand": "longsword", "off_hand": "shield", "ring_1": null}
            $table->jsonb('equipment')->default('{}')->after('inventory');

            // Prepared spells (for prepared casters like Cleric, Wizard)
            // ["cure-wounds", "bless", "guiding-bolt"]
            $table->jsonb('prepared_spells')->default('[]')->after('equipment');

            // Known spells (for known casters like Sorcerer, Bard)
            // ["fire-bolt", "magic-missile", "shield"]
            $table->jsonb('known_spells')->default('[]')->after('prepared_spells');

            // Remaining spell slots after use
            // {"1": 2, "2": 1, "3": 0} - slots remaining by level
            $table->jsonb('spell_slots_remaining')->default('{}')->after('known_spells');

            // Multiclass: class levels for each class
            // {"fighter": 3, "rogue": 2} - null/empty means single class
            $table->jsonb('class_levels')->default('{}')->after('spell_slots_remaining');

            // Subclasses chosen for each class
            // {"fighter": "champion", "rogue": "thief"}
            $table->jsonb('subclasses')->default('{}')->after('class_levels');

            // ASI/Feat choices made at level up
            // [{"level": 4, "type": "asi", "choices": {"strength": 2}}, {"level": 8, "type": "feat", "feat": "great-weapon-master"}]
            $table->jsonb('asi_choices')->default('[]')->after('subclasses');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('characters', function (Blueprint $table) {
            $table->dropColumn([
                'conditions',
                'custom_rules',
                'inventory',
                'equipment',
                'prepared_spells',
                'known_spells',
                'spell_slots_remaining',
                'class_levels',
                'subclasses',
                'asi_choices',
            ]);
        });
    }
};
