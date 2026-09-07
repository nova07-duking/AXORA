<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientRequest extends Model
{
    protected $attributes = ['status' => 'nouveau'];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['preferred_at' => 'datetime'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
