<?php

namespace App\Http\Controllers\Api\V1\Backoffice;

use App\Http\Controllers\Controller;
use App\Models\Act;
use App\Models\Campaign;
use App\Models\GameSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class GameSessionController extends Controller
{
    /**
     * Get all sessions for an act
     */
    public function index(Campaign $campaign, Act $act): JsonResponse
    {
        $this->ensureActBelongsToCampaign($campaign, $act);

        $sessions = $act->gameSessions()
            ->orderBy('sort_order')
            ->get()
            ->map(fn (GameSession $session) => $this->formatSession($session));

        return response()->json([
            'success' => true,
            'data' => $sessions,
        ]);
    }

    /**
     * Create a new session
     */
    public function store(Request $request, Campaign $campaign, Act $act): JsonResponse
    {
        $this->ensureActBelongsToCampaign($campaign, $act);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'summary' => 'nullable|string',
            'status' => ['nullable', Rule::in([GameSession::STATUS_PLANNED, GameSession::STATUS_ACTIVE, GameSession::STATUS_COMPLETED])],
            'played_at' => 'nullable|date',
        ]);

        // Get the next number within the act
        $maxNumber = $act->gameSessions()->max('number') ?? 0;
        $maxSortOrder = $act->gameSessions()->max('sort_order') ?? 0;

        $session = $act->gameSessions()->create([
            'number' => $maxNumber + 1,
            'name' => ['ru' => $validated['name']],
            'summary' => isset($validated['summary']) ? ['ru' => $validated['summary']] : null,
            'status' => $validated['status'] ?? GameSession::STATUS_PLANNED,
            'played_at' => $validated['played_at'] ?? null,
            'sort_order' => $maxSortOrder + 1,
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->formatSession($session),
            'message' => 'Сессия создана',
        ], 201);
    }

    /**
     * Get a specific session
     */
    public function show(Campaign $campaign, Act $act, GameSession $session): JsonResponse
    {
        $this->ensureSessionBelongsToAct($campaign, $act, $session);

        return response()->json([
            'success' => true,
            'data' => $this->formatSession($session, true),
        ]);
    }

    /**
     * Update a session
     */
    public function update(Request $request, Campaign $campaign, Act $act, GameSession $session): JsonResponse
    {
        $this->ensureSessionBelongsToAct($campaign, $act, $session);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'summary' => 'nullable|string',
            'status' => ['sometimes', Rule::in([GameSession::STATUS_PLANNED, GameSession::STATUS_ACTIVE, GameSession::STATUS_COMPLETED])],
            'played_at' => 'nullable|date',
            'number' => 'sometimes|integer|min:1',
        ]);

        $updateData = [];

        if (isset($validated['name'])) {
            $updateData['name'] = ['ru' => $validated['name']];
        }
        if (array_key_exists('summary', $validated)) {
            $updateData['summary'] = $validated['summary'] ? ['ru' => $validated['summary']] : null;
        }
        if (isset($validated['status'])) {
            $updateData['status'] = $validated['status'];
        }
        if (array_key_exists('played_at', $validated)) {
            $updateData['played_at'] = $validated['played_at'];
        }
        if (isset($validated['number'])) {
            $updateData['number'] = $validated['number'];
        }

        $session->update($updateData);

        return response()->json([
            'success' => true,
            'data' => $this->formatSession($session->fresh()),
            'message' => 'Сессия обновлена',
        ]);
    }

    /**
     * Delete a session
     */
    public function destroy(Campaign $campaign, Act $act, GameSession $session): JsonResponse
    {
        $this->ensureSessionBelongsToAct($campaign, $act, $session);

        $session->delete();

        // Renumber remaining sessions
        $act->gameSessions()
            ->orderBy('sort_order')
            ->get()
            ->each(function (GameSession $session, int $index) {
                $session->update(['number' => $index + 1]);
            });

        return response()->json([
            'success' => true,
            'message' => 'Сессия удалена',
        ]);
    }

    /**
     * Reorder sessions within an act
     */
    public function reorder(Request $request, Campaign $campaign, Act $act): JsonResponse
    {
        $this->ensureActBelongsToCampaign($campaign, $act);

        $validated = $request->validate([
            'session_ids' => 'required|array',
            'session_ids.*' => 'required|integer|exists:game_sessions,id',
        ]);

        DB::transaction(function () use ($act, $validated) {
            // First, set all numbers to temporary negative values to avoid unique constraint conflicts
            $offset = -1000;
            foreach ($validated['session_ids'] as $index => $sessionId) {
                $act->gameSessions()
                    ->where('id', $sessionId)
                    ->update([
                        'sort_order' => $index,
                        'number' => $offset - $index,
                    ]);
            }

            // Then, set the correct numbers
            foreach ($validated['session_ids'] as $index => $sessionId) {
                $act->gameSessions()
                    ->where('id', $sessionId)
                    ->update([
                        'number' => $index + 1,
                    ]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Порядок сессий обновлён',
        ]);
    }

    /**
     * Update session status
     */
    public function updateStatus(Request $request, Campaign $campaign, Act $act, GameSession $session): JsonResponse
    {
        $this->ensureSessionBelongsToAct($campaign, $act, $session);

        $validated = $request->validate([
            'status' => ['required', Rule::in([GameSession::STATUS_PLANNED, GameSession::STATUS_ACTIVE, GameSession::STATUS_COMPLETED])],
        ]);

        $updateData = ['status' => $validated['status']];

        // If completing the session, set played_at to today if not set
        if ($validated['status'] === GameSession::STATUS_COMPLETED && !$session->played_at) {
            $updateData['played_at'] = now()->toDateString();
        }

        $session->update($updateData);

        return response()->json([
            'success' => true,
            'data' => $this->formatSession($session->fresh()),
            'message' => 'Статус сессии обновлён',
        ]);
    }

    /**
     * Move session to another act
     */
    public function move(Request $request, Campaign $campaign, Act $act, GameSession $session): JsonResponse
    {
        $this->ensureSessionBelongsToAct($campaign, $act, $session);

        $validated = $request->validate([
            'target_act_id' => 'required|integer|exists:acts,id',
        ]);

        $targetAct = Act::findOrFail($validated['target_act_id']);

        // Ensure target act belongs to the same campaign
        if ($targetAct->campaign_id !== $campaign->id) {
            return response()->json([
                'success' => false,
                'message' => 'Целевой акт не принадлежит этой кампании',
            ], 422);
        }

        // Get next number in target act
        $maxNumber = $targetAct->gameSessions()->max('number') ?? 0;
        $maxSortOrder = $targetAct->gameSessions()->max('sort_order') ?? 0;

        $session->update([
            'act_id' => $targetAct->id,
            'number' => $maxNumber + 1,
            'sort_order' => $maxSortOrder + 1,
        ]);

        // Renumber sessions in original act
        $act->gameSessions()
            ->orderBy('sort_order')
            ->get()
            ->each(function (GameSession $s, int $index) {
                $s->update(['number' => $index + 1]);
            });

        return response()->json([
            'success' => true,
            'data' => $this->formatSession($session->fresh()),
            'message' => 'Сессия перемещена в другой акт',
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
     * Ensure session belongs to act and campaign
     */
    private function ensureSessionBelongsToAct(Campaign $campaign, Act $act, GameSession $session): void
    {
        $this->ensureActBelongsToCampaign($campaign, $act);

        if ($session->act_id !== $act->id) {
            abort(404, 'Сессия не найдена в этом акте');
        }
    }

    /**
     * Format session for API response
     */
    private function formatSession(GameSession $session, bool $includeScenes = false): array
    {
        $data = [
            'id' => $session->id,
            'act_id' => $session->act_id,
            'number' => $session->number,
            'global_number' => $session->getGlobalNumber(),
            'name' => $session->getTranslation('name', 'ru'),
            'summary' => $session->getTranslation('summary', 'ru'),
            'status' => $session->status,
            'played_at' => $session->played_at?->toDateString(),
            'sort_order' => $session->sort_order,
            'formatted_title' => $session->getFormattedTitle(),
            'is_planned' => $session->isPlanned(),
            'is_active' => $session->isActive(),
            'is_completed' => $session->isCompleted(),
            'created_at' => $session->created_at?->toISOString(),
            'updated_at' => $session->updated_at?->toISOString(),
        ];

        // Include scenes if requested (for detailed view)
        // if ($includeScenes) {
        //     $data['scenes'] = $session->scenes->map(fn ($scene) => [...]);
        // }

        return $data;
    }
}
