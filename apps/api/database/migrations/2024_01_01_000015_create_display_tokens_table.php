<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('display_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('token', 64)->unique();        // Уникальный токен дисплея (UUID)
            $table->string('code', 4);                    // 4-значный код для pairing
            $table->foreignId('campaign_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // DM
            $table->string('name')->nullable();           // "Display #1", "Гостиная ТВ"
            $table->string('status', 20)->default('waiting'); // waiting/paired/disconnected
            $table->timestamp('code_expires_at');         // Код истекает через 5 минут
            $table->timestamp('last_heartbeat_at')->nullable();
            $table->jsonb('metadata')->default('{}');     // User-agent, IP, etc.
            $table->timestamps();

            $table->index(['code', 'status']);
            $table->index('token');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('display_tokens');
    }
};
