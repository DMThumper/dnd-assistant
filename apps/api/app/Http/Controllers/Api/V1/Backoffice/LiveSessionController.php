<?php

namespace App\Http\Controllers\Api\V1\Backoffice;

use App\Events\LiveSessionEnded;
use App\Events\LiveSessionStarted;
use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\LiveSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LiveSessionController extends Controller
{
    /**
     * Get active session status for a campaign
     */
    public function status(Campaign $campaign): JsonResponse
    {
        $liveSession = $campaign->getActiveLiveSession();

        return response()->json([
            'success' => true,
            'data' => [
                'has_active_session' => $liveSession !== null,
                'live_session' => $liveSession?->formatForApi(),
            ],
        ]);
    }

    /**
     * Start a new live session
     */
    public function start(Request $request, Campaign $campaign): JsonResponse
    {
        $user = $request->user();

        // Check if user is the campaign owner (DM)
        if ($campaign->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Только DM кампании может запустить сессию',
            ], 403);
        }

        // Check if there's already an active session
        if ($campaign->hasActiveLiveSession()) {
            return response()->json([
                'success' => false,
                'message' => 'Активная сессия уже запущена',
                'data' => [
                    'live_session' => $campaign->getActiveLiveSession()?->formatForApi(),
                ],
            ], 409);
        }

        $validated = $request->validate([
            'game_session_id' => 'nullable|exists:game_sessions,id',
        ]);

        // Create new live session
        $liveSession = LiveSession::create([
            'campaign_id' => $campaign->id,
            'game_session_id' => $validated['game_session_id'] ?? null,
            'started_by' => $user->id,
            'started_at' => now(),
            'is_active' => true,
            'participants' => [],
        ]);

        $liveSession->load('startedBy');

        // Broadcast to all campaign members
        broadcast(new LiveSessionStarted($liveSession));

        return response()->json([
            'success' => true,
            'data' => $liveSession->formatForApi(),
            'message' => 'Живая сессия запущена',
        ], 201);
    }

    /**
     * Stop the active live session
     */
    public function stop(Request $request, Campaign $campaign): JsonResponse
    {
        $user = $request->user();

        // Check if user is the campaign owner (DM)
        if ($campaign->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Только DM кампании может остановить сессию',
            ], 403);
        }

        $liveSession = $campaign->getActiveLiveSession();

        if (!$liveSession) {
            return response()->json([
                'success' => false,
                'message' => 'Нет активной сессии',
            ], 404);
        }

        // End the session
        $liveSession->end();
        $liveSession->load('startedBy');

        // Broadcast to all campaign members
        broadcast(new LiveSessionEnded($liveSession));

        return response()->json([
            'success' => true,
            'data' => $liveSession->formatForApi(),
            'message' => 'Сессия завершена',
        ]);
    }

    /**
     * Get session history for a campaign
     */
    public function history(Campaign $campaign): JsonResponse
    {
        $sessions = $campaign->liveSessions()
            ->with('startedBy')
            ->orderByDesc('started_at')
            ->limit(20)
            ->get()
            ->map(fn (LiveSession $session) => $session->formatForApi());

        return response()->json([
            'success' => true,
            'data' => $sessions,
        ]);
    }
}
