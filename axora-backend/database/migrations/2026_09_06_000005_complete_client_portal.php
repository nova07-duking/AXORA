<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', fn (Blueprint $t) => $t->boolean('is_admin')->default(false));
        Schema::table('quote_requests', function (Blueprint $t) {
            $t->text('reply')->nullable();
            $t->index(['user_id', 'created_at']);
        });
        Schema::create('client_requests', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('kind', 20);
            $t->string('subject');
            $t->text('message');
            $t->string('status', 20)->default('nouveau');
            $t->string('audit_type', 50)->nullable();
            $t->string('organization_size', 50)->nullable();
            $t->dateTime('preferred_at')->nullable();
            $t->string('meeting_mode', 20)->nullable();
            $t->string('confirmed_slot')->nullable()->unique();
            $t->string('meeting_url', 1000)->nullable();
            $t->text('reply')->nullable();
            $t->timestamps();
            $t->index(['user_id', 'created_at']);
            $t->index(['kind', 'status']);
        });
        Schema::create('site_settings', function (Blueprint $t) {
            $t->id();
            $t->json('content');
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_settings');
        Schema::dropIfExists('client_requests');
        Schema::table('quote_requests', function (Blueprint $t) {
            $t->dropIndex(['user_id', 'created_at']);
            $t->dropColumn('reply');
        });
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn('is_admin'));
    }
};
