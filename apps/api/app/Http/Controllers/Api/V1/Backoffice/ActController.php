<?php

namespace App\Http\Controllers\Api\V1\Backoffice;

use App\Http\Controllers\Controller;
use App\Models\Act;
use App\Models\Campaign;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ActController extends Controller
{
    /**
     * Get all acts for a campaign
     */
    public function index(Campaign $campaign): JsonResponse
    {
        $acts = $campaign->acts()
            ->orderBy('sort_order')
            ->withCount(['gameSessions', 'gameSessions as completed_sessions_count' => function ($query) {
                $query->where('status', 'completed');
            }])
            ->get()
            ->map(fn (Act $act) => $this->formatAct($act));

        return response()->json([
            'success' => true,
            'data' => $acts,
        ]);
    }

    /**
     * Create a new act
     */
    public function store(Request $request, Campaign $campaign): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'intro' => 'nullable|string',
            'epilogue' => 'nullable|string',
            'status' => ['nullable', Rule::in([Act::STATUS_PLANNED, Act::STATUS_ACTIVE, Act::STATUS_COMPLETED])],
        ]);

        // Get the next number
        $maxNumber = $campaign->acts()->max('number') ?? 0;
        $maxSortOrder = $campaign->acts()->max('sort_order') ?? 0;

        $act = $campaign->acts()->create([
            'number' => $maxNumber + 1,
            'name' => ['ru' => $validated['name']],
            'description' => isset($validated['description']) ? ['ru' => $validated['description']] : null,
            'intro' => isset($validated['intro']) ? ['ru' => $validated['intro']] : null,
            'epilogue' => isset($validated['epilogue']) ? ['ru' => $validated['epilogue']] : null,
            'status' => $validated['status'] ?? Act::STATUS_PLANNED,
            'sort_order' => $maxSortOrder + 1,
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->formatAct($act),
            'message' => 'Акт создан',
        ], 201);
    }

    /**
     * Get a specific act
     */
    public function show(Campaign $campaign, Act $act): JsonResponse
    {
        $this->ensureActBelongsToCampaign($campaign, $act);

        $act->loadCount(['gameSessions', 'gameSessions as completed_sessions_count' => function ($query) {
            $query->where('status', 'completed');
        }]);

        return response()->json([
            'success' => true,
            'data' => $this->formatAct($act),
        ]);
    }

    /**
     * Update an act
     */
    public function update(Request $request, Campaign $campaign, Act $act): JsonResponse
    {
        $this->ensureActBelongsToCampaign($campaign, $act);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'intro' => 'nullable|string',
            'epilogue' => 'nullable|string',
            'status' => ['sometimes', Rule::in([Act::STATUS_PLANNED, Act::STATUS_ACTIVE, Act::STATUS_COMPLETED])],
            'number' => 'sometimes|integer|min:1',
        ]);

        $updateData = [];

        if (isset($validated['name'])) {
            $updateData['name'] = ['ru' => $validated['name']];
        }
        if (array_key_exists('description', $validated)) {
            $updateData['description'] = $validated['description'] ? ['ru' => $validated['description']] : null;
        }
        if (array_key_exists('intro', $validated)) {
            $updateData['intro'] = $validated['intro'] ? ['ru' => $validated['intro']] : null;
        }
        if (array_key_exists('epilogue', $validated)) {
            $updateData['epilogue'] = $validated['epilogue'] ? ['ru' => $validated['epilogue']] : null;
        }
        if (isset($validated['status'])) {
            $updateData['status'] = $validated['status'];
        }
        if (isset($validated['number'])) {
            $updateData['number'] = $validated['number'];
        }

        $act->update($updateData);

        return response()->json([
            'success' => true,
            'data' => $this->formatAct($act->fresh()),
            'message' => 'Акт обновлён',
        ]);
    }

    /**
     * Delete an act
     */
    public function destroy(Campaign $campaign, Act $act): JsonResponse
    {
        $this->ensureActBelongsToCampaign($campaign, $act);

        $act->delete();

        // Renumber remaining acts
        $campaign->acts()
            ->orderBy('sort_order')
            ->get()
            ->each(function (Act $act, int $index) {
                $act->update(['number' => $index + 1]);
            });

        return response()->json([
            'success' => true,
            'message' => 'Акт удалён',
        ]);
    }

    /**
     * Reorder acts
     */
    public function reorder(Request $request, Campaign $campaign): JsonResponse
    {
        $validated = $request->validate([
            'act_ids' => 'required|array',
            'act_ids.*' => 'required|integer|exists:acts,id',
        ]);

        DB::transaction(function () use ($campaign, $validated) {
            // First, set all numbers to temporary negative values to avoid unique constraint conflicts
            $offset = -1000;
            foreach ($validated['act_ids'] as $index => $actId) {
                $campaign->acts()
                    ->where('id', $actId)
                    ->update([
                        'sort_order' => $index,
                        'number' => $offset - $index,
                    ]);
            }

            // Then, set the correct numbers
            foreach ($validated['act_ids'] as $index => $actId) {
                $campaign->acts()
                    ->where('id', $actId)
                    ->update([
                        'number' => $index + 1,
                    ]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Порядок актов обновлён',
        ]);
    }

    /**
     * Update act status
     */
    public function updateStatus(Request $request, Campaign $campaign, Act $act): JsonResponse
    {
        $this->ensureActBelongsToCampaign($campaign, $act);

        $validated = $request->validate([
            'status' => ['required', Rule::in([Act::STATUS_PLANNED, Act::STATUS_ACTIVE, Act::STATUS_COMPLETED])],
        ]);

        $act->update(['status' => $validated['status']]);

        return response()->json([
            'success' => true,
            'data' => $this->formatAct($act->fresh()),
            'message' => 'Статус акта обновлён',
        ]);
    }

    /**
     * Ensure act belongs to campaign
     */
    private function ensureActBelongsToCampaign(Campaign $campaign, Act $act): void
    {
        if ($act->campaign_id !== $campaign->id) {
            abort(404, 'Акт не найден в этой кампании');
        }
    }

    /**
     * Format act for API response
     */
    private function formatAct(Act $act): array
    {
        return [
            'id' => $act->id,
            'campaign_id' => $act->campaign_id,
            'number' => $act->number,
            'name' => $act->getTranslation('name', 'ru'),
            'description' => $act->getTranslation('description', 'ru'),
            'intro' => $act->getTranslation('intro', 'ru'),
            'epilogue' => $act->getTranslation('epilogue', 'ru'),
            'status' => $act->status,
            'sort_order' => $act->sort_order,
            'formatted_title' => $act->getFormattedTitle(),
            'sessions_count' => $act->game_sessions_count ?? $act->gameSessions()->count(),
            'completed_sessions_count' => $act->completed_sessions_count ?? $act->getCompletedSessionCount(),
            'is_active' => $act->isActive(),
            'is_completed' => $act->isCompleted(),
            'created_at' => $act->created_at?->toISOString(),
            'updated_at' => $act->updated_at?->toISOString(),
        ];
    }
}
