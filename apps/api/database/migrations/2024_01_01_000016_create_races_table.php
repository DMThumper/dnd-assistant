<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('races', function (Blueprint $table) {
            $table->id();
            $table->jsonb('name');                          // {"ru": "Эльф"}
            $table->jsonb('description')->nullable();       // {"ru": "Грациозные и долгоживущие..."}
            $table->string('slug', 50)->unique();           // "elf"

            // Size: tiny, small, medium, large, huge, gargantuan
            $table->string('size', 20)->default('medium');

            // Ability score bonuses
            $table->jsonb('ability_bonuses')->default('{}');
            // {"dexterity": 2, "intelligence": 1} or {"choice": {"count": 2, "amount": 1}}

            // Speed in meters (D&D uses feet, we convert: 30ft = 9m)
            $table->jsonb('speed')->default('{"walk": 9}');
            // {"walk": 9, "fly": 9, "swim": 9}

            // Racial traits
            $table->jsonb('traits')->default('[]');
            // [
            //   {"key": "darkvision", "name": "Тёмное зрение", "description": "Видите в темноте на 18 м"},
            //   {"key": "fey_ancestry", "name": "Наследие фей", "description": "Преимущество против очарования"}
            // ]

            // Languages
            $table->jsonb('languages')->default('[]');      // ["common", "elvish"]

            // Proficiencies (weapons, armor, tools)
            $table->jsonb('proficiencies')->default('{"weapons": [], "armor": [], "tools": []}');

            // Skill proficiencies
            $table->jsonb('skill_proficiencies')->default('[]');

            // Subraces (for races with variants like Elf -> High Elf, Wood Elf)
            $table->string('parent_slug', 50)->nullable();  // If this is a subrace, reference parent

            // Age and physical info (flavor text)
            $table->jsonb('age_info')->nullable();          // {"maturity": 20, "lifespan": 750}
            $table->jsonb('size_info')->nullable();         // {"height_range": "1.5-1.8 м", "weight_range": "50-70 кг"}

            // Is this a system race (from SRD) or user-created
            $table->boolean('is_system')->default(false);

            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // Pivot table for setting-race relationship with overrides
        Schema::create('setting_races', function (Blueprint $table) {
            $table->id();
            $table->foreignId('setting_id')->constrained()->cascadeOnDelete();
            $table->foreignId('race_id')->constrained()->cascadeOnDelete();

            // Overrides allow customizing race data per setting
            // null = use original, otherwise merge with original
            $table->jsonb('overrides')->nullable();
            // {"traits": [{"key": "special", "name": "...", "description": "..."}]}

            $table->unique(['setting_id', 'race_id']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('setting_races');
        Schema::dropIfExists('races');
    }
};
