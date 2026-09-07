<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    /**
     * Inscription — le champ "type" (particulier|entreprise) pilote les règles
     * de validation : une entreprise doit renseigner sa raison sociale.
     */
    public function register(Request $request)
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(['particulier', 'entreprise'])],
            'name' => ['required', 'string', 'max:255'],
            'company_name' => ['required_if:type,entreprise', 'nullable', 'string', 'max:255'],
            'rccm' => ['nullable', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'max:128', 'confirmed'],
        ]);

        $user = User::create([
            'type' => $data['type'],
            'name' => $data['name'],
            'company_name' => $data['company_name'] ?? null,
            'rccm' => $data['rccm'] ?? null,
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        $token = $user->createToken('axora-frontend', ['*'], now()->addDays(7))->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'max:128'],
        ]);

        $user = User::where('email', $credentials['email'])->first();
        if (! Hash::check($credentials['password'], $user?->password ?? '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.') || ! $user) {
            return response()->json([
                'message' => 'Connexion impossible. Vérifiez vos informations et réessayez.',
            ], 422);
        }

        $token = $user->createToken('axora-frontend', ['*'], now()->addDays(7))->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnecté.']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }
}
