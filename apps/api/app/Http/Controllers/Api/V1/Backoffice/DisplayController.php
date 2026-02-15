<?php

namespace App\Http\Controllers\Api\V1\Backoffice;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\DisplayToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DisplayController extends Controller
{
    /**
     * Get all displays for current DM
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $displays = DisplayToken::forUser($user)
            ->paired()
            ->with('campaign')
            ->orderByDesc('last_heartbeat_at')
            ->get()
            ->map(function (DisplayToken $display) {
                return [
                    'id' => $display->id,
                    'name' => $display->name,
                    'status' => $display->status,
                    'is_alive' => $display->isAlive(),
                    'campaign' => $display->campaign ? [
                        'id' => $display->campaign->id,
                        'name' => $display->campaign->getTranslation('name', 'ru'),
                        'slug' => $display->campaign->slug,
                    ] : null,
                    'paired_at' => $display->paired_at?->toISOString(),
                    'last_heartbeat_at' => $display->last_heartbeat_at?->toISOString(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $displays,
        ]);
    }

    /**
     * Pair a display by code
     */
    public function pair(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|size:4',
            'campaign_id' => 'required|exists:campaigns,id',
            'name' => 'nullable|string|max:100',
        ]);

        $user = $request->user();

        // Find display by code
        $display = DisplayToken::findByCode($validated['code']);

        if (!$display) {
            return response()->json([
                'success' => false,
                'message' => 'Неверный код или код истёк',
            ], 422);
        }

        // Verify campaign belongs to user
        $campaign = Campaign::find($validated['campaign_id']);

        if (!$campaign || $campaign->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Кампания не найдена',
            ], 404);
        }

        // Pair display
        $display->pair($campaign, $user, $validated['name'] ?? null);

        // TODO: Broadcast to display that it's paired
        // broadcast(new DisplayPaired($display))->toOthers();

        return response()->json([
            'success' => true,
            'message' => 'Дисплей подключён',
            'data' => [
                'id' => $display->id,
                'name' => $display->name,
                'is_alive' => true,
                'campaign' => [
                    'id' => $campaign->id,
                    'name' => $campaign->getTranslation('name', 'ru'),
                    'slug' => $campaign->slug,
                ],
            ],
        ]);
    }

    /**
     * Disconnect a display
     */
    public function disconnect(Request $request, DisplayToken $display): JsonResponse
    {
        $user = $request->user();

        // Verify display belongs to user
        if ($display->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Дисплей не найден',
            ], 404);
        }

        // TODO: Broadcast to display that it's disconnected
        // broadcast(new DisplayDisconnected($display))->toOthers();

        $display->disconnect();

        return response()->json([
            'success' => true,
            'message' => 'Дисплей отключён',
        ]);
    }

    /**
     * Send command to display (change scene, music, etc.)
     */
    public function sendCommand(Request $request, DisplayToken $display): JsonResponse
    {
        $user = $request->user();

        // Verify display belongs to user
        if ($display->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Дисплей не найден',
            ], 404);
        }

        if (!$display->isPaired() || !$display->isAlive()) {
            return response()->json([
                'success' => false,
                'message' => 'Дисплей не подключён или не отвечает',
            ], 422);
        }

        $validated = $request->validate([
            'command' => 'required|string|in:scene,music,text,blackout,choice',
            'payload' => 'nullable|array',
        ]);

        // TODO: Broadcast command to display via WebSocket
        // broadcast(new DisplayCommand($display, $validated['command'], $validated['payload'] ?? []))->toOthers();

        return response()->json([
            'success' => true,
            'message' => 'Команда отправлена',
        ]);
    }

    /**
     * Get displays for a specific campaign
     */
    public function forCampaign(Request $request, Campaign $campaign): JsonResponse
    {
        $user = $request->user();

        // Verify campaign belongs to user
        if ($campaign->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Кампания не найдена',
            ], 404);
        }

        $displays = DisplayToken::forCampaign($campaign)
            ->paired()
            ->orderByDesc('last_heartbeat_at')
            ->get()
            ->map(function (DisplayToken $display) {
                return [
                    'id' => $display->id,
                    'name' => $display->name,
                    'is_alive' => $display->isAlive(),
                    'last_heartbeat_at' => $display->last_heartbeat_at?->toISOString(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $displays,
        ]);
    }
}
