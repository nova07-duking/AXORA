<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClientRequest;
use App\Models\QuoteRequest;
use App\Models\Service;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    public function index(Request $request)
    {
        $data = $request->validate([
            'kind' => ['nullable', Rule::in(['quote', 'audit', 'appointment'])],
            'status' => ['nullable', Rule::in(['nouveau', 'en_cours', 'traite', 'annule', 'confirme', 'termine'])],
            'search' => 'nullable|string|max:150',
            'sort' => ['nullable', Rule::in(['newest', 'oldest'])],
        ]);
        $query = ($data['kind'] ?? 'quote') === 'quote' ? QuoteRequest::with('service') : ClientRequest::where('kind', $data['kind']);
        $search = trim($data['search'] ?? '');
        $query->when($search !== '', function ($q) use ($search) {
            $q->where(function ($q) use ($search) {
                $q->whereLike('message', '%'.$search.'%')
                    ->orWhereHas('user', fn ($u) => $u->whereLike('name', '%'.$search.'%')->orWhereLike('email', '%'.$search.'%')->orWhereLike('company_name', '%'.$search.'%'));
                if (ctype_digit($search)) {
                    $q->orWhere('id', (int) $search);
                }
                if ($q->getModel() instanceof ClientRequest) {
                    $q->orWhereLike('subject', '%'.$search.'%');
                } else {
                    $q->orWhereHas('service', fn ($s) => $s->whereLike('name', '%'.$search.'%'));
                }
            });
        });

        return $query->with('user:id,name,email,phone,company_name')->when($data['status'] ?? null, fn ($q, $s) => $q->where('status', $s))
            ->orderBy('created_at', ($data['sort'] ?? 'newest') === 'oldest' ? 'asc' : 'desc')->orderBy('id', ($data['sort'] ?? 'newest') === 'oldest' ? 'asc' : 'desc')->paginate(15);
    }

    public function dashboard()
    {
        $quotes = QuoteRequest::select('status', DB::raw('count(*) as total'))->groupBy('status')->pluck('total', 'status');
        $requests = ClientRequest::select('kind', 'status', DB::raw('count(*) as total'))->groupBy('kind', 'status')->get();
        $byKind = ['quote' => $quotes->sum(), 'audit' => $requests->where('kind', 'audit')->sum('total'), 'appointment' => $requests->where('kind', 'appointment')->sum('total')];
        $recent = QuoteRequest::with('user:id,name,email,phone,company_name', 'service')->latest()->orderByDesc('id')->limit(6)->get()->map(fn ($q) => array_merge($q->toArray(), ['kind' => 'quote']))
            ->concat(ClientRequest::with('user:id,name,email,phone,company_name')->latest()->orderByDesc('id')->limit(6)->get()->toArray())->sortByDesc('created_at')->take(6)->values();

        return response()->json([
            'totals' => $byKind,
            'pending' => ($quotes['nouveau'] ?? 0) + $requests->where('status', 'nouveau')->sum('total'),
            'active' => ($quotes['en_cours'] ?? 0) + $requests->where('status', 'en_cours')->sum('total'),
            'clients' => User::where('is_admin', false)->count(),
            'upcoming_count' => ClientRequest::where('kind', 'appointment')->where('status', 'confirme')->where('preferred_at', '>=', now())->count(),
            'upcoming' => ClientRequest::with('user:id,name,email,phone,company_name')->where('kind', 'appointment')->where('status', 'confirme')->where('preferred_at', '>=', now())->orderBy('preferred_at')->limit(5)->get(),
            'recent' => $recent,
        ]);
    }

    public function update(Request $request, string $kind, int $id)
    {
        abort_unless(in_array($kind, ['quote', 'audit', 'appointment']), 404);
        $statuses = $kind === 'appointment' ? ['nouveau', 'confirme', 'termine', 'annule'] : ['nouveau', 'en_cours', 'traite', 'annule'];
        $data = $request->validate(['status' => ['required', Rule::in($statuses)], 'reply' => 'nullable|string|max:10000', 'meeting_url' => 'nullable|url:https|max:1000']);
        try {
            return DB::transaction(function () use ($kind, $id, $data) {
                $record = $kind === 'quote' ? QuoteRequest::lockForUpdate()->findOrFail($id) : ClientRequest::where('kind', $kind)->lockForUpdate()->findOrFail($id);
                $record->status = $data['status'];
                if (array_key_exists('reply', $data)) {
                    $record->reply = $data['reply'];
                }
                if ($kind === 'appointment') {
                    abort_if($data['status'] === 'confirme' && $record->preferred_at->isPast(), 422, 'La date demandée est déjà passée.');
                    $record->confirmed_slot = $data['status'] === 'confirme' ? $record->preferred_at->utc()->format('Y-m-d H:i') : null;
                    if (array_key_exists('meeting_url', $data)) {
                        $record->meeting_url = $data['meeting_url'];
                    }
                }
                $record->save();

                return $record;
            });
        } catch (UniqueConstraintViolationException $e) {
            abort(409, 'Un rendez-vous est déjà confirmé à cette heure.');
        }
    }

    public function service(Request $request, Service $service)
    {
        $service->update($request->validate([
            'name' => 'required|string|max:255', 'tagline' => 'required|string|max:255',
            'description' => 'required|string|max:10000', 'deliverables' => 'required|array|min:1|max:10',
            'deliverables.*' => 'required|string|max:500',
        ]));

        return $service;
    }
}
