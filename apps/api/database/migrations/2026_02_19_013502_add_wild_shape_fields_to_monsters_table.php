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
        Schema::table('monsters', function (Blueprint $table) {
            $table->boolean('is_common')->default(false)->after('is_system');
            $table->boolean('has_swim')->default(false)->after('is_common');
            $table->boolean('has_fly')->default(false)->after('has_swim');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('monsters', function (Blueprint $table) {
            $table->dropColumn(['is_common', 'has_swim', 'has_fly']);
        });
    }
};
