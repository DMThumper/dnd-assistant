<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spells', function (Blueprint $table) {
            $table->id();
            $table->jsonb('name');                          // {"ru": "Огненный шар"}
            $table->jsonb('description')->nullable();       // {"ru": "Яркий луч..."}
            $table->string('slug', 100)->unique();

            $table->smallInteger('level');                  // 0 = cantrip, 1-9
            $table->string('school', 30);                   // evocation, necromancy, etc.
            $table->string('casting_time', 100);            // "1 действие", "1 бонусное действие"
            $table->string('range', 100);                   // "45 м", "Касание", "На себя"
            $table->string('duration', 100);                // "Мгновенная", "Концентрация, до 1 минуты"
            $table->boolean('concentration')->default(false);
            $table->boolean('ritual')->default(false);

            // Components as JSONB
            $table->jsonb('components')->default('{}');
            // {"verbal": true, "somatic": true, "material": true,
            //  "material_description": "крошечный шарик...", "material_cost": null}

            // Classes that can use this spell
            $table->jsonb('classes')->default('[]');        // ["wizard", "sorcerer"]

            // Higher levels description
            $table->jsonb('higher_levels')->nullable();
            // {"description": "Если вы используете ячейку 4 уровня..."}

            // For cantrips - scaling by character level
            $table->jsonb('cantrip_scaling')->nullable();
            // {"5": "2d10", "11": "3d10", "17": "4d10"}

            // Effects for automation (optional)
            $table->jsonb('effects')->nullable();
            // {"damage": {"dice": "8d6", "type": "fire"}, "save": {"ability": "dex"}}

            $table->boolean('is_system')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            // Indexes
            $table->index('level');
            $table->index('school');
            $table->index('is_system');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spells');
    }
};
