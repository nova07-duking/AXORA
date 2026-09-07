<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClientRequest;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ClientRequestController extends Controller
{
    public function index(Request $request)
    {
        return ClientRequest::where('user_id', $request->user()->id)->latest()->paginate(15);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'kind' => ['required', Rule::in(['audit', 'appointment'])],
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'min:10', 'max:10000'],
            'audit_type' => ['exclude_unless:kind,audit', 'required', Rule::in(['cybersecurite', 'infrastructure', 'data', 'application', 'global'])],
            'organization_size' => ['exclude_unless:kind,audit', 'required', Rule::in(['1-10', '11-50', '51-200', '200+'])],
            'preferred_at' => ['exclude_unless:kind,appointment', 'required', 'date_format:Y-m-d\TH:iP', 'after:now', 'before:'.now()->addMonths(6)->toIso8601String()],
            'meeting_mode' => ['exclude_unless:kind,appointment', 'required', Rule::in(['visio', 'telephone', 'sur_place'])],
        ]);
        if (isset($data['preferred_at'])) {
            $data['preferred_at'] = Carbon::parse($data['preferred_at'])->utc();
        }
        $data['user_id'] = $request->user()->id;

        return response()->json(ClientRequest::create($data), 201);
    }

    public function cancel(Request $request, ClientRequest $clientRequest)
    {
        abort_unless((int) $clientRequest->user_id === (int) $request->user()->id, 403);
        $changed = ClientRequest::whereKey($clientRequest->id)
            ->whereIn('status', ['nouveau', 'confirme', 'en_cours'])
            ->update(['status' => 'annule', 'confirmed_slot' => null, 'updated_at' => now()]);
        abort_unless($changed, 409, 'Cette demande ne peut plus être annulée.');

        return $clientRequest->fresh();
    }
}
