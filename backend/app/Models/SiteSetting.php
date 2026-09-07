<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    protected $fillable = ['content'];

    protected function casts(): array
    {
        return ['content' => 'array'];
    }

    public static function publicContent(): array
    {
        $stored = static::query()->orderBy('id')->first()?->content ?? [];
        $content = array_replace(config('axora'), $stored);
        // Merge field maps, but replace lists such as method_steps in full.
        foreach (config('axora.pages') as $page => $defaults) {
            $content['pages'][$page] = array_replace($defaults, $stored['pages'][$page] ?? []);
        }

        return $content;
    }
}
