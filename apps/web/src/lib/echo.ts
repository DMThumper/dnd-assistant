import Echo from "laravel-echo";
import Pusher from "pusher-js";

// Make Pusher available globally (required by Laravel Echo)
declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<"reverb"> | null;
  }
}

let echoInstance: Echo<"reverb"> | null = null;
let authErrorCallback: ((error: boolean) => void) | null = null;

/**
 * Set callback for auth errors
 */
export function setAuthErrorCallback(callback: (error: boolean) => void): void {
  authErrorCallback = callback;
}

/**
 * Initialize Laravel Echo with Reverb WebSocket connection
 */
export function initializeEcho(authToken: string): Echo<"reverb"> {
  if (typeof window === "undefined") {
    throw new Error("Echo can only be initialized in browser");
  }

  // If already initialized, disconnect and create new instance with new token
  if (echoInstance) {
    console.log("[Echo] Reinitializing with new token");
    echoInstance.disconnect();
    echoInstance = null;
  }

  // Make Pusher available globally
  window.Pusher = Pusher;

  const reverbHost = process.env.NEXT_PUBLIC_REVERB_HOST || "localhost";
  const reverbPort = process.env.NEXT_PUBLIC_REVERB_PORT || "8080";
  const reverbKey = process.env.NEXT_PUBLIC_REVERB_APP_KEY || "dnd-reverb-key";
  const reverbScheme = process.env.NEXT_PUBLIC_REVERB_SCHEME || "http";
  // Extract base URL without /api/v1 suffix for broadcasting auth
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const baseUrl = apiUrl.replace(/\/api\/v\d+$/, '');

  echoInstance = new Echo({
    broadcaster: "reverb",
    key: reverbKey,
    wsHost: reverbHost,
    wsPort: parseInt(reverbPort),
    wssPort: parseInt(reverbPort),
    forceTLS: reverbScheme === "https",
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${baseUrl}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
    },
    // Custom authorizer to catch auth errors
    authorizer: (channel: { name: string }) => ({
      authorize: (socketId: string, callback: (error: boolean | null, data: unknown) => void) => {
        fetch(`${baseUrl}/broadcasting/auth`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
            Accept: "application/json",
          },
          body: JSON.stringify({
            socket_id: socketId,
            channel_name: channel.name,
          }),
        })
          .then((response) => {
            if (!response.ok) {
              console.error("[Echo] Auth failed:", channel.name, response.status);
              if (response.status === 403 || response.status === 401) {
                authErrorCallback?.(true);
              }
              throw new Error(`Auth failed: ${response.status}`);
            }
            return response.json();
          })
          .then((data) => {
            callback(null, data);
          })
          .catch((error) => {
            callback(true, null);
          });
      },
    }),
  });

  window.Echo = echoInstance;

  return echoInstance;
}

/**
 * Get existing Echo instance
 */
export function getEcho(): Echo<"reverb"> | null {
  return echoInstance;
}

/**
 * Disconnect and cleanup Echo instance
 */
export function disconnectEcho(): void {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
    window.Echo = null;
  }
}

/**
 * Check if Echo is connected
 */
export function isEchoConnected(): boolean {
  return echoInstance !== null;
}
