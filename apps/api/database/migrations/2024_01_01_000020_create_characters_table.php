<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('characters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('campaign_id')->constrained()->cascadeOnDelete();

            // Basic info
            $table->jsonb('name');                      // {"ru": "Торин Дубощит"}
            $table->jsonb('backstory')->nullable();     // {"ru": "Бывший кузнец из..."}
            $table->string('race_slug', 50)->nullable();
            $table->string('class_slug', 50)->nullable();
            $table->integer('level')->default(1);
            $table->integer('experience_points')->default(0);

            // Core stats
            $table->jsonb('abilities')->default('{"strength": 10, "dexterity": 10, "constitution": 10, "intelligence": 10, "wisdom": 10, "charisma": 10}');
            $table->integer('current_hp');
            $table->integer('max_hp');
            $table->integer('temp_hp')->default(0);
            $table->integer('armor_class')->default(10);
            $table->jsonb('speed')->default('{"walk": 9}');  // In meters
            $table->boolean('inspiration')->default(false);

            // Proficiencies and skills
            $table->jsonb('skill_proficiencies')->default('[]');    // ["athletics", "perception"]
            $table->jsonb('skill_expertise')->default('[]');        // ["stealth"]
            $table->jsonb('saving_throw_proficiencies')->default('[]');
            $table->jsonb('proficiencies')->default('{"armor": [], "weapons": [], "tools": [], "languages": []}');

            // Death and combat
            $table->jsonb('death_saves')->default('{"successes": 0, "failures": 0}');
            $table->jsonb('hit_dice_remaining')->default('{}');

            // Features and resources
            $table->jsonb('features')->default('[]');
            $table->jsonb('class_resources')->default('[]');

            // Currency
            $table->jsonb('currency')->default('{"cp": 0, "sp": 0, "ep": 0, "gp": 0, "pp": 0}');

            // Life status
            $table->boolean('is_alive')->default(true);
            $table->jsonb('death_info')->nullable();
            $table->jsonb('stats')->default('{}');      // Cumulative stats

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('characters');
    }
};
