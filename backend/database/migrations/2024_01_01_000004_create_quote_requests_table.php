<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quote_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();

            // Nature de la demande : audit, développement, conseil, autre
            $table->enum('need_type', ['audit', 'developpement', 'conseil', 'maintenance', 'autre'])
                  ->default('audit');

            $table->text('message');
            $table->string('budget_estimatif')->nullable();

            $table->enum('status', ['nouveau', 'en_cours', 'traite', 'annule'])->default('nouveau');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quote_requests');
    }
};
