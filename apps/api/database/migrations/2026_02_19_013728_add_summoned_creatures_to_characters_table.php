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
        Schema::table('characters', function (Blueprint $table) {
            // Summoned creatures: familiars, wildfire spirits, conjured beasts, etc.
            // Structure: [{id, name, type, monster_id, current_hp, max_hp, temp_hp, conditions, custom_stats}]
            $table->jsonb('summoned_creatures')->nullable()->after('known_spells');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('characters', function (Blueprint $table) {
            $table->dropColumn('summoned_creatures');
        });
    }
};
