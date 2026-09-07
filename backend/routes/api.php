<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\ClientRequestController;
use App\Http\Controllers\Api\MessagingController;
use App\Http\Controllers\Api\PasswordController;
use App\Http\Controllers\Api\QuoteRequestController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\SiteController;
use App\Http\Middleware\RequireAdmin;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes publiques
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('/forgot-password', [PasswordController::class, 'forgot'])->middleware('throttle:3,1');
Route::post('/reset-password', [PasswordController::class, 'reset'])->middleware('throttle:5,1');
Route::get('/site', [SiteController::class, 'show']);
Route::post('/chat', [ChatController::class, 'reply'])->middleware('throttle:10,1');

Route::get('/services', [ServiceController::class, 'index']);
Route::get('/services/{service:slug}', [ServiceController::class, 'show']);

/*
|--------------------------------------------------------------------------
| Routes protégées — nécessitent un compte particulier ou entreprise
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/messaging', [MessagingController::class, 'own']);
    Route::post('/messaging', [MessagingController::class, 'storeOwn'])->middleware('throttle:30,1');
    Route::get('/messaging/{conversation}/messages', [MessagingController::class, 'messages'])->whereNumber('conversation');
    Route::post('/messaging/{conversation}/messages', [MessagingController::class, 'store'])->whereNumber('conversation')->middleware('throttle:30,1');
    Route::post('/messaging/{conversation}/read', [MessagingController::class, 'read'])->whereNumber('conversation');
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Un devis (audit, développement, conseil...) ne peut être demandé
    // qu'après connexion — c'est la règle imposée côté produit.
    Route::get('/quote-requests', [QuoteRequestController::class, 'index']);
    Route::post('/quote-requests', [QuoteRequestController::class, 'store'])->middleware('throttle:10,1');
    Route::get('/quote-requests/{quoteRequest}', [QuoteRequestController::class, 'show']);
    Route::get('/client-requests', [ClientRequestController::class, 'index']);
    Route::post('/client-requests', [ClientRequestController::class, 'store'])->middleware('throttle:10,1');
    Route::patch('/client-requests/{clientRequest}/cancel', [ClientRequestController::class, 'cancel']);
    Route::prefix('admin')->middleware(RequireAdmin::class)->group(function () {
        Route::get('/conversations', [MessagingController::class, 'inbox']);
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/requests', [AdminController::class, 'index']);
        Route::patch('/requests/{kind}/{id}', [AdminController::class, 'update']);
        Route::put('/site', [SiteController::class, 'update']);
        Route::put('/services/{service}', [AdminController::class, 'service']);
    });
});
