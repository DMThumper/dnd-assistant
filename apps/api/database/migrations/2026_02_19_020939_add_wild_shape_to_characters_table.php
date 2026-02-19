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
            // Wild Shape charges (2 for most druids, recovers on short/long rest)
            $table->integer('wild_shape_charges')->default(2)->after('summoned_creatures');

            // Current wild shape form (null when not transformed)
            // Structure: {beast_slug, beast_name, monster_id, max_hp, current_hp, temp_hp, transformed_at}
            $table->jsonb('wild_shape_form')->nullable()->after('wild_shape_charges');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('characters', function (Blueprint $table) {
            $table->dropColumn(['wild_shape_charges', 'wild_shape_form']);
        });
    }
};
