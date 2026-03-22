import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import {
  fetchMissions,
  fetchFeed,
  fetchFriends,
  fetchFriendSuggestions,
  fetchPendingRequests,
  fetchSentRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  searchUsers,
  fetchLeaderboard,
  generateMissions,
  toggleMissionComplete,
  regenerateMission,
  type MissionDto,
  type FeedPostDto,
  type FriendDto,
  type FriendSuggestionDto,
  type FriendRequestDto,
  type LeaderboardEntryDto,
  type SportType,
} from "../api/social";
import { readAuthSession } from "../lib/auth";

type SocialTab = "feed" | "friends" | "missions" | "leaderboard";

const SPORT_ICONS: Record<SportType, string> = {
  RUNNING: "🏃",
  GYM: "🏋️",
  CYCLING: "🚴",
  MOBILITY: "🧘",
  SWIMMING: "🏊",
  OTHER: "⚡",
};

const DEFAULT_CONTEXT = {
  primarySport: "RUNNING" as SportType,
  recentSessionCount: 6,
  sessionsBySport: { RUNNING: 3, GYM: 2, CYCLING: 1 } as Partial<Record<SportType, number>>,
  completedSessionCount: 5,
};

// ─── Progress circle component ───────────────────────────────────────────────

function ProgressCircle({
  completed,
  loading,
  onClick,
}: {
  completed: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  const r = 16;
  const circumference = 2 * Math.PI * r;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      title={completed ? "Mark as not done" : "Mark as done"}
      style={{
        background: "none",
        border: "none",
        cursor: loading ? "wait" : "pointer",
        padding: 0,
        flexShrink: 0,
      }}
    >
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={r} fill="none" stroke="var(--color-border, #334155)" strokeWidth="3" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke={completed ? "#22c55e" : "#6366f1"}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={completed ? 0 : circumference}
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
          style={{ transition: "stroke-dashoffset 0.45s ease, stroke 0.2s ease" }}
        />
        {completed && (
          <text x="20" y="25" textAnchor="middle" fontSize="13" fill="#22c55e">✓</text>
        )}
      </svg>
    </button>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function SocialHubPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SocialTab>("feed");
  const [userId, setUserId] = useState<string | null>(null);

  // Missions state
  const [missions, setMissions] = useState<MissionDto[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loadingMissions, setLoadingMissions] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [missionsError, setMissionsError] = useState<string | null>(null);

  // Feed state
  const [feedPosts, setFeedPosts] = useState<FeedPostDto[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);

  // Friends state
  const [friends, setFriends] = useState<FriendDto[]>([]);
  const [friendSuggestions, setFriendSuggestions] = useState<FriendSuggestionDto[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequestDto[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequestDto[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [actionFriendId, setActionFriendId] = useState<string | null>(null);
  const [actionRequestId, setActionRequestId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FriendSuggestionDto[]>([]);
  const [searching, setSearching] = useState(false);

  // Leaderboard state
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntryDto[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Load user id from auth session (real logged-in user)
  useEffect(() => {
    const session = readAuthSession();
    if (session?.user.id) {
      setUserId(session.user.id);
    }
  }, []);

  const loadMissions = useCallback(async (uid: string) => {
    setLoadingMissions(true);
    setMissionsError(null);
    try {
      const data = await fetchMissions(uid);
      setMissions(data.missions);
      setTotalPoints(data.totalPoints);
    } catch {
      setMissions([]);
    } finally {
      setLoadingMissions(false);
    }
  }, []);

  const loadFeed = useCallback(async (uid: string) => {
    setLoadingFeed(true);
    try {
      const data = await fetchFeed(uid);
      setFeedPosts(data.posts);
    } catch {
      setFeedPosts([]);
    } finally {
      setLoadingFeed(false);
    }
  }, []);

  const loadFriends = useCallback(async (uid: string) => {
    setLoadingFriends(true);
    try {
      const [friendData, suggestionData, requestData, sentData] = await Promise.all([
        fetchFriends(uid),
        fetchFriendSuggestions(uid),
        fetchPendingRequests(uid),
        fetchSentRequests(uid),
      ]);
      setFriends(friendData.friends);
      setFriendSuggestions(suggestionData.suggestions);
      setPendingRequests(requestData.requests);
      setSentRequests(sentData.requests);
    } catch {
      setFriends([]);
      setFriendSuggestions([]);
      setPendingRequests([]);
    } finally {
      setLoadingFriends(false);
    }
  }, []);

  const loadLeaderboard = useCallback(async () => {
    setLoadingLeaderboard(true);
    try {
      const data = await fetchLeaderboard();
      setLeaderboardEntries(data.entries);
    } catch {
      setLeaderboardEntries([]);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "missions" && userId) loadMissions(userId);
    if (activeTab === "feed" && userId) {
      loadFeed(userId);
    }
    if (activeTab === "friends" && userId) {
      loadFriends(userId);
    }
    if (activeTab === "leaderboard") loadLeaderboard();
  }, [activeTab, userId, loadMissions, loadFeed, loadFriends, loadLeaderboard]);

  async function handleGenerate() {
    if (!userId) return;
    setGeneratingAll(true);
    setMissionsError(null);
    try {
      const data = await generateMissions(userId, DEFAULT_CONTEXT);
      setMissions(data.missions);
      setTotalPoints(data.totalPoints);
    } catch (err) {
      setMissionsError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGeneratingAll(false);
    }
  }

  async function handleToggleComplete(mission: MissionDto) {
    if (!userId) return;
    setTogglingId(mission.id);
    try {
      const result = await toggleMissionComplete(mission.id, userId);
      setMissions((prev) => prev.map((m) => (m.id === result.mission.id ? result.mission : m)));
      setTotalPoints(result.totalPoints);
      // Refresh leaderboard when points change.
      if (result.mission.completed) {
        loadLeaderboard();
      }
    } catch {
      // silently ignore
    } finally {
      setTogglingId(null);
    }
  }

  async function handleRegenerate(mission: MissionDto) {
    if (!userId) return;
    setRegeneratingId(mission.id);
    setMissionsError(null);
    try {
      const result = await regenerateMission(mission.id, userId, DEFAULT_CONTEXT);
      setMissions((prev) => prev.map((m) => (m.id === mission.id ? result.mission : m)));
    } catch (err) {
      setMissionsError(err instanceof Error ? err.message : "Regeneration failed");
    } finally {
      setRegeneratingId(null);
    }
  }

  async function handleSendRequest(receiverId: string) {
    if (!userId) return;
    setActionFriendId(receiverId);
    try {
      await sendFriendRequest(userId, receiverId);
      await loadFriends(userId);
    } catch { /* ignore */ } finally {
      setActionFriendId(null);
    }
  }

  async function handleAcceptRequest(requestId: string) {
    if (!userId) return;
    setActionRequestId(requestId);
    try {
      await acceptFriendRequest(requestId, userId);
      await Promise.all([loadFriends(userId), loadFeed(userId)]);
    } catch { /* ignore */ } finally {
      setActionRequestId(null);
    }
  }

  async function handleRejectRequest(requestId: string) {
    if (!userId) return;
    setActionRequestId(requestId);
    try {
      await rejectFriendRequest(requestId, userId);
      await loadFriends(userId);
    } catch { /* ignore */ } finally {
      setActionRequestId(null);
    }
  }

  async function handleCancelRequest(requestId: string) {
    if (!userId) return;
    setActionRequestId(requestId);
    try {
      await cancelFriendRequest(requestId, userId);
      setSentRequests((prev) => prev.filter((r) => r.id !== requestId));
      await loadFriends(userId);
    } catch { /* ignore */ } finally {
      setActionRequestId(null);
    }
  }

  async function handleRemoveFriend(friendId: string) {
    if (!userId) return;
    setActionFriendId(friendId);
    try {
      await removeFriend(userId, friendId);
      await Promise.all([loadFriends(userId), loadFeed(userId)]);
    } catch { /* ignore */ } finally {
      setActionFriendId(null);
    }
  }

  useEffect(() => {
    if (!userId || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchUsers(userId, searchQuery);
        setSearchResults(data.results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, userId]);

  const completedCount = missions.filter((m) => m.completed).length;

  return (
    <div className="route-page">
      <PageHeader
        eyebrow="Community"
        title="Social hub"
        description="Discover your friends' activities, earn points through missions, and climb the leaderboard!"
        badge=""
      />

      <div className="tab-row">
        {[
          { id: "feed", label: "Activity feed" },
          { id: "friends", label: "Friends" },
          { id: "missions", label: "Weekly missions" },
          { id: "leaderboard", label: "Leaderboard" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as SocialTab)}
            className={activeTab === tab.id ? "tab-button tab-button-active" : "tab-button"}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "feed" && (
        <SectionCard
          title="Activity feed"
          description=""
        >
          <div className="stack-sm">
            {loadingFeed && (
              <p className="section-card-copy">Loading feed…</p>
            )}
            {!loadingFeed && feedPosts.length === 0 && (
              <p className="section-card-copy">
                No friend activity yet. Add friends, then their completed sessions and missions will appear here.
              </p>
            )}
            {!loadingFeed && feedPosts.map((post) => {
              let parsed: Record<string, unknown> = {};
              try { parsed = JSON.parse(post.content) as Record<string, unknown>; } catch { /* */ }
              const activityType = (parsed["type"] as string) ?? "session_completed";
              const sport = (parsed["sport"] as SportType) ?? "OTHER";
              const sessionTitle = (parsed["sessionTitle"] as string) ?? post.content;
              const missionTitle = (parsed["missionTitle"] as string) ?? post.content;
              const rewardPoints = parsed["rewardPoints"] as number | undefined;
              const elapsed = Math.round((Date.now() - new Date(post.createdAt).getTime()) / 60000);
              const when = elapsed < 1 ? "just now" : elapsed < 60 ? `${elapsed} min ago` : `${Math.round(elapsed / 60)} h ago`;

              return (
                <div
                  key={post.id}
                  className="mini-panel"
                  style={{
                    display: "grid",
                    gap: "0.5rem",
                    borderLeft: activityType === "mission_completed" ? "4px solid #f59e0b" : "4px solid #22c55e",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                    <strong>{post.displayName}</strong>
                    <span
                      className="owner-pill owner-pill-subtle"
                      style={{
                        background: activityType === "mission_completed" ? "rgba(245, 158, 11, 0.14)" : "rgba(34, 197, 94, 0.14)",
                        color: activityType === "mission_completed" ? "#b45309" : "#15803d",
                      }}
                    >
                      {activityType === "mission_completed" ? "Mission completed" : "Session completed"}
                    </span>
                  </div>

                  {activityType === "mission_completed" ? (
                    <>
                      <p style={{ margin: 0 }}>{SPORT_ICONS[sport]} completed mission <em>{missionTitle}</em></p>
                      {rewardPoints !== undefined && (
                        <p className="section-card-copy" style={{ margin: 0 }}>+{rewardPoints} pts earned</p>
                      )}
                    </>
                  ) : (
                    <p style={{ margin: 0 }}>{SPORT_ICONS[sport]} validated session <em>{sessionTitle}</em></p>
                  )}

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                    <span className="section-card-copy" style={{ margin: 0 }}>
                      {sport.charAt(0)}{sport.slice(1).toLowerCase()}
                    </span>
                    <span className="owner-pill owner-pill-subtle">{when}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {activeTab === "friends" && (
        <SectionCard
          title="Friends"
          description="Manage your friends and discover athletes from the platform."
        >
          <div className="stack-sm">

            {/* Pending friend requests */}
            {!loadingFriends && pendingRequests.length > 0 && (
              <div className="mini-panel" style={{ borderLeft: "3px solid #f59e0b" }}>
                <strong style={{ color: "#b45309" }}>
                  Friend requests ({pendingRequests.length})
                </strong>
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", marginTop: "0.6rem", flexWrap: "wrap" }}
                  >
                    <div>
                      <strong>{req.senderDisplayName}</strong>
                      <p className="section-card-copy" style={{ margin: 0 }}>wants to be your friend</p>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        type="button"
                        className="primary-button"
                        style={{ padding: "0.35rem 0.7rem", fontSize: "0.82rem" }}
                        disabled={actionRequestId === req.id}
                        onClick={() => handleAcceptRequest(req.id)}
                      >
                        {actionRequestId === req.id ? "…" : "Accept"}
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        style={{ padding: "0.35rem 0.7rem", fontSize: "0.82rem" }}
                        disabled={actionRequestId === req.id}
                        onClick={() => handleRejectRequest(req.id)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sent requests */}
            {!loadingFriends && sentRequests.length > 0 && (
              <div className="mini-panel" style={{ borderLeft: "3px solid #6366f1" }}>
                <strong style={{ color: "#4338ca" }}>
                  Sent requests ({sentRequests.length})
                </strong>
                {sentRequests.map((req) => (
                  <div
                    key={req.id}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", marginTop: "0.6rem", flexWrap: "wrap" }}
                  >
                    <div>
                      <strong>{req.senderDisplayName}</strong>
                      <p className="section-card-copy" style={{ margin: 0 }}>Waiting for response…</p>
                    </div>
                    <button
                      type="button"
                      className="secondary-button"
                      style={{ padding: "0.35rem 0.7rem", fontSize: "0.82rem", color: "#dc2626" }}
                      disabled={actionRequestId === req.id}
                      onClick={() => handleCancelRequest(req.id)}
                    >
                      {actionRequestId === req.id ? "…" : "Cancel"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Friend list */}
            <div className="mini-panel">
              <strong>Your friends</strong>
              {loadingFriends && <p className="section-card-copy">Loading friends...</p>}
              {!loadingFriends && friends.length === 0 && (
                <p className="section-card-copy">You do not have any friends yet.</p>
              )}
              {!loadingFriends && friends.map((friend) => (
                <div
                  key={friend.id}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", marginTop: "0.6rem", flexWrap: "wrap" }}
                >
                  <div>
                    <strong>{friend.displayName}</strong>
                    <p className="section-card-copy" style={{ margin: 0 }}>Connected athlete</p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      className="secondary-button"
                      style={{ padding: "0.35rem 0.7rem", fontSize: "0.82rem" }}
                      onClick={() => navigate(`/profile/${friend.id}`)}
                    >
                      View profile
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      style={{ padding: "0.35rem 0.7rem", fontSize: "0.82rem", color: "#dc2626" }}
                      disabled={actionFriendId === friend.id}
                      onClick={() => handleRemoveFriend(friend.id)}
                    >
                      {actionFriendId === friend.id ? "…" : "Remove"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Search */}
            <div className="mini-panel">
              <strong>Search athletes</strong>
              <input
                type="text"
                className="field-input"
                placeholder="Search by name…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ marginTop: "0.6rem" }}
              />
              {searching && <p className="section-card-copy" style={{ marginTop: 6 }}>Searching…</p>}
              {!searching && searchQuery.trim() && searchResults.length === 0 && (
                <p className="section-card-copy" style={{ marginTop: 6 }}>No results found.</p>
              )}
              {!searching && searchResults.map((user) => (
                <div
                  key={user.id}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", marginTop: "0.6rem", flexWrap: "wrap" }}
                >
                  <div>
                    <strong>{user.displayName}</strong>
                    <p className="section-card-copy" style={{ margin: 0 }}>
                      {SPORT_ICONS[user.primarySport]} {user.primarySport.toLowerCase()}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      className="secondary-button"
                      style={{ padding: "0.35rem 0.7rem", fontSize: "0.82rem" }}
                      onClick={() => navigate(`/profile/${user.id}`)}
                    >
                      Profile
                    </button>
                    {user.requestStatus === "pending_sent" ? (
                      <button
                        type="button"
                        className="secondary-button"
                        style={{ padding: "0.35rem 0.7rem", fontSize: "0.82rem", color: "#dc2626" }}
                        disabled={actionRequestId !== null}
                        onClick={() => {
                          const req = sentRequests.find((r) => r.senderDisplayName === user.displayName);
                          if (req) handleCancelRequest(req.id);
                          else loadFriends(userId!);
                        }}
                      >
                        Cancel request
                      </button>
                    ) : user.requestStatus === "pending_received" ? (
                      <button
                        type="button"
                        className="primary-button"
                        style={{ padding: "0.35rem 0.7rem", fontSize: "0.82rem" }}
                        disabled={actionRequestId !== null}
                        onClick={() => {
                          const req = pendingRequests.find((r) => r.senderId === user.id);
                          if (req) handleAcceptRequest(req.id);
                        }}
                      >
                        Accept
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="primary-button"
                        style={{ padding: "0.35rem 0.7rem", fontSize: "0.82rem" }}
                        disabled={actionFriendId === user.id}
                        onClick={async () => {
                          await handleSendRequest(user.id);
                          setSearchResults((prev) =>
                            prev.map((u) => u.id === user.id ? { ...u, requestStatus: "pending_sent" } : u)
                          );
                        }}
                      >
                        {actionFriendId === user.id ? "Sending…" : "Add friend"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Suggestions */}
            <div className="mini-panel">
              <strong>Suggested accounts</strong>
              {loadingFriends && <p className="section-card-copy">Loading suggestions...</p>}
              {!loadingFriends && friendSuggestions.length === 0 && (
                <p className="section-card-copy">No suggestions available right now.</p>
              )}
              {!loadingFriends && friendSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", marginTop: "0.6rem", flexWrap: "wrap" }}
                >
                  <div>
                    <strong>{suggestion.displayName}</strong>
                    <p className="section-card-copy" style={{ margin: 0 }}>
                      {SPORT_ICONS[suggestion.primarySport]} {suggestion.primarySport.toLowerCase()} · {suggestion.completedSessions} session{suggestion.completedSessions !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      className="secondary-button"
                      style={{ padding: "0.35rem 0.7rem", fontSize: "0.82rem" }}
                      onClick={() => navigate(`/profile/${suggestion.id}`)}
                    >
                      Profile
                    </button>
                    {suggestion.requestStatus === "pending_sent" ? (
                      <button
                        type="button"
                        className="secondary-button"
                        style={{ padding: "0.35rem 0.7rem", fontSize: "0.82rem", color: "#dc2626" }}
                        disabled={actionRequestId !== null}
                        onClick={() => {
                          const req = sentRequests.find((r) => r.senderDisplayName === suggestion.displayName);
                          if (req) handleCancelRequest(req.id);
                          else loadFriends(userId!);
                        }}
                      >
                        Cancel request
                      </button>
                    ) : suggestion.requestStatus === "pending_received" ? (
                      <button
                        type="button"
                        className="primary-button"
                        style={{ padding: "0.35rem 0.7rem", fontSize: "0.82rem" }}
                        disabled={actionRequestId !== null}
                        onClick={() => {
                          const req = pendingRequests.find((r) => r.senderId === suggestion.id);
                          if (req) handleAcceptRequest(req.id);
                        }}
                      >
                        Accept
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="primary-button"
                        style={{ padding: "0.35rem 0.7rem", fontSize: "0.82rem" }}
                        disabled={actionFriendId === suggestion.id}
                        onClick={() => handleSendRequest(suggestion.id)}
                      >
                        {actionFriendId === suggestion.id ? "Sending…" : "Add friend"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      )}

      {activeTab === "missions" && (
        <SectionCard
          title="AI weekly missions"
          description={
            missions.length > 0
              ? `${completedCount} / ${missions.length} completed this week`
              : "Your personalized challenges for the week, generated by AI."
          }
        >
          <div className="stack-sm">
            {/* Points banner */}
            {totalPoints > 0 && (
              <div className="mini-panel" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.25rem" }}>🏆</span>
                <div>
                  <strong>{totalPoints} pts earned</strong>
                  <p className="section-card-copy">Total from completed missions</p>
                </div>
              </div>
            )}

            {missionsError && (
              <div className="mini-panel">
                <p style={{ color: "#ef4444" }}>{missionsError}</p>
              </div>
            )}

            {loadingMissions && (
              <div className="mini-panel">
                <p className="section-card-copy">Loading your missions…</p>
              </div>
            )}

            {!loadingMissions && missions.length === 0 && !missionsError && (
              <p className="section-card-copy">
                No missions yet for this week. Generate your first set below.
              </p>
            )}

            {/* Mission cards */}
            {!loadingMissions && missions.map((mission) => (
              <div
                key={mission.id}
                className="mini-panel"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.875rem",
                  opacity: mission.completed ? 0.65 : 1,
                  transition: "opacity 0.3s ease",
                }}
              >
                <ProgressCircle
                  completed={mission.completed}
                  loading={togglingId === mission.id}
                  onClick={() => handleToggleComplete(mission)}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ textDecoration: mission.completed ? "line-through" : "none" }}>
                    {SPORT_ICONS[mission.sport as SportType] ?? "⚡"} {mission.title}
                  </strong>
                  <p>{mission.description}</p>
                  <p className="section-card-copy">
                    {mission.targetSessions} session{mission.targetSessions > 1 ? "s" : ""} ·{" "}
                    <strong>+{mission.rewardPoints} pts</strong>
                    {mission.completed && (
                      <span style={{ color: "#22c55e", marginLeft: "0.5rem" }}>✓ Done</span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRegenerate(mission)}
                  disabled={regeneratingId === mission.id || mission.completed}
                  title="Regenerate this mission"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: mission.completed ? "not-allowed" : "pointer",
                    fontSize: "1rem",
                    opacity: mission.completed ? 0.3 : 0.6,
                    flexShrink: 0,
                    padding: "0.25rem",
                  }}
                >
                  {regeneratingId === mission.id ? "⏳" : "🔄"}
                </button>
              </div>
            ))}

            <button
              type="button"
              className="primary-button"
              onClick={handleGenerate}
              disabled={generatingAll}
              style={{ marginTop: "0.5rem" }}
            >
              {generatingAll
                ? "Generating…"
                : missions.length > 0
                  ? "Regenerate all missions"
                  : "Generate my missions"}
            </button>
          </div>
        </SectionCard>
      )}

      {activeTab === "leaderboard" && (
        <SectionCard
          title="Leaderboard"
          description="Points earned through completed missions."
        >
          <div className="leaderboard-list">
            {loadingLeaderboard && (
              <p className="section-card-copy">Loading leaderboard…</p>
            )}
            {!loadingLeaderboard && leaderboardEntries.length === 0 && (
              <p className="section-card-copy">
                No points yet. Complete missions to appear here!
              </p>
            )}
            {!loadingLeaderboard && leaderboardEntries.map((entry) => (
              <div key={entry.userId} className="leaderboard-row">
                <span className="leaderboard-rank">#{entry.rank}</span>
                <strong>
                  {entry.userId === userId ? `${entry.displayName} (you)` : entry.displayName}
                </strong>
                <span>{entry.points} pts</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
