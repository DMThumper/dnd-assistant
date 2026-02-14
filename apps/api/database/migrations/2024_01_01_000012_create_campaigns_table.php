<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('setting_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // DM
            $table->jsonb('name');                      // {"ru": "Тайны Шарна"}
            $table->jsonb('description')->nullable();
            $table->string('slug', 100);
            $table->string('status', 20)->default('active'); // active/paused/completed
            $table->jsonb('settings')->default('{}');   // allowed_races, ability_method, etc.
            $table->timestamps();

            $table->unique(['user_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaigns');
    }
};
