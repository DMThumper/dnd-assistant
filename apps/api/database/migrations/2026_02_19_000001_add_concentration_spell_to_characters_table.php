<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Add concentration_spell field to characters table for tracking
     * active concentration spells during play.
     *
     * Structure:
     * {
     *   "spell_slug": "hold-person",
     *   "spell_name": "Удержание личности",
     *   "started_at": "2026-02-18T10:30:00Z",
     *   "duration": "1 minute"
     * }
     */
    public function up(): void
    {
        Schema::table('characters', function (Blueprint $table) {
            $table->jsonb('concentration_spell')->nullable()->after('spell_slots_remaining');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('characters', function (Blueprint $table) {
            $table->dropColumn('concentration_spell');
        });
    }
};
