<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Naming: game_sessions to avoid conflict with Laravel's sessions table
        Schema::create('game_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('act_id')->constrained()->cascadeOnDelete();
            $table->integer('number');                  // Порядковый номер внутри акта
            $table->jsonb('name');                      // {"ru": "Поезд молний"}
            $table->jsonb('summary')->nullable();       // Краткое содержание сессии
            $table->string('status', 20)->default('planned'); // planned/active/completed
            $table->date('played_at')->nullable();      // Когда играли
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['act_id', 'number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_sessions');
    }
};
