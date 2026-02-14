<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('acts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained()->cascadeOnDelete();
            $table->integer('number');                  // Порядковый номер: 1, 2, 3
            $table->jsonb('name');                      // {"ru": "Акт 1: Прибытие в Шарн"}
            $table->jsonb('description')->nullable();   // Краткое описание для DM
            $table->jsonb('intro')->nullable();         // Вступительный текст акта
            $table->jsonb('epilogue')->nullable();      // Завершающий текст акта
            $table->string('status', 20)->default('planned'); // planned/active/completed
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['campaign_id', 'number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('acts');
    }
};
