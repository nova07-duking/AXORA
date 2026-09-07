<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\ConversationMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MessagingTest extends TestCase
{
    use RefreshDatabase;

    private function staff(): User
    {
        $user = User::factory()->create();
        $user->forceFill(['is_admin' => true])->save();

        return $user;
    }

    private function send(User $user, ?int $id = null, string $body = 'Bonjour AXORA'): array
    {
        Sanctum::actingAs($user);

        return $this->postJson($id ? "/api/messaging/$id/messages" : '/api/messaging', ['body' => $body, 'client_nonce' => (string) Str::uuid()])->assertCreated()->json();
    }

    public function test_client_can_start_conversation_and_two_admins_can_reply(): void
    {
        $client = User::factory()->create();
        $first = $this->send($client);
        $id = $first['conversation']['id'];
        $admin = $this->staff();
        $second = $this->send($admin, $id, 'Bonjour, comment vous aider ?');
        $this->assertTrue($second['message']['is_staff']);
        $other = $this->staff();
        $this->send($other, $id, 'Je prends le relais.');
        Sanctum::actingAs($client);
        $this->getJson('/api/messaging')->assertOk()->assertJsonPath('conversation.id', $id);
        $this->getJson("/api/messaging/$id/messages")->assertOk()->assertJsonCount(3, 'messages')->assertJsonPath('messages.1.sender_name', $admin->name)->assertJsonPath('messages.2.sender_name', $other->name);
        $this->assertDatabaseCount('conversations', 1);
    }

    public function test_other_clients_cannot_read_send_or_mark_a_private_conversation(): void
    {
        $this->getJson('/api/messaging')->assertUnauthorized();
        $id = $this->send(User::factory()->create())['conversation']['id'];
        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/admin/conversations')->assertForbidden();
        $this->getJson("/api/messaging/$id/messages")->assertForbidden();
        $this->postJson("/api/messaging/$id/messages", ['body' => 'intrusion', 'client_nonce' => (string) Str::uuid()])->assertForbidden();
        $this->postJson("/api/messaging/$id/read", ['message_id' => 1])->assertForbidden();
        $this->getJson('/api/messaging')->assertOk()->assertJsonPath('conversation', null);
    }

    public function test_retry_is_idempotent_and_sender_cannot_be_forged(): void
    {
        $client = User::factory()->create();
        Sanctum::actingAs($client);
        $payload = ['body' => 'Mon projet', 'client_nonce' => (string) Str::uuid(), 'sender_name' => 'Admin', 'is_staff' => true];
        $first = $this->postJson('/api/messaging', $payload)->assertCreated()->assertJsonPath('message.sender_name', $client->name)->assertJsonPath('message.is_staff', false)->json();
        $this->postJson('/api/messaging', $payload)->assertOk()->assertJsonPath('message.id', $first['message']['id']);
        $payload['body'] = 'Autre contenu';
        $this->postJson('/api/messaging', $payload)->assertConflict();
        $this->assertDatabaseCount('conversation_messages', 1);
        $this->postJson('/api/messaging', ['body' => '  ', 'client_nonce' => (string) Str::uuid()])->assertUnprocessable();
        $this->postJson('/api/messaging', ['body' => str_repeat('x', 5001), 'client_nonce' => (string) Str::uuid()])->assertUnprocessable();
    }

    public function test_unread_markers_are_independent_per_admin_and_monotonic(): void
    {
        $client = User::factory()->create(['name' => 'Client Messagerie']);
        $first = $this->send($client);
        $id = $first['conversation']['id'];
        $second = $this->send($client, $id);
        $admin = $this->staff();
        Sanctum::actingAs($admin);
        $this->getJson('/api/admin/conversations?unread=1&search=Messagerie')->assertOk()->assertJsonPath('data.0.unread_count', 2);
        $this->postJson("/api/messaging/$id/read", ['message_id' => $second['message']['id']])->assertOk();
        $this->postJson("/api/messaging/$id/read", ['message_id' => $first['message']['id']])->assertOk()->assertJsonPath('last_read_message_id', $second['message']['id']);
        $this->getJson('/api/admin/conversations?unread=1')->assertOk()->assertJsonCount(0, 'data');
        Sanctum::actingAs($this->staff());
        $this->getJson('/api/admin/conversations?unread=1')->assertOk()->assertJsonPath('data.0.unread_count', 2);
        Sanctum::actingAs($client);
        $this->getJson("/api/messaging/$id/messages")->assertOk()->assertJsonPath('peer_read_id', $second['message']['id']);
        $foreign = $this->send(User::factory()->create());
        Sanctum::actingAs($admin);
        $this->postJson("/api/messaging/$id/read", ['message_id' => $foreign['message']['id']])->assertUnprocessable();
    }

    public function test_history_cursor_returns_older_and_newer_messages_without_overlap(): void
    {
        $client = User::factory()->create();
        $conversation = Conversation::create(['user_id' => $client->id]);
        for ($i = 1; $i <= 65; $i++) {
            ConversationMessage::create(['conversation_id' => $conversation->id, 'sender_id' => $client->id, 'sender_name' => $client->name, 'is_staff' => false, 'body' => "Message $i", 'client_nonce' => (string) Str::uuid()]);
        }
        Sanctum::actingAs($client);
        $url = '/api/messaging/'.$conversation->id.'/messages';
        $latest = $this->getJson($url)->assertOk()->assertJsonCount(50, 'messages')->assertJsonPath('has_older', true)->json();
        $this->getJson($url.'?before='.$latest['messages'][0]['id'])->assertOk()->assertJsonCount(15, 'messages')->assertJsonPath('has_older', false);
        $this->getJson($url.'?after='.$latest['messages'][49]['id'])->assertOk()->assertJsonCount(0, 'messages');
        $this->getJson($url.'?after=1&before=65')->assertUnprocessable();
    }
}
