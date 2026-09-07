<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use HasFactory;

    protected $fillable = ['slug', 'name', 'tagline', 'description', 'deliverables'];

    protected function casts(): array
    {
        return ['deliverables' => 'array'];
    }

    public function quoteRequests()
    {
        return $this->hasMany(QuoteRequest::class);
    }
}
