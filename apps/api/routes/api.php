<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Backoffice\CampaignPlayerController;
use App\Http\Controllers\Api\V1\Backoffice\CharacterController as BackofficeCharacterController;
use App\Http\Controllers\Api\V1\Backoffice\ClassController as BackofficeClassController;
use App\Http\Controllers\Api\V1\Backoffice\RaceController as BackofficeRaceController;
use App\Http\Controllers\Api\V1\Backoffice\MonsterController as BackofficeMonsterController;
use App\Http\Controllers\Api\V1\Backoffice\SpellController as BackofficeSpellController;
use App\Http\Controllers\Api\V1\Player\CampaignController as PlayerCampaignController;
use App\Http\Controllers\Api\V1\Player\CharacterController as PlayerCharacterController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API V1 Routes
|--------------------------------------------------------------------------
|
| Route structure based on CLAUDE.md:
| /auth/*       — Login, register, logout, me
| /player/*     — Player endpoints (role: player)
| /backoffice/* — DM/Owner endpoints (role: owner + dm)
| /display/*    — Display client endpoints
| /public/*     — Public/landing endpoints
|
*/

Route::prefix('v1')->group(function () {

    // =========================================================================
    // Auth routes (public)
    // =========================================================================
    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);
        Route::post('resend-verification', [AuthController::class, 'resendVerification']);

        // Email verification
        Route::get('email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
            ->middleware(['signed', 'throttle:6,1'])
            ->name('verification.verify');
    });

    // =========================================================================
    // Public routes (landing page data)
    // =========================================================================
    Route::prefix('public')->group(function () {
        // Placeholder for landing page data if needed
    });

    // =========================================================================
    // Protected routes (any authenticated user)
    // =========================================================================
    Route::middleware('auth:api')->group(function () {

        // Auth (protected)
        Route::prefix('auth')->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::post('refresh', [AuthController::class, 'refresh']);
            Route::get('me', [AuthController::class, 'me']);
        });

        // =====================================================================
        // Player routes (role: player, dm, owner)
        // =====================================================================
        Route::prefix('player')->group(function () {
            // Campaigns
            Route::get('campaigns', [PlayerCampaignController::class, 'index']);
            Route::get('campaigns/{campaign}', [PlayerCampaignController::class, 'show']);

            // Characters
            Route::get('campaigns/{campaign}/characters', [PlayerCharacterController::class, 'index']);
            Route::get('campaigns/{campaign}/characters/active', [PlayerCharacterController::class, 'active']);
            Route::get('campaigns/{campaign}/characters/creation-data', [PlayerCharacterController::class, 'creationData']);
            Route::post('campaigns/{campaign}/characters', [PlayerCharacterController::class, 'store']);
            Route::get('characters/{character}', [PlayerCharacterController::class, 'show']);
            Route::patch('characters/{character}', [PlayerCharacterController::class, 'update']);
            Route::post('characters/{character}/activate', [PlayerCharacterController::class, 'activate']);
            Route::delete('characters/{character}', [PlayerCharacterController::class, 'destroy']);

            // Level up
            Route::get('characters/{character}/level-up/check', [PlayerCharacterController::class, 'checkLevelUp']);
            Route::get('characters/{character}/level-up/options', [PlayerCharacterController::class, 'levelUpOptions']);
            Route::post('characters/{character}/level-up', [PlayerCharacterController::class, 'levelUp']);

            // Spells (read-only)
            // Route::get('spells', [PlayerSpellController::class, 'index']);
            // Route::get('items', [PlayerItemController::class, 'index']);
        });

        // =====================================================================
        // Backoffice routes (role: owner + dm)
        // =====================================================================
        Route::middleware('backoffice')->prefix('backoffice')->group(function () {

            // Dashboard
            // Route::get('dashboard', [DashboardController::class, 'index']);

            // -----------------------------------------------------------------
            // Rule Systems (системы правил)
            // -----------------------------------------------------------------
            // Route::apiResource('rule-systems', RuleSystemController::class);

            // -----------------------------------------------------------------
            // Settings (сеттинги / миры)
            // -----------------------------------------------------------------
            // Route::apiResource('settings', SettingController::class);
            // Route::prefix('settings/{setting}')->group(function () {
            //     Route::get('spells', [SettingContentController::class, 'spells']);
            //     Route::post('spells/{spell}/attach', [SettingContentController::class, 'attachSpell']);
            //     Route::delete('spells/{spell}/detach', [SettingContentController::class, 'detachSpell']);
            //     // Similar for monsters, items, races, classes
            // });

            // -----------------------------------------------------------------
            // Campaigns
            // -----------------------------------------------------------------
            // Route::apiResource('campaigns', CampaignController::class);
            Route::prefix('campaigns/{campaign}')->group(function () {
                // Players management
                Route::get('players', [CampaignPlayerController::class, 'index']);
                Route::get('players/available', [CampaignPlayerController::class, 'available']);
                Route::post('players/{user}/invite', [CampaignPlayerController::class, 'invite']);
                Route::delete('players/{user}', [CampaignPlayerController::class, 'remove']);

                // Characters management (DM can view all, activate/deactivate, kill)
                Route::get('characters', [BackofficeCharacterController::class, 'index']);
                Route::post('characters/{character}/activate', [BackofficeCharacterController::class, 'activate']);
                Route::post('characters/{character}/deactivate', [BackofficeCharacterController::class, 'deactivate']);
                Route::post('characters/{character}/kill', [BackofficeCharacterController::class, 'kill']);

                // XP management (award to multiple characters)
                Route::post('characters/award-xp', [BackofficeCharacterController::class, 'awardXp']);

                // TODO: Sessions, encounters, npcs, notes, random-tables
                // Route::apiResource('sessions', SessionController::class);
                // Route::apiResource('sessions/{session}/scenes', SceneController::class);
                // Route::apiResource('encounters', EncounterController::class);
                // Route::apiResource('npcs', NpcController::class);
                // Route::apiResource('notes', NoteController::class);
                // Route::apiResource('random-tables', RandomTableController::class);
            });

            // -----------------------------------------------------------------
            // Character Management (DM operations on individual characters)
            // -----------------------------------------------------------------
            Route::prefix('characters/{character}')->group(function () {
                Route::post('modify-hp', [BackofficeCharacterController::class, 'modifyHp']);
                Route::post('modify-conditions', [BackofficeCharacterController::class, 'modifyConditions']);
                Route::post('custom-rules', [BackofficeCharacterController::class, 'customRules']);
                Route::post('give-item', [BackofficeCharacterController::class, 'giveItem']);
                Route::post('modify-currency', [BackofficeCharacterController::class, 'modifyCurrency']);
                Route::post('toggle-inspiration', [BackofficeCharacterController::class, 'toggleInspiration']);
            });

            // -----------------------------------------------------------------
            // Global Content (classes, races, monsters, spells, items)
            // -----------------------------------------------------------------
            // Character Classes
            Route::get('classes/settings', [BackofficeClassController::class, 'settings']);
            Route::apiResource('classes', BackofficeClassController::class)->parameters(['classes' => 'class']);

            // Races
            Route::get('races/settings', [BackofficeRaceController::class, 'settings']);
            Route::get('races/parents', [BackofficeRaceController::class, 'parents']);
            Route::apiResource('races', BackofficeRaceController::class);

            // Monsters
            Route::get('monsters/settings', [BackofficeMonsterController::class, 'settings']);
            Route::get('monsters/types', [BackofficeMonsterController::class, 'types']);
            Route::apiResource('monsters', BackofficeMonsterController::class);

            // Spells
            Route::get('spells/settings', [BackofficeSpellController::class, 'settings']);
            Route::get('spells/schools', [BackofficeSpellController::class, 'schools']);
            Route::get('spells/classes', [BackofficeSpellController::class, 'classes']);
            Route::apiResource('spells', BackofficeSpellController::class);

            // Route::apiResource('items', ItemController::class);

            // -----------------------------------------------------------------
            // Battle Tracker
            // -----------------------------------------------------------------
            // Route::prefix('battles')->group(function () {
            //     Route::post('start/{encounter}', [BattleController::class, 'start']);
            //     Route::post('{battle}/next-turn', [BattleController::class, 'nextTurn']);
            //     Route::post('{battle}/damage/{participant}', [BattleController::class, 'damage']);
            //     Route::post('{battle}/end', [BattleController::class, 'end']);
            // });

            // -----------------------------------------------------------------
            // Media upload
            // -----------------------------------------------------------------
            // Route::post('media/upload', [MediaController::class, 'upload']);

            // -----------------------------------------------------------------
            // Users management (owner only)
            // -----------------------------------------------------------------
            // Route::middleware('role:owner')->prefix('users')->group(function () {
            //     Route::get('/', [UserController::class, 'index']);
            //     Route::patch('{user}/activate', [UserController::class, 'activate']);
            //     Route::patch('{user}/deactivate', [UserController::class, 'deactivate']);
            //     Route::patch('{user}/make-dm', [UserController::class, 'makeDm']);
            //     Route::patch('{user}/revoke-dm', [UserController::class, 'revokeDm']);
            // });
        });

        // =====================================================================
        // Display routes (for TV/monitor client)
        // =====================================================================
        Route::prefix('display')->group(function () {
            // Route::get('current-scene/{campaign}', [DisplayController::class, 'currentScene']);
            // Route::post('join/{campaign}', [DisplayController::class, 'join']);
        });
    });
});
