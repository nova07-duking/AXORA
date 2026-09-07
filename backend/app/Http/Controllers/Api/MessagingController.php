<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\ConversationRead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class MessagingController extends Controller
{
    private function authorizeConversation(Request $request, Conversation $conversation): void
    {
        abort_unless($request->user()->is_admin || (int) $conversation->user_id === (int) $request->user()->id, 403);
    }

    public function own(Request $request)
    {
        return response()->json(['conversation' => Conversation::where('user_id', $request->user()->id)->first()]);
    }

    public function inbox(Request $request)
    {
        $data = $request->validate(['search' => 'nullable|string|max:150', 'unread' => 'nullable|boolean']);
        $userId = $request->user()->id;
        $query = Conversation::with('user:id,name,email,company_name', 'lastMessage')->whereHas('messages')
            ->withCount(['messages as unread_count' => function ($messages) use ($userId) {
                $messages->where(fn ($q) => $q->where('sender_id', '!=', $userId)->orWhereNull('sender_id'))
                    ->where('id', '>', function ($q) use ($userId) {
                        $q->selectRaw('COALESCE(MAX(last_read_message_id), 0)')->from('conversation_reads')
                            ->whereColumn('conversation_reads.conversation_id', 'conversations.id')->where('user_id', $userId);
                    });
            }]);
        if ($data['unread'] ?? false) {
            $query->whereHas('messages', function ($messages) use ($userId) {
                $messages->where(fn ($q) => $q->where('sender_id', '!=', $userId)->orWhereNull('sender_id'))
                    ->where('id', '>', function ($q) use ($userId) {
                        $q->selectRaw('COALESCE(MAX(last_read_message_id), 0)')->from('conversation_reads')
                            ->whereColumn('conversation_reads.conversation_id', 'conversations.id')->where('user_id', $userId);
                    });
            });
        }
        if (filled($data['search'] ?? null)) {
            $term = '%'.trim($data['search']).'%';
            $query->whereHas('user', fn ($q) => $q->whereLike('name', $term)->orWhereLike('email', $term)->orWhereLike('company_name', $term));
        }

        return $query->orderByDesc('last_message_at')->orderByDesc('id')->paginate(15);
    }

    public function messages(Request $request, Conversation $conversation)
    {
        $this->authorizeConversation($request, $conversation);
        $data = $request->validate(['before' => ['nullable', 'integer', 'min:1', Rule::prohibitedIf($request->filled('after'))], 'after' => ['nullable', 'integer', 'min:1', Rule::prohibitedIf($request->filled('before'))]]);
        $query = $conversation->messages();
        if (isset($data['after'])) {
            $query->where('id', '>', $data['after'])->orderBy('id');
        } else {
            if (isset($data['before'])) {
                $query->where('id', '<', $data['before']);
            }
            $query->orderByDesc('id');
        }
        $messages = $query->limit(50)->get()->sortBy('id')->values();
        $reads = ConversationRead::where('conversation_id', $conversation->id);
        if ((int) $request->user()->id === (int) $conversation->user_id) {
            $reads->where('user_id', '!=', $request->user()->id)->whereIn('user_id', fn ($q) => $q->select('id')->from('users')->where('is_admin', true));
        } else {
            $reads->where('user_id', $conversation->user_id);
        }

        return response()->json([
            'messages' => $messages,
            'has_older' => $messages->isNotEmpty() && $conversation->messages()->where('id', '<', $messages->first()->id)->exists(),
            'peer_read_id' => (int) $reads->max('last_read_message_id'),
        ]);
    }

    public function storeOwn(Request $request)
    {
        $data = $this->validateMessage($request);

        return DB::transaction(function () use ($request, $data) {
            $conversation = Conversation::firstOrCreate(['user_id' => $request->user()->id]);

            return $this->saveMessage($request, $conversation, $data);
        });
    }

    public function store(Request $request, Conversation $conversation)
    {
        $this->authorizeConversation($request, $conversation);
        $data = $this->validateMessage($request);

        return DB::transaction(fn () => $this->saveMessage($request, $conversation, $data));
    }

    private function validateMessage(Request $request): array
    {
        return $request->validate(['body' => 'required|string|max:5000', 'client_nonce' => 'required|uuid']);
    }

    private function saveMessage(Request $request, Conversation $conversation, array $data)
    {
        // Serialize sends in this conversation; retrying the same delivery never duplicates it.
        $conversation = Conversation::whereKey($conversation->id)->lockForUpdate()->firstOrFail();
        $message = $conversation->messages()->firstOrCreate(
            ['sender_id' => $request->user()->id, 'client_nonce' => $data['client_nonce']],
            ['sender_name' => $request->user()->name, 'is_staff' => (bool) $request->user()->is_admin, 'body' => $data['body']],
        );
        abort_if($message->body !== $data['body'], 409, 'Cet envoi a déjà été enregistré avec un autre contenu.');
        if ($message->wasRecentlyCreated) {
            $conversation->update(['last_message_at' => now()]);
        }

        return response()->json(['conversation' => $conversation, 'message' => $message], $message->wasRecentlyCreated ? 201 : 200);
    }

    public function read(Request $request, Conversation $conversation)
    {
        $this->authorizeConversation($request, $conversation);
        $data = $request->validate(['message_id' => ['required', 'integer', Rule::exists('conversation_messages', 'id')->where('conversation_id', $conversation->id)]]);
        $read = ConversationRead::firstOrCreate(['conversation_id' => $conversation->id, 'user_id' => $request->user()->id], ['last_read_message_id' => 0]);
        ConversationRead::whereKey($read->id)->where('last_read_message_id', '<', $data['message_id'])->update(['last_read_message_id' => $data['message_id'], 'updated_at' => now()]);

        return response()->json(['last_read_message_id' => (int) $read->fresh()->last_read_message_id]);
    }
}
