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
        Schema::create('live_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained()->onDelete('cascade');
            $table->foreignId('game_session_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('started_by')->constrained('users')->onDelete('cascade');
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->jsonb('participants')->default('[]'); // [{user_id, character_id, joined_at}]
            $table->jsonb('metadata')->default('{}'); // any extra data
            $table->timestamps();

            // Index for quick lookup of active sessions
            $table->index(['campaign_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('live_sessions');
    }
};
