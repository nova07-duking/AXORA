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
                'deliverables' => ['Évaluation des risques et des vulnérabilités', 'Tests de sécurité sur périmètre autorisé', 'Plan de remédiation et accompagnement'],
            ],
            [
                'slug' => 'data',
                'name' => 'Data',
                'tagline' => 'Transformer la donnée en décision.',
                'description' => 'Collecte, gouvernance, hébergement et valorisation de vos données : tableaux de bord décisionnels et data engineering.',
                'deliverables' => ['Organisation et fiabilisation des données', 'Pipelines de données et tableaux de bord', 'Gouvernance et aide à la décision'],
            ],
            [
                'slug' => 'dev',
                'name' => 'Développement web & mobile',
                'tagline' => 'Des outils pensés pour vos usages.',
                'description' => 'Applications web et mobiles sur mesure, back-office métier, maintenance évolutive.',
                'deliverables' => ['Sites web et applications métier', 'Applications mobiles et intégrations API', 'Maintenance et évolutions fonctionnelles'],
            ],
            [
                'slug' => 'ia',
                'name' => 'Intelligence artificielle',
                'tagline' => "L'IA là où elle change vraiment le travail.",
                'description' => "Intégration de modèles d'IA dans vos systèmes existants : chatbots, scoring, détection de fraude, automatisation.",
                'deliverables' => ['Assistants conversationnels adaptés à votre activité', 'Automatisation des tâches documentaires', 'Intégration et évaluation de modèles IA'],
            ],
            [
                'slug' => 'iot',
                'name' => 'Internet des objets (IoT)',
                'tagline' => 'Connecter le physique au numérique.',
                'description' => 'Déploiement de capteurs connectés et de plateformes de supervision pour piloter vos infrastructures en temps réel.',
                'deliverables' => ['Capteurs et remontée de données terrain', 'Plateformes de supervision', 'Alertes et suivi des équipements'],
            ],
        ];

        foreach ($services as $service) {
            Service::updateOrCreate(['slug' => $service['slug']], $service);
        }
    }
}
