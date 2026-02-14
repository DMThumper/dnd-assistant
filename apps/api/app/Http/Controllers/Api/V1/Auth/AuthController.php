<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\URL;
use Carbon\Carbon;
use Spatie\Activitylog\Facades\Activity;

class AuthController extends Controller
{
    /**
     * Register a new user
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'is_active' => false, // Requires activation by owner/dm
        ]);

        // Assign default player role
        $user->assignRole('player');

        // Send email verification
        $user->sendEmailVerificationNotification();

        // Log activity
        Activity::causedBy($user)
            ->performedOn($user)
            ->withProperties(['ip' => $request->ip()])
            ->log('user_registered');

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $this->formatUser($user),
                'requires_verification' => true,
            ],
            'message' => 'Registration successful. Please check your email to verify your account.',
        ], 201);
    }

    /**
     * Login user
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        // Check credentials
        if (!$user || !Hash::check($request->password, $user->password)) {
            Activity::withProperties([
                'email' => $request->email,
                'ip' => $request->ip(),
            ])->log('failed_login_attempt');

            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
            ], 401);
        }

        // Check email verification
        if (!$user->hasVerifiedEmail()) {
            return response()->json([
                'success' => false,
                'message' => 'Email not verified. Please check your inbox.',
                'requires_verification' => true,
            ], 403);
        }

        // Check if account is active
        if (!$user->isActive()) {
            return response()->json([
                'success' => false,
                'message' => 'Account is not activated. Please wait for administrator approval.',
            ], 403);
        }

        // Revoke old tokens
        $user->tokens()->delete();

        // Create new token with scopes based on role
        $scopes = $this->getUserScopes($user);
        $token = $user->createToken('auth-token', $scopes);
        $expiresAt = Carbon::now()->addDays(7);

        // Log activity
        Activity::causedBy($user)
            ->performedOn($user)
            ->withProperties(['ip' => $request->ip()])
            ->log('user_logged_in');

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $this->formatUser($user),
                'access_token' => $token->accessToken,
                'token_type' => 'Bearer',
                'expires_at' => $expiresAt->toIso8601String(),
            ],
            'message' => 'Login successful',
        ]);
    }

    /**
     * Logout user
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        // Revoke current token
        $user->token()->revoke();

        // Log activity
        Activity::causedBy($user)
            ->performedOn($user)
            ->log('user_logged_out');

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Get current user
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => $this->formatUser($user),
        ]);
    }

    /**
     * Refresh token
     */
    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();

        // Revoke current token
        $user->token()->revoke();

        // Create new token
        $scopes = $this->getUserScopes($user);
        $token = $user->createToken('auth-token', $scopes);
        $expiresAt = Carbon::now()->addDays(7);

        return response()->json([
            'success' => true,
            'data' => [
                'access_token' => $token->accessToken,
                'token_type' => 'Bearer',
                'expires_at' => $expiresAt->toIso8601String(),
            ],
        ]);
    }

    /**
     * Verify email
     */
    public function verifyEmail(Request $request, int $id, string $hash): JsonResponse
    {
        $user = User::findOrFail($id);

        // Check hash
        if (!hash_equals($hash, sha1($user->getEmailForVerification()))) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification link',
            ], 400);
        }

        // Already verified
        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'success' => true,
                'message' => 'Email already verified',
            ]);
        }

        // Mark as verified
        $user->markEmailAsVerified();

        // Log activity
        Activity::causedBy($user)
            ->performedOn($user)
            ->log('email_verified');

        return response()->json([
            'success' => true,
            'message' => 'Email verified successfully. Please wait for administrator to activate your account.',
        ]);
    }

    /**
     * Resend verification email
     */
    public function resendVerification(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            // Don't reveal if email exists
            return response()->json([
                'success' => true,
                'message' => 'If the email exists, a verification link has been sent.',
            ]);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'success' => false,
                'message' => 'Email already verified',
            ], 400);
        }

        $user->sendEmailVerificationNotification();

        return response()->json([
            'success' => true,
            'message' => 'Verification email sent',
        ]);
    }

    /**
     * Get token scopes based on user roles
     */
    protected function getUserScopes(User $user): array
    {
        if ($user->hasRole('owner')) {
            return ['*'];
        }

        if ($user->hasRole('dm')) {
            return [
                'read:campaigns', 'write:campaigns',
                'read:encounters', 'write:encounters',
                'read:characters', 'write:characters',
                'read:content', 'write:content',
                'manage:displays',
            ];
        }

        // Player
        return [
            'read:campaigns',
            'read:characters', 'write:characters',
            'read:content',
        ];
    }

    /**
     * Format user for response
     */
    protected function formatUser(User $user): array
    {
        $user->load('roles', 'permissions');

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'email_verified' => $user->hasVerifiedEmail(),
            'is_active' => $user->isActive(),
            'roles' => $user->roles->pluck('name')->toArray(),
            'permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
            'backoffice_access' => $user->hasAnyRole(['owner', 'dm']),
            'can_manage_roles' => $user->hasRole('owner'),
            'created_at' => $user->created_at->toIso8601String(),
        ];
    }
}
