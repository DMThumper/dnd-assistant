<?php

namespace App\Http\Controllers\Api\V1\Player;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CampaignController extends Controller
{
    /**
     * Get campaigns the current user has access to as a player
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Get campaigns where user is a player (not DM)
        $campaigns = $user->campaigns()
            ->with(['setting', 'owner'])
            ->where('status', Campaign::STATUS_ACTIVE)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'campaigns' => $campaigns->map(fn (Campaign $campaign) => $campaign->formatForPlayerApi($user)),
            ],
        ]);
    }

    /**
     * Get a single campaign
     */
    public function show(Request $request, Campaign $campaign): JsonResponse
    {
        $user = $request->user();

        // Check if user is a player in this campaign
        if (!$campaign->hasPlayer($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Вы не являетесь участником этой кампании',
            ], 403);
        }

        $campaign->load(['setting', 'owner']);

        return response()->json([
            'success' => true,
            'data' => [
                'campaign' => $campaign->formatForPlayerApi($user),
            ],
        ]);
    }

    /**
     * Get live session status for a campaign
     */
    public function liveSession(Request $request, Campaign $campaign): JsonResponse
    {
        $user = $request->user();

        // Check if user is a player in this campaign
        if (!$campaign->hasPlayer($user) && $campaign->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Вы не являетесь участником этой кампании',
            ], 403);
        }

        $liveSession = $campaign->getActiveLiveSession();

        return response()->json([
            'success' => true,
            'data' => [
                'has_active_session' => $liveSession !== null,
                'live_session' => $liveSession?->formatForApi(),
            ],
        ]);
    }
}
