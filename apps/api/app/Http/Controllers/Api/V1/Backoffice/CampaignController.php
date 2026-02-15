<?php

namespace App\Http\Controllers\Api\V1\Backoffice;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CampaignController extends Controller
{
    /**
     * Get all campaigns owned by the current DM
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Get campaigns owned by this user (DM)
        $campaigns = Campaign::where('user_id', $user->id)
            ->with(['setting', 'owner'])
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (Campaign $campaign) => $campaign->formatForApi());

        return response()->json([
            'success' => true,
            'data' => $campaigns,
        ]);
    }

    /**
     * Get a single campaign
     */
    public function show(Campaign $campaign): JsonResponse
    {
        $campaign->load(['setting', 'owner']);

        return response()->json([
            'success' => true,
            'data' => $campaign->formatForApi(),
        ]);
    }

    /**
     * Create a new campaign
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'setting_id' => 'required|exists:settings,id',
            'status' => 'nullable|in:active,paused,completed',
            'settings' => 'nullable|array',
        ]);

        $campaign = Campaign::create([
            'name' => ['ru' => $validated['name']],
            'description' => isset($validated['description']) ? ['ru' => $validated['description']] : null,
            'setting_id' => $validated['setting_id'],
            'user_id' => $request->user()->id,
            'status' => $validated['status'] ?? Campaign::STATUS_ACTIVE,
            'settings' => $validated['settings'] ?? [],
        ]);

        $campaign->load(['setting', 'owner']);

        return response()->json([
            'success' => true,
            'data' => $campaign->formatForApi(),
            'message' => 'Кампания создана',
        ], 201);
    }

    /**
     * Update a campaign
     */
    public function update(Request $request, Campaign $campaign): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:active,paused,completed',
            'settings' => 'nullable|array',
        ]);

        $updateData = [];

        if (isset($validated['name'])) {
            $updateData['name'] = ['ru' => $validated['name']];
        }
        if (array_key_exists('description', $validated)) {
            $updateData['description'] = $validated['description'] ? ['ru' => $validated['description']] : null;
        }
        if (isset($validated['status'])) {
            $updateData['status'] = $validated['status'];
        }
        if (isset($validated['settings'])) {
            $updateData['settings'] = $validated['settings'];
        }

        $campaign->update($updateData);
        $campaign->load(['setting', 'owner']);

        return response()->json([
            'success' => true,
            'data' => $campaign->formatForApi(),
            'message' => 'Кампания обновлена',
        ]);
    }

    /**
     * Delete a campaign
     */
    public function destroy(Campaign $campaign): JsonResponse
    {
        $campaign->delete();

        return response()->json([
            'success' => true,
            'message' => 'Кампания удалена',
        ]);
    }
}
