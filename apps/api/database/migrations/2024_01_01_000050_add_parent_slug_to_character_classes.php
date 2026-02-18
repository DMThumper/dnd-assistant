<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('character_classes', function (Blueprint $table) {
            // Parent class slug for subclasses (same pattern as races)
            $table->string('parent_slug', 50)->nullable()->after('slug');

            // Index for faster subclass queries
            $table->index('parent_slug');
        });
    }

    public function down(): void
    {
        Schema::table('character_classes', function (Blueprint $table) {
            $table->dropIndex(['parent_slug']);
            $table->dropColumn('parent_slug');
        });
    }
};
