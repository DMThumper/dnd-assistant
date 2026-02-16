import type {
  User,
  LoginResponse,
  RegisterResponse,
  AuthResponse,
  VerifyEmailResponse,
} from "@/types/auth";
import type {
  CampaignsResponse,
  CampaignResponse,
  CharactersResponse,
  CharacterResponse,
  ActiveCharacterResponse,
  Character,
  CampaignCharactersResponse,
  HpModificationType,
  Condition,
  CustomRule,
  XpAwardResult,
  InventoryItem,
  Currency,
  KillCharacterRequest,
  Act,
  GameSession,
  ActRequest,
  GameSessionRequest,
  ActStatus,
  GameSessionStatus,
  Display,
  DisplayRegistration,
  DisplayStatusResponse,
  DisplayPairRequest,
  DisplayCommandRequest,
  LevelUpCheckResponse,
  LevelUpOptionsResponse,
  LevelUpChoices,
  LiveSession,
  LiveSessionStatusResponse,
} from "@/types/game";
import type {
  CharacterCreationData,
  CreateCharacterRequest,
} from "@/types/character-creation";
import type {
  ClassesResponse,
  ClassDetailResponse,
  ClassResponse,
  CreateClassRequest,
  UpdateClassRequest,
  SettingsListResponse,
  RacesResponse,
  RaceDetailResponse,
  RaceResponse,
  CreateRaceRequest,
  UpdateRaceRequest,
  ParentRacesResponse,
  MonstersResponse,
  MonsterDetailResponse,
  MonsterResponse,
  CreateMonsterRequest,
  UpdateMonsterRequest,
  MonsterTypesResponse,
  SpellsResponse,
  SpellDetailResponse,
  SpellResponse,
  CreateSpellRequest,
  UpdateSpellRequest,
  SpellSchoolsResponse,
  SpellClassesResponse,
} from "@/types/backoffice";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const TOKEN_KEY = "dnd-auth-token";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
};

class ApiClient {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string | null) {
    if (typeof window === "undefined") return;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { method = "GET", body, headers = {} } = options;

    const token = this.getToken();

    const config: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
      // Note: We use Bearer tokens from localStorage, not cookies
      // So we don't need credentials: "include" which would conflict with Access-Control-Allow-Origin: *
    };

    if (body && method !== "GET") {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, config);

    // Handle 401 Unauthorized - clear token and throw error
    // The AuthContext will handle redirect via router.push()
    if (response.status === 401) {
      this.setToken(null);
      // Dispatch custom event for AuthContext to handle
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }
      throw new ApiClientError("Unauthorized", 401);
    }

    // Handle validation errors (422)
    if (response.status === 422) {
      const error = await response.json();
      throw new ApiClientError(
        error.message || "Validation error",
        422,
        error.errors
      );
    }

    // Handle 403 Forbidden (may include requires_verification)
    if (response.status === 403) {
      const error = await response.json();
      const apiError = new ApiClientError(
        error.message || "Forbidden",
        403,
        error.errors
      );
      // Attach requires_verification flag if present
      if (error.requires_verification) {
        (apiError as ApiClientError & { requiresVerification?: boolean }).requiresVerification = true;
      }
      throw apiError;
    }

    // Handle other errors
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Network error",
      }));
      throw new ApiClientError(
        error.message || "Request failed",
        response.status
      );
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    });

    if (response.data.access_token) {
      this.setToken(response.data.access_token);
    }

    return response;
  }

  async register(
    name: string,
    email: string,
    password: string,
    password_confirmation: string
  ) {
    return this.request<RegisterResponse>("/auth/register", {
      method: "POST",
      body: { name, email, password, password_confirmation },
    });
  }

  async logout() {
    try {
      await this.request<{ message: string }>("/auth/logout", {
        method: "POST",
      });
    } finally {
      this.setToken(null);
    }
  }

  async me() {
    return this.request<AuthResponse>("/auth/me").then((response) => ({
      ...response,
      data: { user: response.data as unknown as User },
    }));
  }

  async refresh() {
    const response = await this.request<{ token: string }>("/auth/refresh", {
      method: "POST",
    });

    if (response.data.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async resendVerification(email: string) {
    return this.request<{ message: string }>("/auth/resend-verification", {
      method: "POST",
      body: { email },
    });
  }

  async verifyEmail(id: string, hash: string, expires: string, signature: string) {
    const params = new URLSearchParams({ expires, signature });
    return this.request<VerifyEmailResponse>(
      `/auth/email/verify/${id}/${hash}?${params}`
    );
  }

  // Player endpoints
  async getPlayerCampaigns() {
    return this.request<CampaignsResponse>("/player/campaigns");
  }

  async getPlayerCampaign(campaignId: number) {
    return this.request<CampaignResponse>(`/player/campaigns/${campaignId}`);
  }

  async getPlayerCharacters(campaignId: number) {
    return this.request<CharactersResponse>(`/player/campaigns/${campaignId}/characters`);
  }

  async getActiveCharacter(campaignId: number) {
    return this.request<ActiveCharacterResponse>(`/player/campaigns/${campaignId}/characters/active`);
  }

  async getCharacter(characterId: number) {
    return this.request<CharacterResponse>(`/player/characters/${characterId}`);
  }

  async updateCharacter(characterId: number, data: Partial<Pick<Character, "current_hp" | "temp_hp" | "inspiration" | "death_saves" | "class_resources" | "currency">>) {
    return this.request<CharacterResponse>(`/player/characters/${characterId}`, {
      method: "PATCH",
      body: data,
    });
  }

  async getCharacterCreationData(campaignId: number) {
    return this.request<CharacterCreationData>(`/player/campaigns/${campaignId}/characters/creation-data`);
  }

  async createCharacter(campaignId: number, data: CreateCharacterRequest) {
    return this.request<CharacterResponse>(`/player/campaigns/${campaignId}/characters`, {
      method: "POST",
      body: data,
    });
  }

  async activateCharacter(characterId: number) {
    return this.request<CharacterResponse>(`/player/characters/${characterId}/activate`, {
      method: "POST",
    });
  }

  async deleteCharacter(characterId: number) {
    return this.request<{ message: string }>(`/player/characters/${characterId}`, {
      method: "DELETE",
    });
  }

  // Level-up endpoints
  async checkLevelUp(characterId: number) {
    return this.request<LevelUpCheckResponse>(`/player/characters/${characterId}/level-up/check`);
  }

  async getLevelUpOptions(characterId: number) {
    return this.request<LevelUpOptionsResponse>(`/player/characters/${characterId}/level-up/options`);
  }

  async levelUp(characterId: number, choices: LevelUpChoices) {
    return this.request<CharacterResponse>(`/player/characters/${characterId}/level-up`, {
      method: "POST",
      body: choices,
    });
  }

  // Backoffice endpoints
  async getCampaigns(params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<unknown[]>(`/backoffice/campaigns${query}`);
  }

  async getUsers(params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<unknown[]>(`/backoffice/users${query}`);
  }

  // Character Classes (Backoffice)
  async getClasses(params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<ClassesResponse>(`/backoffice/classes${query}`);
  }

  async getClass(id: number) {
    return this.request<ClassDetailResponse>(`/backoffice/classes/${id}`);
  }

  async createClass(data: CreateClassRequest) {
    return this.request<ClassResponse>("/backoffice/classes", {
      method: "POST",
      body: data,
    });
  }

  async updateClass(id: number, data: UpdateClassRequest) {
    return this.request<ClassResponse>(`/backoffice/classes/${id}`, {
      method: "PUT",
      body: data,
    });
  }

  async deleteClass(id: number) {
    return this.request<{ message: string }>(`/backoffice/classes/${id}`, {
      method: "DELETE",
    });
  }

  async getClassSettings() {
    return this.request<SettingsListResponse>("/backoffice/classes/settings");
  }

  // Races (Backoffice)
  async getRaces(params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<RacesResponse>(`/backoffice/races${query}`);
  }

  async getRace(id: number) {
    return this.request<RaceDetailResponse>(`/backoffice/races/${id}`);
  }

  async createRace(data: CreateRaceRequest) {
    return this.request<RaceResponse>("/backoffice/races", {
      method: "POST",
      body: data,
    });
  }

  async updateRace(id: number, data: UpdateRaceRequest) {
    return this.request<RaceResponse>(`/backoffice/races/${id}`, {
      method: "PUT",
      body: data,
    });
  }

  async deleteRace(id: number) {
    return this.request<{ message: string }>(`/backoffice/races/${id}`, {
      method: "DELETE",
    });
  }

  async getRaceSettings() {
    return this.request<SettingsListResponse>("/backoffice/races/settings");
  }

  async getParentRaces() {
    return this.request<ParentRacesResponse>("/backoffice/races/parents");
  }

  // Monsters (Backoffice)
  async getMonsters(params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<MonstersResponse>(`/backoffice/monsters${query}`);
  }

  async getMonster(id: number) {
    return this.request<MonsterDetailResponse>(`/backoffice/monsters/${id}`);
  }

  async createMonster(data: CreateMonsterRequest) {
    return this.request<MonsterResponse>("/backoffice/monsters", {
      method: "POST",
      body: data,
    });
  }

  async updateMonster(id: number, data: UpdateMonsterRequest) {
    return this.request<MonsterResponse>(`/backoffice/monsters/${id}`, {
      method: "PUT",
      body: data,
    });
  }

  async deleteMonster(id: number) {
    return this.request<{ message: string }>(`/backoffice/monsters/${id}`, {
      method: "DELETE",
    });
  }

  async getMonsterSettings() {
    return this.request<SettingsListResponse>("/backoffice/monsters/settings");
  }

  async getMonsterTypes() {
    return this.request<MonsterTypesResponse>("/backoffice/monsters/types");
  }

  // ===========================================================================
  // Spells (Backoffice)
  // ===========================================================================

  async getSpells(params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<SpellsResponse>(`/backoffice/spells${query}`);
  }

  async getSpell(id: number) {
    return this.request<SpellDetailResponse>(`/backoffice/spells/${id}`);
  }

  async createSpell(data: CreateSpellRequest) {
    return this.request<SpellResponse>("/backoffice/spells", {
      method: "POST",
      body: data,
    });
  }

  async updateSpell(id: number, data: UpdateSpellRequest) {
    return this.request<SpellResponse>(`/backoffice/spells/${id}`, {
      method: "PUT",
      body: data,
    });
  }

  async deleteSpell(id: number) {
    return this.request<{ message: string }>(`/backoffice/spells/${id}`, {
      method: "DELETE",
    });
  }

  async getSpellSettings() {
    return this.request<SettingsListResponse>("/backoffice/spells/settings");
  }

  async getSpellSchools() {
    return this.request<SpellSchoolsResponse>("/backoffice/spells/schools");
  }

  async getSpellClasses() {
    return this.request<SpellClassesResponse>("/backoffice/spells/classes");
  }

  // ===========================================================================
  // Campaign Control (DM character management)
  // ===========================================================================

  /**
   * Get all characters in a campaign (for DM control panel)
   */
  async getCampaignCharacters(campaignId: number) {
    return this.request<CampaignCharactersResponse>(
      `/backoffice/campaigns/${campaignId}/characters`
    );
  }

  /**
   * Modify character HP (damage, healing, temp HP, or set directly)
   */
  async modifyCharacterHp(
    characterId: number,
    amount: number,
    type: HpModificationType,
    source?: string
  ) {
    return this.request<CharacterResponse>(
      `/backoffice/characters/${characterId}/modify-hp`,
      {
        method: "POST",
        body: { amount, type, source },
      }
    );
  }

  /**
   * Add or remove a D&D condition from a character
   */
  async modifyCharacterConditions(
    characterId: number,
    action: "add" | "remove",
    condition: Condition
  ) {
    return this.request<CharacterResponse>(
      `/backoffice/characters/${characterId}/modify-conditions`,
      {
        method: "POST",
        body: { action, condition },
      }
    );
  }

  /**
   * Manage custom rules (add, update, remove perks/afflictions/curses)
   */
  async manageCustomRule(
    characterId: number,
    action: "add" | "update" | "remove",
    rule: CustomRule
  ) {
    return this.request<CharacterResponse>(
      `/backoffice/characters/${characterId}/custom-rules`,
      {
        method: "POST",
        body: { action, rule },
      }
    );
  }

  /**
   * Award XP to one or multiple characters
   */
  async awardXp(
    campaignId: number,
    characterIds: number[] | "all_active",
    amount: number,
    reason?: string
  ) {
    const body = characterIds === "all_active"
      ? { all_active: true, amount, reason }
      : { character_ids: characterIds, amount, reason };

    return this.request<{ result: XpAwardResult }>(
      `/backoffice/campaigns/${campaignId}/characters/award-xp`,
      {
        method: "POST",
        body,
      }
    );
  }

  /**
   * Give an item to a character
   */
  async giveItem(
    characterId: number,
    item: InventoryItem,
    quantity?: number,
    source?: string
  ) {
    return this.request<CharacterResponse>(
      `/backoffice/characters/${characterId}/give-item`,
      {
        method: "POST",
        body: { item, quantity: quantity ?? item.quantity, source },
      }
    );
  }

  /**
   * Modify character currency (add or subtract gold, silver, etc.)
   */
  async modifyCurrency(
    characterId: number,
    currencyType: keyof Currency,
    amount: number
  ) {
    return this.request<CharacterResponse>(
      `/backoffice/characters/${characterId}/modify-currency`,
      {
        method: "POST",
        body: { type: currencyType, amount },
      }
    );
  }

  /**
   * Toggle character inspiration
   */
  async toggleInspiration(characterId: number) {
    return this.request<CharacterResponse>(
      `/backoffice/characters/${characterId}/toggle-inspiration`,
      {
        method: "POST",
      }
    );
  }

  /**
   * Activate a character (DM version)
   */
  async activateCharacterDM(campaignId: number, characterId: number) {
    return this.request<CharacterResponse>(
      `/backoffice/campaigns/${campaignId}/characters/${characterId}/activate`,
      {
        method: "POST",
      }
    );
  }

  /**
   * Deactivate a character
   */
  async deactivateCharacter(campaignId: number, characterId: number) {
    return this.request<CharacterResponse>(
      `/backoffice/campaigns/${campaignId}/characters/${characterId}/deactivate`,
      {
        method: "POST",
      }
    );
  }

  /**
   * Kill a character (move to graveyard with death info)
   */
  async killCharacter(
    campaignId: number,
    characterId: number,
    deathInfo: KillCharacterRequest
  ) {
    return this.request<CharacterResponse>(
      `/backoffice/campaigns/${campaignId}/characters/${characterId}/kill`,
      {
        method: "POST",
        body: deathInfo,
      }
    );
  }

  // ===========================================================================
  // Acts (Campaign Story Structure)
  // ===========================================================================

  /**
   * Get all acts for a campaign
   */
  async getActs(campaignId: number) {
    return this.request<Act[]>(`/backoffice/campaigns/${campaignId}/acts`);
  }

  /**
   * Get a specific act
   */
  async getAct(campaignId: number, actId: number) {
    return this.request<Act>(
      `/backoffice/campaigns/${campaignId}/acts/${actId}`
    );
  }

  /**
   * Create a new act
   */
  async createAct(campaignId: number, data: ActRequest) {
    return this.request<Act>(`/backoffice/campaigns/${campaignId}/acts`, {
      method: "POST",
      body: data,
    });
  }

  /**
   * Update an act
   */
  async updateAct(campaignId: number, actId: number, data: Partial<ActRequest>) {
    return this.request<Act>(
      `/backoffice/campaigns/${campaignId}/acts/${actId}`,
      {
        method: "PATCH",
        body: data,
      }
    );
  }

  /**
   * Delete an act
   */
  async deleteAct(campaignId: number, actId: number) {
    return this.request<{ message: string }>(
      `/backoffice/campaigns/${campaignId}/acts/${actId}`,
      {
        method: "DELETE",
      }
    );
  }

  /**
   * Reorder acts
   */
  async reorderActs(campaignId: number, actIds: number[]) {
    return this.request<{ message: string }>(
      `/backoffice/campaigns/${campaignId}/acts/reorder`,
      {
        method: "POST",
        body: { act_ids: actIds },
      }
    );
  }

  /**
   * Update act status
   */
  async updateActStatus(campaignId: number, actId: number, status: ActStatus) {
    return this.request<Act>(
      `/backoffice/campaigns/${campaignId}/acts/${actId}/status`,
      {
        method: "POST",
        body: { status },
      }
    );
  }

  // ===========================================================================
  // Game Sessions (within Acts)
  // ===========================================================================

  /**
   * Get all sessions for an act
   */
  async getSessions(campaignId: number, actId: number) {
    return this.request<GameSession[]>(
      `/backoffice/campaigns/${campaignId}/acts/${actId}/sessions`
    );
  }

  /**
   * Get a specific session
   */
  async getSession(campaignId: number, actId: number, sessionId: number) {
    return this.request<GameSession>(
      `/backoffice/campaigns/${campaignId}/acts/${actId}/sessions/${sessionId}`
    );
  }

  /**
   * Create a new session
   */
  async createSession(campaignId: number, actId: number, data: GameSessionRequest) {
    return this.request<GameSession>(
      `/backoffice/campaigns/${campaignId}/acts/${actId}/sessions`,
      {
        method: "POST",
        body: data,
      }
    );
  }

  /**
   * Update a session
   */
  async updateSession(
    campaignId: number,
    actId: number,
    sessionId: number,
    data: Partial<GameSessionRequest>
  ) {
    return this.request<GameSession>(
      `/backoffice/campaigns/${campaignId}/acts/${actId}/sessions/${sessionId}`,
      {
        method: "PATCH",
        body: data,
      }
    );
  }

  /**
   * Delete a session
   */
  async deleteSession(campaignId: number, actId: number, sessionId: number) {
    return this.request<{ message: string }>(
      `/backoffice/campaigns/${campaignId}/acts/${actId}/sessions/${sessionId}`,
      {
        method: "DELETE",
      }
    );
  }

  /**
   * Reorder sessions within an act
   */
  async reorderSessions(campaignId: number, actId: number, sessionIds: number[]) {
    return this.request<{ message: string }>(
      `/backoffice/campaigns/${campaignId}/acts/${actId}/sessions/reorder`,
      {
        method: "POST",
        body: { session_ids: sessionIds },
      }
    );
  }

  /**
   * Update session status
   */
  async updateSessionStatus(
    campaignId: number,
    actId: number,
    sessionId: number,
    status: GameSessionStatus
  ) {
    return this.request<GameSession>(
      `/backoffice/campaigns/${campaignId}/acts/${actId}/sessions/${sessionId}/status`,
      {
        method: "POST",
        body: { status },
      }
    );
  }

  /**
   * Move session to another act
   */
  async moveSession(
    campaignId: number,
    actId: number,
    sessionId: number,
    targetActId: number
  ) {
    return this.request<GameSession>(
      `/backoffice/campaigns/${campaignId}/acts/${actId}/sessions/${sessionId}/move`,
      {
        method: "POST",
        body: { target_act_id: targetActId },
      }
    );
  }

  // ===========================================================================
  // Display Management (DM controls TV/monitor displays)
  // ===========================================================================

  /**
   * Get all displays for the current DM
   */
  async getDisplays() {
    return this.request<Display[]>("/backoffice/displays");
  }

  /**
   * Pair a display by code
   */
  async pairDisplay(data: DisplayPairRequest) {
    return this.request<Display>("/backoffice/displays/pair", {
      method: "POST",
      body: data,
    });
  }

  /**
   * Disconnect a display
   */
  async disconnectDisplay(displayId: number) {
    return this.request<{ message: string }>(`/backoffice/displays/${displayId}`, {
      method: "DELETE",
    });
  }

  /**
   * Send command to a display
   */
  async sendDisplayCommand(displayId: number, command: DisplayCommandRequest) {
    return this.request<{ message: string }>(
      `/backoffice/displays/${displayId}/command`,
      {
        method: "POST",
        body: command,
      }
    );
  }

  /**
   * Get displays for a specific campaign
   */
  async getCampaignDisplays(campaignId: number) {
    return this.request<Display[]>(`/backoffice/campaigns/${campaignId}/displays`);
  }

  // ===========================================================================
  // Display Client endpoints (for TV/monitor device itself)
  // ===========================================================================

  /**
   * Register a new display (gets pairing code)
   */
  async registerDisplay() {
    return this.request<DisplayRegistration>("/display/register", {
      method: "POST",
    });
  }

  /**
   * Get display status (for polling or after reconnect)
   * @param token Display token from registration
   */
  async getDisplayStatus(token: string) {
    return this.request<DisplayStatusResponse>("/display/status", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * Refresh display pairing code
   * @param token Display token from registration
   */
  async refreshDisplayCode(token: string) {
    return this.request<{ code: string; code_ttl: number }>("/display/refresh-code", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * Send heartbeat from display
   * @param token Display token from registration
   */
  async displayHeartbeat(token: string) {
    return this.request<{ status: string }>("/display/heartbeat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * Disconnect display (when display closes)
   * @param token Display token from registration
   */
  async disconnectDisplayClient(token: string) {
    return this.request<{ message: string }>("/display/disconnect", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // ===========================================================================
  // Live Session (Real-time Game Session Management)
  // ===========================================================================

  /**
   * Get live session status for a campaign (DM)
   */
  async getLiveSessionStatus(campaignId: number) {
    return this.request<LiveSessionStatusResponse>(
      `/backoffice/campaigns/${campaignId}/live-session`
    );
  }

  /**
   * Start a live session (DM only)
   */
  async startLiveSession(campaignId: number, gameSessionId?: number) {
    return this.request<LiveSession>(
      `/backoffice/campaigns/${campaignId}/live-session/start`,
      {
        method: "POST",
        body: gameSessionId ? { game_session_id: gameSessionId } : {},
      }
    );
  }

  /**
   * Stop a live session (DM only)
   */
  async stopLiveSession(campaignId: number) {
    return this.request<LiveSession>(
      `/backoffice/campaigns/${campaignId}/live-session/stop`,
      {
        method: "POST",
      }
    );
  }

  /**
   * Get live session history for a campaign
   */
  async getLiveSessionHistory(campaignId: number) {
    return this.request<LiveSession[]>(
      `/backoffice/campaigns/${campaignId}/live-session/history`
    );
  }

  /**
   * Get live session status for a campaign (Player)
   */
  async getPlayerLiveSessionStatus(campaignId: number) {
    return this.request<LiveSessionStatusResponse>(
      `/player/campaigns/${campaignId}/live-session`
    );
  }
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export const api = new ApiClient();
export type { User };
