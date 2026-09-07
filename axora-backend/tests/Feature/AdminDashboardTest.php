<?php

namespace Tests\Feature;

use App\Models\ClientRequest;
use App\Models\QuoteRequest;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    private function signInAdmin(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        Sanctum::actingAs($admin);
    }

    public function test_status_change_keeps_existing_reply_and_meeting_link_unless_explicitly_cleared(): void
    {
        $client = User::factory()->create();
        $appointment = ClientRequest::create([
            'user_id' => $client->id, 'kind' => 'appointment', 'subject' => 'Premier échange',
            'message' => 'Discuter du projet.', 'preferred_at' => now()->addDay(),
            'reply' => 'Voici les modalités de notre rendez-vous.',
            'meeting_url' => 'https://example.test/reunion',
        ]);
        $this->signInAdmin();
        $endpoint = '/api/admin/requests/appointment/'.$appointment->id;
        $this->patchJson($endpoint, ['status' => 'confirme'])->assertOk()
            ->assertJsonPath('reply', 'Voici les modalités de notre rendez-vous.')
            ->assertJsonPath('meeting_url', 'https://example.test/reunion');
        $this->patchJson($endpoint, ['status' => 'confirme', 'reply' => null, 'meeting_url' => null])->assertOk()
            ->assertJsonPath('reply', null)->assertJsonPath('meeting_url', null);
    }

    public function test_dashboard_is_reserved_to_admins(): void
    {
        $this->getJson('/api/admin/dashboard')->assertUnauthorized();
        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/admin/dashboard')->assertForbidden();
    }

    public function test_dashboard_counts_all_records_and_only_future_confirmed_appointments(): void
    {
        $client = User::factory()->create();
        $service = Service::create(['slug' => 'dev', 'name' => 'Développement', 'tagline' => 'Applications', 'description' => 'Applications métier']);
        QuoteRequest::create(['user_id' => $client->id, 'service_id' => $service->id, 'need_type' => 'developpement', 'message' => 'Un site web', 'status' => 'nouveau']);
        ClientRequest::create(['user_id' => $client->id, 'kind' => 'audit', 'subject' => 'Audit', 'message' => 'Audit sécurité', 'status' => 'en_cours']);
        foreach ([['confirme', now()->addDay()], ['confirme', now()->subDay()], ['nouveau', now()->addDays(2)], ['annule', now()->addDays(3)]] as [$status,$date]) {
            ClientRequest::create(['user_id' => $client->id, 'kind' => 'appointment', 'subject' => 'Échange', 'message' => 'Parlons du projet', 'status' => $status, 'preferred_at' => $date]);
        }
        $this->signInAdmin();
        $this->getJson('/api/admin/dashboard')->assertOk()->assertJsonPath('totals.quote', 1)->assertJsonPath('totals.audit', 1)->assertJsonPath('totals.appointment', 4)
            ->assertJsonPath('pending', 2)->assertJsonPath('active', 1)->assertJsonPath('clients', 1)->assertJsonPath('upcoming_count', 1)->assertJsonCount(1, 'upcoming')->assertJsonCount(6, 'recent');
    }

    public function test_search_matches_customer_email_subject_and_reference_and_respects_status(): void
    {
        $client = User::factory()->create(['name' => 'Marie Exemple', 'email' => 'marie@example.test', 'company_name' => 'Entreprise Azur']);
        $first = ClientRequest::create(['user_id' => $client->id, 'kind' => 'audit', 'subject' => 'Diagnostic réseau', 'message' => 'Infrastructure interne', 'status' => 'nouveau']);
        ClientRequest::create(['user_id' => $client->id, 'kind' => 'audit', 'subject' => 'Diagnostic terminé', 'message' => 'Réseau', 'status' => 'traite']);
        ClientRequest::create(['user_id' => $client->id, 'kind' => 'appointment', 'subject' => 'Diagnostic réseau', 'message' => 'Rendez-vous', 'status' => 'nouveau']);
        $this->signInAdmin();
        foreach (['marie@example.test', 'Azur', 'Diagnostic réseau', (string) $first->id] as $search) {
            $this->getJson('/api/admin/requests?'.http_build_query(['kind' => 'audit', 'status' => 'nouveau', 'search' => $search]))
                ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $first->id);
        }
        $this->getJson('/api/admin/requests?kind=audit&search=introuvable')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/admin/requests?kind=audit&sort=invalid')->assertUnprocessable();
    }

    public function test_quote_search_and_ordering_are_applied_before_pagination(): void
    {
        $client = User::factory()->create();
        $service = Service::create(['slug' => 'dev', 'name' => 'Développement', 'tagline' => 'Applications', 'description' => 'Applications métier']);
        $ids = [];
        for ($i = 0; $i < 17; $i++) {
            $ids[] = QuoteRequest::create(['user_id' => $client->id, 'service_id' => $service->id, 'need_type' => 'developpement', 'message' => 'Un projet web', 'created_at' => now()->subDays(17 - $i)])->id;
        }
        $this->signInAdmin();
        $this->getJson('/api/admin/requests?'.http_build_query(['kind' => 'quote', 'search' => 'Développement', 'sort' => 'oldest', 'page' => 1]))->assertOk()->assertJsonPath('total', 17)->assertJsonPath('data.0.id', $ids[0])->assertJsonCount(15, 'data');
        $this->getJson('/api/admin/requests?kind=quote&sort=oldest&page=2')->assertOk()->assertJsonPath('data.0.id', $ids[15])->assertJsonCount(2, 'data');
        $this->getJson('/api/admin/requests?kind=quote&sort=newest')->assertOk()->assertJsonPath('data.0.id', $ids[16]);
    }
}
