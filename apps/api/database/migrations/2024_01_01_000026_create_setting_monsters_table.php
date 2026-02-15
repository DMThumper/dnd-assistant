<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('setting_monsters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('setting_id')->constrained()->onDelete('cascade');
            $table->foreignId('monster_id')->constrained()->onDelete('cascade');
            $table->jsonb('overrides')->nullable(); // Setting-specific modifications
            $table->timestamps();

            $table->unique(['setting_id', 'monster_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('setting_monsters');
    }
};
