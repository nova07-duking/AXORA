<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;

class ServiceController extends Controller
{
    /**
     * Liste publique des 5 pôles de services AXORA — consommée par le site
     * vitrine sans authentification.
     */
    public function index()
    {
        return response()->json(Service::orderBy('id')->get());
    }

    public function show(Service $service)
    {
        return response()->json($service);
    }
}
