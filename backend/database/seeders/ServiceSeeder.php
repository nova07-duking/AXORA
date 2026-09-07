<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            [
                'slug' => 'cybersecurite',
                'name' => 'Cybersécurité',
                'tagline' => 'Protéger vos systèmes critiques.',
                'description' => "Audit, tests d'intrusion et mise en conformité (ISO 27001, PCI DSS) pour sécuriser vos infrastructures et vos données sensibles.",
            ],
            [
                'slug' => 'data',
                'name' => 'Data',
                'tagline' => 'Transformer la donnée en décision.',
                'description' => 'Collecte, gouvernance, hébergement et valorisation de vos données : tableaux de bord décisionnels et data engineering.',
            ],
            [
                'slug' => 'dev',
                'name' => 'Développement web & mobile',
                'tagline' => 'Des outils pensés pour vos usages.',
                'description' => 'Applications web et mobiles sur mesure, back-office métier, maintenance évolutive.',
            ],
            [
                'slug' => 'ia',
                'name' => 'Intelligence artificielle',
                'tagline' => "L'IA là où elle change vraiment le travail.",
                'description' => "Intégration de modèles d'IA dans vos systèmes existants : chatbots, scoring, détection de fraude, automatisation.",
            ],
            [
                'slug' => 'iot',
                'name' => 'Internet des objets (IoT)',
                'tagline' => 'Connecter le physique au numérique.',
                'description' => 'Déploiement de capteurs connectés et de plateformes de supervision pour piloter vos infrastructures en temps réel.',
            ],
        ];

        foreach ($services as $service) {
            Service::updateOrCreate(['slug' => $service['slug']], $service);
        }
    }
}
