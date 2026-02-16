"use client";

import { useEffect, useRef, useState } from "react";
import type { Channel, PresenceChannel } from "laravel-echo";
import { useWebSocket } from "@/contexts/WebSocketContext";
import type { Character, LiveSession } from "@/types/game";

// Presence member type
interface PresenceMember {
  id: number;
  name: string;
  email?: string;
}

// Event payload types (same as useCharacterSync but for campaign-wide events)
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

interface LiveSessionStartedPayload {
  live_session: LiveSession;
  campaign_id: number;
  started_by: {
    id: number;
    name: string;
  };
}

interface LiveSessionEndedPayload {
  live_session: LiveSession;
  campaign_id: number;
  duration_minutes: number | null;
}

// Callback types
interface CampaignSyncCallbacks {
  onCharacterUpdated?: (payload: CharacterUpdatedPayload) => void;
  onXPAwarded?: (payload: XPAwardedPayload) => void;
  onItemReceived?: (payload: ItemReceivedPayload) => void;
  onConditionChanged?: (payload: ConditionChangedPayload) => void;
  onCustomRuleChanged?: (payload: CustomRuleChangedPayload) => void;
  onLevelUp?: (payload: LevelUpPayload) => void;
  // Live session events
  onLiveSessionStarted?: (payload: LiveSessionStartedPayload) => void;
  onLiveSessionEnded?: (payload: LiveSessionEndedPayload) => void;
  // Presence events
  onMemberJoined?: (member: PresenceMember) => void;
  onMemberLeft?: (member: PresenceMember) => void;
}

/**
 * Hook for real-time campaign synchronization via WebSocket
 * Used by DM to receive updates from all characters in the campaign
 *
 * @param campaignId - The campaign ID to subscribe to
 * @param callbacks - Event handlers for different update types
 */
export function useCampaignSync(
  campaignId: number | null,
  callbacks: CampaignSyncCallbacks = {}
) {
  const { subscribeToCampaign, subscribeToCampaignPrivate, unsubscribe, isConnected } = useWebSocket();
  const presenceChannelRef = useRef<PresenceChannel | null>(null);
  const privateChannelRef = useRef<Channel | null>(null);
  const [members, setMembers] = useState<PresenceMember[]>([]);

  // Store callbacks in ref to avoid re-subscription on callback changes
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!isConnected || !campaignId) {
      return;
    }

    // Subscribe to campaign presence channel (for who's online)
    const presenceChannel = subscribeToCampaign(campaignId);
    if (presenceChannel) {
      presenceChannelRef.current = presenceChannel;

      // Presence channel events
      presenceChannel
        .here((initialMembers: PresenceMember[]) => {
          setMembers(initialMembers);
        })
        .joining((member: PresenceMember) => {
          setMembers((prev) => {
            if (prev.some((m) => m.id === member.id)) return prev;
            return [...prev, member];
          });
          callbacksRef.current.onMemberJoined?.(member);
        })
        .leaving((member: PresenceMember) => {
          setMembers((prev) => prev.filter((m) => m.id !== member.id));
          callbacksRef.current.onMemberLeft?.(member);
        });
    }

    // Subscribe to campaign private channel (for game events)
    const privateChannel = subscribeToCampaignPrivate(campaignId);
    if (privateChannel) {
      privateChannelRef.current = privateChannel;

      // Listen for character events on private channel
      privateChannel
        .listen(".character.updated", (payload: CharacterUpdatedPayload) => {
          console.log("[WS] character.updated received:", payload);
          callbacksRef.current.onCharacterUpdated?.(payload);
        })
        .listen(".xp.awarded", (payload: XPAwardedPayload) => {
          console.log("[WS] xp.awarded received:", payload);
          callbacksRef.current.onXPAwarded?.(payload);
        })
        .listen(".item.received", (payload: ItemReceivedPayload) => {
          console.log("[WS] item.received received:", payload);
          callbacksRef.current.onItemReceived?.(payload);
        })
        .listen(".condition.changed", (payload: ConditionChangedPayload) => {
          console.log("[WS] condition.changed received:", payload);
          callbacksRef.current.onConditionChanged?.(payload);
        })
        .listen(".custom_rule.changed", (payload: CustomRuleChangedPayload) => {
          console.log("[WS] custom_rule.changed received:", payload);
          callbacksRef.current.onCustomRuleChanged?.(payload);
        })
        .listen(".character.level_up", (payload: LevelUpPayload) => {
          console.log("[WS] character.level_up received:", payload);
          callbacksRef.current.onLevelUp?.(payload);
        })
        .listen(".live_session.started", (payload: LiveSessionStartedPayload) => {
          console.log("[WS] live_session.started received:", payload);
          callbacksRef.current.onLiveSessionStarted?.(payload);
        })
        .listen(".live_session.ended", (payload: LiveSessionEndedPayload) => {
          console.log("[WS] live_session.ended received:", payload);
          callbacksRef.current.onLiveSessionEnded?.(payload);
        });
    }

    // Cleanup on unmount or campaign change
    return () => {
      if (presenceChannelRef.current) {
        unsubscribe(`presence-campaign.${campaignId}`);
        presenceChannelRef.current = null;
        setMembers([]);
      }
      if (privateChannelRef.current) {
        unsubscribe(`private-campaign.${campaignId}`);
        privateChannelRef.current = null;
      }
    };
  }, [campaignId, isConnected, subscribeToCampaign, subscribeToCampaignPrivate, unsubscribe]);

  return {
    isSubscribed: presenceChannelRef.current !== null || privateChannelRef.current !== null,
    isConnected,
    members,
  };
}

// Re-export types for consumers
export type {
  CharacterUpdatedPayload,
  XPAwardedPayload,
  ItemReceivedPayload,
  ConditionChangedPayload,
  CustomRuleChangedPayload,
  LevelUpPayload,
  LiveSessionStartedPayload,
  LiveSessionEndedPayload,
  PresenceMember,
  CampaignSyncCallbacks,
};
