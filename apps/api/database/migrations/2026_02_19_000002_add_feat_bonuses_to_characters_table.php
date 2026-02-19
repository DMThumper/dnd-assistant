<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds feat_bonuses column to store bonuses from feats like:
     * - initiative (Alert feat: +5)
     * - ac (Dual Wielder: +1)
     * - speed (Mobile: +3m)
     * - passive_perception (Observant: +5)
     * - hp_per_level (Tough: +2 per level)
     * - luck_points (Lucky feat)
     * - sorcery_points (Metamagic Adept)
     */
    public function up(): void
    {
        Schema::table('characters', function (Blueprint $table) {
            $table->jsonb('feat_bonuses')->nullable()->after('asi_choices');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('characters', function (Blueprint $table) {
            $table->dropColumn('feat_bonuses');
        });
    }
};
