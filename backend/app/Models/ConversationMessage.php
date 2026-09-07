<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConversationMessage extends Model
{
    protected $fillable = ['conversation_id', 'sender_id', 'sender_name', 'is_staff', 'body', 'client_nonce'];

    protected $hidden = ['client_nonce'];

    protected function casts(): array
    {
        return ['is_staff' => 'boolean'];
    }

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }
}
