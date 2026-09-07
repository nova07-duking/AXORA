<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QuoteRequest;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class QuoteRequestController extends Controller
{
    /**
     * Historique des demandes de devis de l'utilisateur connecté uniquement
     * — jamais celles des autres clients.
     */
    public function index(Request $request)
    {
        $quotes = $request->user()
            ->quoteRequests()
            ->with('service')
            ->latest()
            ->paginate(15);

        return response()->json($quotes);
    }

    /**
     * Création d'une demande de devis. Nécessite obligatoirement un compte
     * connecté (route protégée par le middleware auth:sanctum) — c'est la
     * règle métier demandée : pas de devis sans compte particulier/entreprise.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'service_id' => ['required', 'exists:services,id'],
            'need_type' => ['required', Rule::in(['audit', 'developpement', 'conseil', 'maintenance', 'autre'])],
            'message' => ['required', 'string', 'min:10', 'max:10000'],
            'budget_estimatif' => ['nullable', 'string', 'max:100'],
        ]);

        $quote = $request->user()->quoteRequests()->create($data);
        $quote->load('service');

        return response()->json($quote, 201);
    }

    public function show(Request $request, QuoteRequest $quoteRequest)
    {
        // Un client ne peut consulter que ses propres demandes.
        abort_if($quoteRequest->user_id !== $request->user()->id, 403);

        return response()->json($quoteRequest->load('service'));
    }
}
