<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Add XP table and multiclass rules to RuleSystem for level progression
     */
    public function up(): void
    {
        Schema::table('rule_systems', function (Blueprint $table) {
            // XP table for level progression
            // {"1": 0, "2": 300, "3": 900, ... "20": 355000}
            $table->jsonb('experience_table')->nullable()->after('character_creation');

            // Multiclass prerequisites by class
            // {"barbarian": {"strength": 13}, "fighter": {"strength": 13, "or": {"dexterity": 13}}}
            $table->jsonb('multiclass_prerequisites')->nullable()->after('experience_table');

            // Proficiencies gained when multiclassing into a class
            // {"barbarian": {"armor": ["shields"], "weapons": ["simple", "martial"]}}
            $table->jsonb('multiclass_proficiencies')->nullable()->after('multiclass_prerequisites');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rule_systems', function (Blueprint $table) {
            $table->dropColumn([
                'experience_table',
                'multiclass_prerequisites',
                'multiclass_proficiencies',
            ]);
        });
    }
};
