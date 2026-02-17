"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useCharacterSync } from "@/hooks/useCharacterSync";
import { useCampaignSync } from "@/hooks/useCampaignSync";
import { api } from "@/lib/api";
import type { Character, LiveSession, Condition } from "@/types/game";
import { toast } from "sonner";

interface PlayerSessionContextType {
  // Active IDs
  activeCharacterId: number | null;
  activeCampaignId: number | null;
  // Loading/validation state
  isValidating: boolean;
  // Connection status
  isConnected: boolean;
  // Live session
  liveSession: LiveSession | null;
  // Character data (synced)
  character: Character | null;
  // Actions
  setActiveCharacter: (characterId: number, campaignId: number) => void;
  clearActiveCharacter: () => void;
  updateCharacter: (character: Character) => void;
}

const PlayerSessionContext = createContext<PlayerSessionContextType | null>(null);

// Use sessionStorage - clears when tab closes, avoids stale state issues
const ACTIVE_CHARACTER_KEY = "dnd-player-active-character";
const ACTIVE_CAMPAIGN_KEY = "dnd-player-active-campaign";

// Helper to safely get storage (works in SSR)
const getStorage = () => {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
};

interface PlayerSessionProviderProps {
  children: ReactNode;
}

export function PlayerSessionProvider({ children }: PlayerSessionProviderProps) {
  const [activeCharacterId, setActiveCharacterId] = useState<number | null>(null);
  const [activeCampaignId, setActiveCampaignId] = useState<number | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [liveSession, setLiveSession] = useState<LiveSession | null>(null);
  const [isValidating, setIsValidating] = useState(true);

  // Restore and validate from sessionStorage on mount
  useEffect(() => {
    const validateStoredSession = async () => {
      // Clear any old localStorage data (we migrated to sessionStorage)
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(ACTIVE_CHARACTER_KEY);
        window.localStorage.removeItem(ACTIVE_CAMPAIGN_KEY);
      }

      const storage = getStorage();
      if (!storage) {
        setIsValidating(false);
        return;
      }

      const storedCharId = storage.getItem(ACTIVE_CHARACTER_KEY);
      const storedCampId = storage.getItem(ACTIVE_CAMPAIGN_KEY);

      if (!storedCharId || !storedCampId) {
        // No stored session, nothing to validate
        storage.removeItem(ACTIVE_CHARACTER_KEY);
        storage.removeItem(ACTIVE_CAMPAIGN_KEY);
        setIsValidating(false);
        return;
      }

      try {
        // Validate by fetching the character - this checks both character and campaign access
        const response = await api.getCharacter(Number(storedCharId));
        if (response.success && response.data?.character) {
          // Valid - set the IDs and character data
          setActiveCharacterId(Number(storedCharId));
          setActiveCampaignId(Number(storedCampId));
          setCharacter(response.data.character);
        } else {
          // Invalid - clear storage
          console.warn("[Session] Stored session invalid, clearing");
          storage.removeItem(ACTIVE_CHARACTER_KEY);
          storage.removeItem(ACTIVE_CAMPAIGN_KEY);
        }
      } catch (error) {
        // Error (403, 404, etc.) - clear storage
        console.warn("[Session] Failed to validate stored session:", error);
        storage.removeItem(ACTIVE_CHARACTER_KEY);
        storage.removeItem(ACTIVE_CAMPAIGN_KEY);
      } finally {
        setIsValidating(false);
      }
    };

    validateStoredSession();
  }, []);

  // Fetch live session status when campaign ID is set/restored (only after validation)
  useEffect(() => {
    if (isValidating || !activeCampaignId) {
      setLiveSession(null);
      return;
    }

    const fetchLiveSession = async () => {
      try {
        const response = await api.getPlayerLiveSessionStatus(activeCampaignId);
        if (response.data.has_active_session) {
          setLiveSession(response.data.live_session);
        } else {
          setLiveSession(null);
        }
      } catch (error) {
        console.warn("Failed to fetch live session status:", error);
        setLiveSession(null);
      }
    };

    fetchLiveSession();
  }, [activeCampaignId]);

  // Character sync - only when we have an active character AND validation is done
  const { isConnected: isCharConnected } = useCharacterSync(isValidating ? null : activeCharacterId, {
    onCharacterUpdated: (payload) => {
      setCharacter(payload.character);
      if (payload.update_type === "hp") {
        const changes = payload.changes as { type?: string; amount?: number };
        if (changes.type === "damage") {
          toast.error(`Получено ${changes.amount} урона`);
        } else if (changes.type === "healing") {
          toast.success(`Исцелено ${changes.amount} HP`);
        }
      }
    },
    onXPAwarded: (payload) => {
      setCharacter((prev) =>
        prev ? { ...prev, experience_points: payload.total_xp } : null
      );
      toast.success(`+${payload.xp_amount} XP${payload.reason ? `: ${payload.reason}` : ""}`, {
        duration: 5000,
      });
      if (payload.can_level_up) {
        toast.info("Доступно повышение уровня!", {
          duration: 10000,
          icon: "🎉",
        });
      }
    },
    onConditionChanged: (payload) => {
      setCharacter((prev) =>
        prev ? { ...prev, conditions: payload.all_conditions as Condition[] } : null
      );
      const action = payload.action === "added" ? "Добавлено" : "Убрано";
      const conditionName = payload.condition.name || payload.condition.key;
      if (payload.action === "added") {
        toast.warning(`${action}: ${conditionName}`);
      } else {
        toast.info(`${action}: ${conditionName}`);
      }
    },
    onLevelUp: (payload) => {
      setCharacter(payload.character);
      toast.success(`Уровень повышен до ${payload.new_level}!`, {
        duration: 10000,
        icon: "🎉",
      });
    },
    onCustomRuleChanged: (payload) => {
      const action = payload.action === "added" ? "Добавлен" : payload.action === "removed" ? "Убран" : "Изменён";
      toast.info(`${action} эффект: ${payload.custom_rule.name}`);
    },
  });

  // Campaign sync - for live session and presence (only after validation)
  const { isConnected: isCampConnected } = useCampaignSync(isValidating ? null : activeCampaignId, {
    onLiveSessionStarted: (payload) => {
      setLiveSession(payload.live_session);
      toast.success("DM запустил сессию!", {
        duration: 5000,
        icon: "🎲",
      });
    },
    onLiveSessionEnded: () => {
      setLiveSession(null);
      toast.info("Сессия завершена", {
        duration: 5000,
      });
    },
  });

  const isConnected = isCharConnected || isCampConnected;

  // Set active character (called when entering character sheet)
  const setActiveCharacter = useCallback((characterId: number, campaignId: number) => {
    setActiveCharacterId(characterId);
    setActiveCampaignId(campaignId);
    const storage = getStorage();
    storage?.setItem(ACTIVE_CHARACTER_KEY, String(characterId));
    storage?.setItem(ACTIVE_CAMPAIGN_KEY, String(campaignId));
  }, []);

  // Clear active character (called when leaving to campaign/character selection)
  const clearActiveCharacter = useCallback(() => {
    setActiveCharacterId(null);
    setActiveCampaignId(null);
    setCharacter(null);
    setLiveSession(null);
    const storage = getStorage();
    storage?.removeItem(ACTIVE_CHARACTER_KEY);
    storage?.removeItem(ACTIVE_CAMPAIGN_KEY);
  }, []);

  // Update character data
  const updateCharacter = useCallback((newCharacter: Character) => {
    setCharacter(newCharacter);
  }, []);

  return (
    <PlayerSessionContext.Provider
      value={{
        activeCharacterId,
        activeCampaignId,
        isValidating,
        isConnected,
        liveSession,
        character,
        setActiveCharacter,
        clearActiveCharacter,
        updateCharacter,
      }}
    >
      {children}
    </PlayerSessionContext.Provider>
  );
}

export function usePlayerSession() {
  const context = useContext(PlayerSessionContext);
  if (!context) {
    throw new Error("usePlayerSession must be used within a PlayerSessionProvider");
  }
  return context;
}
