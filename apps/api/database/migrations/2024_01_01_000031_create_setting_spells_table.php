<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('setting_spells', function (Blueprint $table) {
            $table->id();
            $table->foreignId('setting_id')->constrained()->onDelete('cascade');
            $table->foreignId('spell_id')->constrained()->onDelete('cascade');
            $table->jsonb('overrides')->nullable();  // Setting-specific overrides
            $table->timestamps();

            $table->unique(['setting_id', 'spell_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('setting_spells');
    }
};
