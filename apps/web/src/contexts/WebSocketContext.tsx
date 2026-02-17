"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type Echo from "laravel-echo";
import type { Channel, PresenceChannel } from "laravel-echo";
import { useAuth } from "./AuthContext";
import { initializeEcho, disconnectEcho, getEcho, setAuthErrorCallback } from "@/lib/echo";

interface WebSocketContextType {
  echo: Echo<"reverb"> | null;
  isConnected: boolean;
  hasAuthError: boolean;
  subscribeToCharacter: (characterId: number) => Channel | null;
  subscribeToCampaign: (campaignId: number) => PresenceChannel | null;
  subscribeToCampaignPrivate: (campaignId: number) => Channel | null;
  subscribeToCampaignBattle: (campaignId: number) => Channel | null;
  unsubscribe: (channelName: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { accessToken, isAuthenticated } = useAuth();
  const [echo, setEcho] = useState<Echo<"reverb"> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hasAuthError, setHasAuthError] = useState(false);

  // Initialize Echo when authenticated
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      try {
        // Reset auth error state for new connection attempt
        setHasAuthError(false);

        // Set up auth error callback before initializing
        setAuthErrorCallback((hasError) => {
          console.log("[WS] Auth error callback:", hasError);
          setHasAuthError(hasError);
        });

        const echoInstance = initializeEcho(accessToken);
        setEcho(echoInstance);

        // Listen for Pusher connection state changes
        const pusher = echoInstance.connector?.pusher;
        if (pusher) {
          pusher.connection.bind("connected", () => {
            console.log("[WS] Connected to Reverb");
            setIsConnected(true);
          });
          pusher.connection.bind("disconnected", () => {
            console.log("[WS] Disconnected from Reverb");
            setIsConnected(false);
          });
          pusher.connection.bind("failed", () => {
            console.log("[WS] Connection failed");
            setIsConnected(false);
          });
          pusher.connection.bind("unavailable", () => {
            console.log("[WS] Connection unavailable");
            setIsConnected(false);
          });

          // Check initial state
          const state = pusher.connection.state;
          setIsConnected(state === "connected");

          // Listen for any errors
          pusher.bind_global((event: string, data: unknown) => {
            console.log("[WS] Global event:", event, data);
            if (event === "pusher:subscription_error" || event === "pusher:error") {
              console.error("[WS] Error event:", event, data);
              setHasAuthError(true);
            }
          });
        }
      } catch (error) {
        console.error("Failed to initialize WebSocket:", error);
        setIsConnected(false);
      }
    } else {
      disconnectEcho();
      setEcho(null);
      setIsConnected(false);
    }

    return () => {
      // Cleanup on unmount
    };
  }, [isAuthenticated, accessToken]);

  // Subscribe to character's private channel
  const subscribeToCharacter = useCallback(
    (characterId: number): Channel | null => {
      const echoInstance = getEcho();
      if (!echoInstance) return null;

      return echoInstance.private(`character.${characterId}`);
    },
    []
  );

  // Subscribe to campaign presence channel (for who's online)
  const subscribeToCampaign = useCallback(
    (campaignId: number): PresenceChannel | null => {
      const echoInstance = getEcho();
      if (!echoInstance) return null;

      return echoInstance.join(`campaign.${campaignId}`);
    },
    []
  );

  // Subscribe to campaign private channel (for events like XP, level up, HP changes)
  const subscribeToCampaignPrivate = useCallback(
    (campaignId: number): Channel | null => {
      const echoInstance = getEcho();
      if (!echoInstance) return null;

      return echoInstance.private(`campaign.${campaignId}`);
    },
    []
  );

  // Subscribe to campaign battle channel
  const subscribeToCampaignBattle = useCallback(
    (campaignId: number): Channel | null => {
      const echoInstance = getEcho();
      if (!echoInstance) return null;

      return echoInstance.private(`campaign.${campaignId}.battle`);
    },
    []
  );

  // Unsubscribe from a channel
  const unsubscribe = useCallback((channelName: string) => {
    const echoInstance = getEcho();
    if (echoInstance) {
      echoInstance.leave(channelName);
    }
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        echo,
        isConnected,
        hasAuthError,
        subscribeToCharacter,
        subscribeToCampaign,
        subscribeToCampaignPrivate,
        subscribeToCampaignBattle,
        unsubscribe,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}
