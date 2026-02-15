<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('monsters', function (Blueprint $table) {
            $table->id();

            // Translatable fields
            $table->jsonb('name');                          // {"ru": "Красный дракон (взрослый)"}
            $table->jsonb('description')->nullable();

            // Basic info
            $table->string('slug', 100)->unique();
            $table->string('size', 20);                     // tiny/small/medium/large/huge/gargantuan
            $table->string('type', 50);                     // beast/undead/fiend/dragon/etc.
            $table->string('alignment', 50)->nullable();

            // Combat stats
            $table->integer('armor_class');
            $table->string('armor_type', 100)->nullable();  // "природный доспех"
            $table->integer('hit_points');
            $table->string('hit_dice', 20)->nullable();     // "18d12+72"
            $table->decimal('challenge_rating', 5, 2)->nullable(); // 0.25, 0.5, 1, 2, ... 30
            $table->integer('experience_points')->nullable();

            // JSONB fields
            $table->jsonb('abilities')->default('{}');      // {"strength": 27, "dexterity": 10, ...}
            $table->jsonb('speed')->default('{"walk": 9}'); // {"walk": 12, "fly": 24, "swim": 12}
            $table->jsonb('saving_throws')->default('{}');  // {"dexterity": 6, "constitution": 13}
            $table->jsonb('skills')->default('{}');         // {"perception": 13, "stealth": 6}
            $table->jsonb('senses')->default('{}');         // {"darkvision": "36 м", "passive_perception": 23}
            $table->jsonb('languages')->default('[]');      // ["Общий", "Драконий"]

            // Resistances and immunities
            $table->jsonb('damage_resistances')->default('[]');
            $table->jsonb('damage_immunities')->default('[]');
            $table->jsonb('damage_vulnerabilities')->default('[]');
            $table->jsonb('condition_immunities')->default('[]');

            // Features and actions
            $table->jsonb('traits')->default('[]');         // Special abilities/features
            $table->jsonb('actions')->default('[]');        // Combat actions
            $table->jsonb('legendary_actions')->nullable(); // {"per_round": 3, "actions": [...]}
            $table->jsonb('lair_actions')->nullable();
            $table->jsonb('regional_effects')->nullable();

            // Metadata
            $table->boolean('is_system')->default(false);
            $table->integer('sort_order')->default(0);

            $table->timestamps();
        });

        // GIN indexes for JSONB search
        DB::statement('CREATE INDEX idx_monsters_abilities ON monsters USING GIN (abilities)');
        DB::statement('CREATE INDEX idx_monsters_actions ON monsters USING GIN (actions)');
        DB::statement('CREATE INDEX idx_monsters_type ON monsters (type)');
        DB::statement('CREATE INDEX idx_monsters_cr ON monsters (challenge_rating)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('monsters');
    }
};
