<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class PasswordController extends Controller
{
    public function forgot(Request $request)
    {
        $data = $request->validate(['email' => 'required|email|max:255']);
        abort_if(in_array(config('mail.default'), ['log', 'array']) && ! app()->environment('testing'), 503, 'La récupération par email est indisponible. Contactez l’équipe AXORA.');
        try {
            Password::sendResetLink($data);
        } catch (\Throwable $e) {
            report($e);
            abort(503, 'L’envoi est momentanément indisponible. Veuillez réessayer.');
        }

        return response()->json(['message' => 'Si un compte correspond à cet email, un lien de réinitialisation vous sera envoyé.']);
    }

    public function reset(Request $request)
    {
        $data = $request->validate(['email' => 'required|email|max:255', 'token' => 'required|string', 'password' => 'required|string|min:8|max:128|confirmed']);
        $status = Password::reset($data, function ($user, $password) {
            $user->forceFill(['password' => Hash::make($password), 'remember_token' => Str::random(60)])->save();
            $user->tokens()->delete();
        });
        abort_unless($status === Password::PASSWORD_RESET, 422, 'Ce lien est invalide ou expiré. Demandez un nouveau lien.');

        return response()->json(['message' => 'Mot de passe modifié. Vous pouvez vous connecter.']);
    }
}
