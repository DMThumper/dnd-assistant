"use client";

import { useEffect, useCallback, useRef } from "react";
import type { Channel } from "laravel-echo";
import { useWebSocket } from "@/contexts/WebSocketContext";
import type { Character } from "@/types/game";

// Event payload types
interface CharacterUpdatedPayload {
  character_id: number;
  campaign_id: number;
  update_type: string;
  changes: Record<string, unknown>;
  character: Character;
}

interface XPAwardedPayload {
  character_id: number;
  character_name: string;
  campaign_id: number;
  xp_amount: number;
  total_xp: number;
  current_level: number;
  reason: string;
  can_level_up: boolean;
}

interface ItemReceivedPayload {
  character_id: number;
  item: {
    slug?: string;
    name: string;
    custom?: boolean;
  };
  quantity: number;
  source: string;
}

interface ConditionChangedPayload {
  character_id: number;
  character_name: string;
  campaign_id: number;
  action: "added" | "removed";
  condition: {
    key: string;
    name?: string;
    source?: string;
    duration?: number;
  };
  all_conditions: Array<{
    key: string;
    name?: string;
    source?: string;
    duration?: number;
  }>;
}

interface CustomRuleChangedPayload {
  character_id: number;
  character_name: string;
  action: "added" | "updated" | "removed";
  custom_rule: {
    id: string;
    name: string;
    description?: string;
    effects: Array<{
      type: "bonus" | "penalty";
      category: string;
      target?: string;
      value?: number;
    }>;
    permanent: boolean;
  };
  all_custom_rules: Array<unknown>;
}

interface LevelUpPayload {
  character_id: number;
  character_name: string;
  campaign_id: number;
  previous_level: number;
  new_level: number;
  class_slug: string | null;
  new_features: string[];
  character: Character;
}

// Callback types
interface CharacterSyncCallbacks {
  onCharacterUpdated?: (payload: CharacterUpdatedPayload) => void;
  onXPAwarded?: (payload: XPAwardedPayload) => void;
  onItemReceived?: (payload: ItemReceivedPayload) => void;
  onConditionChanged?: (payload: ConditionChangedPayload) => void;
  onCustomRuleChanged?: (payload: CustomRuleChangedPayload) => void;
  onLevelUp?: (payload: LevelUpPayload) => void;
}

/**
 * Hook for real-time character synchronization via WebSocket
 *
 * @param characterId - The character ID to subscribe to
 * @param callbacks - Event handlers for different update types
 */
export function useCharacterSync(
  characterId: number | null,
  callbacks: CharacterSyncCallbacks = {}
) {
  const { subscribeToCharacter, unsubscribe, isConnected } = useWebSocket();
  const channelRef = useRef<Channel | null>(null);

  const {
    onCharacterUpdated,
    onXPAwarded,
    onItemReceived,
    onConditionChanged,
    onCustomRuleChanged,
    onLevelUp,
  } = callbacks;

  // Memoized handlers to prevent unnecessary re-subscriptions
  const handleCharacterUpdated = useCallback(
    (payload: CharacterUpdatedPayload) => {
      onCharacterUpdated?.(payload);
    },
    [onCharacterUpdated]
  );

  const handleXPAwarded = useCallback(
    (payload: XPAwardedPayload) => {
      onXPAwarded?.(payload);
    },
    [onXPAwarded]
  );

  const handleItemReceived = useCallback(
    (payload: ItemReceivedPayload) => {
      onItemReceived?.(payload);
    },
    [onItemReceived]
  );

  const handleConditionChanged = useCallback(
    (payload: ConditionChangedPayload) => {
      onConditionChanged?.(payload);
    },
    [onConditionChanged]
  );

  const handleCustomRuleChanged = useCallback(
    (payload: CustomRuleChangedPayload) => {
      onCustomRuleChanged?.(payload);
    },
    [onCustomRuleChanged]
  );

  const handleLevelUp = useCallback(
    (payload: LevelUpPayload) => {
      onLevelUp?.(payload);
    },
    [onLevelUp]
  );

  useEffect(() => {
    if (!isConnected || !characterId) {
      return;
    }

    // Subscribe to character channel
    const channel = subscribeToCharacter(characterId);
    if (!channel) {
      return;
    }

    channelRef.current = channel;

    // Listen for events
    channel
      .listen(".character.updated", handleCharacterUpdated)
      .listen(".xp.awarded", handleXPAwarded)
      .listen(".item.received", handleItemReceived)
      .listen(".condition.changed", handleConditionChanged)
      .listen(".custom_rule.changed", handleCustomRuleChanged)
      .listen(".character.level_up", handleLevelUp);

    // Cleanup on unmount or character change
    return () => {
      if (channelRef.current) {
        unsubscribe(`private-character.${characterId}`);
        channelRef.current = null;
      }
    };
  }, [
    characterId,
    isConnected,
    subscribeToCharacter,
    unsubscribe,
    handleCharacterUpdated,
    handleXPAwarded,
    handleItemReceived,
    handleConditionChanged,
    handleCustomRuleChanged,
    handleLevelUp,
  ]);

  return {
    isSubscribed: channelRef.current !== null,
    isConnected,
  };
}
