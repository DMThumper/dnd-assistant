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
        Schema::table('character_classes', function (Blueprint $table) {
            $table->jsonb('circle_spells')->nullable()->after('spell_slots');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('character_classes', function (Blueprint $table) {
            $table->dropColumn('circle_spells');
        });
    }
};
