<?php

namespace Tests\Feature;

use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SiteContentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $user = User::factory()->create();
        $user->forceFill(['is_admin' => true])->save();
        Sanctum::actingAs($user);
    }

    public function test_partial_page_update_keeps_other_saved_content_and_required_defaults(): void
    {
        $content = config('axora');
        $content['pages']['contact']['title'] = 'Contact personnalisé';
        SiteSetting::create(['content' => $content]);
        $content['pages'] = ['home' => ['hero_title' => 'Nouveau titre']];
        $this->putJson('/api/admin/site', $content)->assertOk()
            ->assertJsonPath('pages.home.hero_title', 'Nouveau titre')
            ->assertJsonPath('pages.contact.title', 'Contact personnalisé')
            ->assertJsonCount(4, 'pages.home.method_steps');
        $this->getJson('/api/site')->assertJsonCount(4, 'pages.home.method_steps');
    }

    public function test_legacy_partial_content_is_completed_on_read(): void
    {
        SiteSetting::create(['content' => ['pages' => ['home' => ['hero_title' => 'Titre conservé']]]]);
        $this->getJson('/api/site')->assertOk()->assertJsonPath('pages.home.hero_title', 'Titre conservé')
            ->assertJsonCount(4, 'pages.home.method_steps')->assertJsonPath('pages.contact.title', config('axora.pages.contact.title'));
    }

    public function test_page_text_cannot_be_null_and_unknown_page_keys_are_rejected(): void
    {
        $content = config('axora');
        $content['pages'] = ['home' => ['hero_title' => null]];
        $this->putJson('/api/admin/site', $content)->assertUnprocessable()->assertJsonValidationErrors('pages.home.hero_title');
        $content['pages'] = ['home' => ['unexpected' => 'arbitrary value']];
        $this->putJson('/api/admin/site', $content)->assertUnprocessable();
    }

    public function test_method_steps_are_replaced_as_a_list_without_restoring_removed_items(): void
    {
        $content = config('axora');
        $content['pages']['home']['method_steps'] = [['number' => '01', 'title' => 'Diagnostic', 'text' => 'Comprendre le besoin.']];
        $this->putJson('/api/admin/site', $content)->assertOk()->assertJsonCount(1, 'pages.home.method_steps');
        $this->getJson('/api/site')->assertJsonCount(1, 'pages.home.method_steps');
    }
}
