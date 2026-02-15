<?php

namespace App\Http\Controllers\Api\V1\Display;

use App\Http\Controllers\Controller;
use App\Models\DisplayToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DisplayController extends Controller
{
    /**
     * Register a new display and get pairing code
     */
    public function register(Request $request): JsonResponse
    {
        $metadata = [
            'user_agent' => $request->userAgent(),
            'ip' => $request->ip(),
        ];

        $display = DisplayToken::createNew($metadata);

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $display->token,
                'code' => $display->code,
                'code_ttl' => $display->getCodeTtl(),
                'status' => $display->status,
            ],
        ], 201);
    }

    /**
     * Get display status (for polling or after reconnect)
     */
    public function status(Request $request): JsonResponse
    {
        $token = $request->bearerToken() ?? $request->input('token');

        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Токен не указан',
            ], 401);
        }

        $display = DisplayToken::where('token', $token)->first();

        if (!$display) {
            return response()->json([
                'success' => false,
                'message' => 'Дисплей не найден',
            ], 404);
        }

        // If code expired and still waiting, refresh it
        if ($display->isWaiting() && $display->isCodeExpired()) {
            $display->refreshCode();
        }

        $data = [
            'status' => $display->status,
            'code' => $display->isWaiting() ? $display->code : null,
            'code_ttl' => $display->isWaiting() ? $display->getCodeTtl() : null,
            'campaign' => null,
        ];

        if ($display->isPaired() && $display->campaign) {
            $data['campaign'] = [
                'id' => $display->campaign->id,
                'name' => $display->campaign->getTranslation('name', 'ru'),
                'slug' => $display->campaign->slug,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Refresh pairing code
     */
    public function refreshCode(Request $request): JsonResponse
    {
        $token = $request->bearerToken() ?? $request->input('token');

        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Токен не указан',
            ], 401);
        }

        $display = DisplayToken::where('token', $token)->first();

        if (!$display) {
            return response()->json([
                'success' => false,
                'message' => 'Дисплей не найден',
            ], 404);
        }

        if (!$display->isWaiting()) {
            return response()->json([
                'success' => false,
                'message' => 'Дисплей уже подключён',
            ], 422);
        }

        $display->refreshCode();

        return response()->json([
            'success' => true,
            'data' => [
                'code' => $display->code,
                'code_ttl' => $display->getCodeTtl(),
            ],
        ]);
    }

    /**
     * Heartbeat - display reports it's still alive
     */
    public function heartbeat(Request $request): JsonResponse
    {
        $token = $request->bearerToken() ?? $request->input('token');

        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Токен не указан',
            ], 401);
        }

        $display = DisplayToken::where('token', $token)->first();

        if (!$display) {
            return response()->json([
                'success' => false,
                'message' => 'Дисплей не найден',
            ], 404);
        }

        $display->heartbeat();

        return response()->json([
            'success' => true,
            'data' => [
                'status' => $display->status,
            ],
        ]);
    }

    /**
     * Disconnect display (called when display closes)
     */
    public function disconnect(Request $request): JsonResponse
    {
        $token = $request->bearerToken() ?? $request->input('token');

        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Токен не указан',
            ], 401);
        }

        $display = DisplayToken::where('token', $token)->first();

        if (!$display) {
            return response()->json([
                'success' => false,
                'message' => 'Дисплей не найден',
            ], 404);
        }

        $display->disconnect();

        return response()->json([
            'success' => true,
            'message' => 'Дисплей отключён',
        ]);
    }
}
