<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rule_system_id')->constrained()->cascadeOnDelete();
            $table->jsonb('name');                      // {"ru": "Эберрон"}
            $table->jsonb('description')->nullable();
            $table->string('slug', 100)->unique();
            $table->boolean('is_system')->default(false);
            $table->string('icon', 50)->nullable();
            $table->string('color', 7)->nullable();     // "#8B0000"
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
