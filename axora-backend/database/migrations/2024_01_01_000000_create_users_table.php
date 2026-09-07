<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            // Type de compte : particulier ou entreprise — pilote les champs affichés côté front
            $table->enum('type', ['particulier', 'entreprise'])->default('particulier');

            // Pour un particulier : nom complet. Pour une entreprise : nom du contact référent.
            $table->string('name');

            // Renseignés uniquement pour les comptes "entreprise"
            $table->string('company_name')->nullable();
            $table->string('rccm')->nullable(); // n° Registre du Commerce et du Crédit Mobilier

            $table->string('phone')->nullable();
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
