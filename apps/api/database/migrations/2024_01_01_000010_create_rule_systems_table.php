<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rule_systems', function (Blueprint $table) {
            $table->id();
            $table->jsonb('name');                      // {"ru": "D&D 5-я редакция"}
            $table->jsonb('description')->nullable();
            $table->string('slug', 100)->unique();
            $table->boolean('is_system')->default(false); // true = предустановленная

            // Всё в JSONB — полностью настраиваемое DM'ом
            $table->jsonb('abilities')->default('[]');      // Характеристики
            $table->jsonb('skills')->default('[]');         // Навыки
            $table->jsonb('dice')->default('["d4","d6","d8","d10","d12","d20","d100"]');
            $table->jsonb('formulas')->default('{}');       // Формулы расчётов
            $table->jsonb('conditions')->default('[]');     // Состояния
            $table->jsonb('damage_types')->default('[]');   // Типы урона
            $table->jsonb('magic_schools')->default('[]');  // Школы магии
            $table->jsonb('level_range')->default('{"min": 1, "max": 20}');
            $table->jsonb('combat_rules')->default('{}');   // Боевые правила
            $table->jsonb('character_creation')->default('{}'); // Создание персонажа
            $table->jsonb('currency')->default('{}');       // Валюта
            $table->jsonb('units')->default('{}');          // Единицы измерения

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rule_systems');
    }
};
