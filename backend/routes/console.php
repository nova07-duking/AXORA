<?php

use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

Artisan::command('axora:admin {email} {--revoke}', function () {
    $user = User::where('email', $this->argument('email'))->first();
    if (! $user) {
        $this->error('Créez d’abord ce compte sur le site.');

        return 1;
    }
    $user->is_admin = ! $this->option('revoke');
    $user->save();
    $this->info($user->is_admin ? 'Accès administrateur accordé.' : 'Accès administrateur retiré.');
})->purpose('Accorder ou retirer un accès administrateur à un compte existant');
