<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feats', function (Blueprint $table) {
            $table->id();
            $table->jsonb('name');              // Translatable: {"ru": "Боевое мастерство"}
            $table->jsonb('description');       // Translatable: full description
            $table->string('slug', 100)->unique();

            // Prerequisites (JSONB): ability requirements, proficiency requirements, etc.
            // Example: {"ability": {"strength": 13}, "or": [{"ability": {"dexterity": 13}}]}
            // Example: {"proficiency": "heavy_armor"}
            $table->jsonb('prerequisites')->nullable();

            // Benefits (JSONB): what the feat grants
            // Example: {"ability_increase": {"options": ["strength", "dexterity"], "amount": 1}}
            // Example: {"proficiencies": ["all_armor"], "features": [...]}
            $table->jsonb('benefits')->nullable();

            // For repeatable feats (can be taken multiple times)
            $table->boolean('repeatable')->default(false);

            // System feat (from SRD/PHB) vs homebrew
            $table->boolean('is_system')->default(false);

            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // Pivot table for setting-specific feats with overrides
        Schema::create('setting_feats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('setting_id')->constrained()->onDelete('cascade');
            $table->foreignId('feat_id')->constrained()->onDelete('cascade');
            $table->jsonb('overrides')->nullable();
            $table->timestamps();

            $table->unique(['setting_id', 'feat_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('setting_feats');
        Schema::dropIfExists('feats');
    }
};
