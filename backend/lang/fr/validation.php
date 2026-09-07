<?php

return [
    'accepted' => 'Vous devez accepter :attribute.',
    'required' => 'Le champ :attribute est obligatoire.',
    'required_if' => 'Le champ :attribute est obligatoire dans ce cas.',
    'present' => 'Le champ :attribute doit être présent.',
    'string' => 'Le champ :attribute doit être un texte.',
    'array' => 'Le champ :attribute doit être une liste valide.',
    'email' => 'Veuillez saisir une adresse email valide.',
    'unique' => 'Cette valeur pour :attribute est déjà utilisée.',
    'confirmed' => 'La confirmation de :attribute ne correspond pas.',
    'in' => 'La valeur choisie pour :attribute est invalide.',
    'exists' => 'La valeur choisie pour :attribute est introuvable.',
    'url' => 'Le champ :attribute doit être une adresse HTTPS valide.',
    'regex' => 'Le format de :attribute est invalide.',
    'date_format' => 'Le format de :attribute est invalide.',
    'after' => 'Le champ :attribute doit correspondre à une date future.',
    'before' => 'Le champ :attribute doit correspondre à une date dans les six prochains mois.',
    'min' => ['string' => 'Le champ :attribute doit contenir au moins :min caractères.', 'array' => 'Le champ :attribute doit contenir au moins :min élément(s).'],
    'max' => ['string' => 'Le champ :attribute ne doit pas dépasser :max caractères.', 'array' => 'Le champ :attribute ne doit pas dépasser :max éléments.'],
    'attributes' => ['name'=>'nom', 'email'=>'email', 'password'=>'mot de passe', 'company_name'=>'raison sociale', 'phone'=>'téléphone', 'rccm'=>'RCCM', 'service_id'=>'service', 'need_type'=>'nature de la demande', 'message'=>'description', 'budget_estimatif'=>'budget estimatif', 'subject'=>'sujet', 'audit_type'=>'périmètre de l’audit', 'organization_size'=>'taille de l’organisation', 'preferred_at'=>'date du rendez-vous', 'meeting_mode'=>'format du rendez-vous', 'reply'=>'réponse', 'maps_url'=>'lien Google Maps', 'consent'=>'le traitement des messages par l’IA', 'team.*.name'=>'nom du membre', 'team.*.role'=>'rôle du membre', 'team.*.photo_url'=>'photo du membre'],
];
