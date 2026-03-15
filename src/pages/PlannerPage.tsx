import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  dateFnsLocalizer,
  type EventPropGetter,
  type SlotInfo,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import {
  Plus,
  CalendarDays,
  Clock3,
  Dumbbell,
  Bike,
  PersonStanding,
} from "lucide-react";
import {
  createPlannerSession,
  deletePlannerSession,
  fetchSessions,
  fetchTestProfile,
  updatePlannerSession,
  type PlannerProfile,
  type PlannerSessionDto,
  type PlannerSport,
} from "../api/planner";

type SessionSport = "Running" | "Gym" | "Cycling" | "Mobility";

type SessionEvent = {
  id: string;
  userId: string;
  title: string;
  sport: SessionSport;
  start: Date;
  end: Date;
  notes: string;
  location: string;
};

type FormState = {
  title: string;
  sport: SessionSport;
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
  location: string;
};

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const defaultFormData: FormState = {
  title: "",
  sport: "Running",
  date: "2026-03-16",
  startTime: "18:00",
  endTime: "19:00",
  notes: "",
  location: "",
};

const sportStyles: Record<SessionSport, string> = {
  Running: "chip chip-running",
  Gym: "chip chip-gym",
  Cycling: "chip chip-cycling",
  Mobility: "chip chip-mobility",
};

const sportColors: Record<SessionSport, string> = {
  Running: "#dbeafe",
  Gym: "#ede9fe",
  Cycling: "#d1fae5",
  Mobility: "#fef3c7",
};

function plannerSportToUiSport(sport: PlannerSport): SessionSport {
  if (sport === "GYM") return "Gym";
  if (sport === "CYCLING") return "Cycling";
  if (sport === "MOBILITY") return "Mobility";
  return "Running";
}

function uiSportToPlannerSport(sport: SessionSport): PlannerSport {
  if (sport === "Gym") return "GYM";
  if (sport === "Cycling") return "CYCLING";
  if (sport === "Mobility") return "MOBILITY";
  return "RUNNING";
}

function toSessionEvent(session: PlannerSessionDto): SessionEvent {
  return {
    id: session.id,
    userId: session.userId,
    title: session.title,
    sport: plannerSportToUiSport(session.sport),
    start: new Date(session.startAt),
    end: new Date(session.endAt),
    notes: session.notes ?? "",
    location: session.location ?? "",
  };
}

function SportIcon({ sport }: { sport: SessionSport }) {
  if (sport === "Running") return <PersonStanding className="icon-sm" />;
  if (sport === "Cycling") return <Bike className="icon-sm" />;
  return <Dumbbell className="icon-sm" />;
}

export default function PlannerPage() {
  const [profile, setProfile] = useState<PlannerProfile | null>(null);
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SessionEvent | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormState>(defaultFormData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPlannerData() {
      try {
        setIsLoading(true);
        const nextProfile = await fetchTestProfile();
        const nextSessions = await fetchSessions(nextProfile.id);

        if (!isMounted) {
          return;
        }

        setProfile(nextProfile);
        setEvents(nextSessions.map(toSessionEvent));
        setErrorMessage(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load planner data.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadPlannerData();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = events.length;
    const running = events.filter((event) => event.sport === "Running").length;
    const gym = events.filter((event) => event.sport === "Gym").length;
    const cycling = events.filter((event) => event.sport === "Cycling").length;
    return { total, running, gym, cycling };
  }, [events]);

  const openCreateForm = () => {
    setSelectedEvent(null);
    setFormData(defaultFormData);
    setShowForm(true);
  };

  const handleSelectSlot = ({ start, end }: SlotInfo) => {
    const slotStart = Array.isArray(start) ? start[0] : start;
    const slotEnd = Array.isArray(end) ? end[0] : end;

    if (!(slotStart instanceof Date) || !(slotEnd instanceof Date)) {
      return;
    }

    setSelectedEvent(null);
    setFormData({
      title: "",
      sport: "Running",
      date: format(slotStart, "yyyy-MM-dd"),
      startTime: format(slotStart, "HH:mm"),
      endTime: format(slotEnd, "HH:mm"),
      notes: "",
      location: "",
    });
    setShowForm(true);
  };

  const handleSelectEvent = (event: SessionEvent) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      sport: event.sport,
      date: format(event.start, "yyyy-MM-dd"),
      startTime: format(event.start, "HH:mm"),
      endTime: format(event.end, "HH:mm"),
      notes: event.notes,
      location: event.location,
    });
    setShowForm(true);
  };

  const handleSubmit = async (submitEvent: React.FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();

    if (!profile) {
      return;
    }

    const start = new Date(`${formData.date}T${formData.startTime}`);
    const end = new Date(`${formData.date}T${formData.endTime}`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      setErrorMessage("Start and end times are invalid.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      if (selectedEvent) {
        const updatedSession = await updatePlannerSession(selectedEvent.id, {
          title: formData.title,
          sport: uiSportToPlannerSport(formData.sport),
          startAt: start.toISOString(),
          endAt: end.toISOString(),
          notes: formData.notes,
          location: formData.location,
        });

        setEvents((previousEvents) =>
          previousEvents.map((event) =>
            event.id === selectedEvent.id ? toSessionEvent(updatedSession) : event,
          ),
        );
      } else {
        const createdSession = await createPlannerSession({
          userId: profile.id,
          title: formData.title,
          sport: uiSportToPlannerSport(formData.sport),
          startAt: start.toISOString(),
          endAt: end.toISOString(),
          notes: formData.notes,
          location: formData.location,
        });

        setEvents((previousEvents) => [...previousEvents, toSessionEvent(createdSession)]);
      }

      setShowForm(false);
      setSelectedEvent(null);
      setFormData(defaultFormData);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save the session.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await deletePlannerSession(selectedEvent.id);
      setEvents((previousEvents) =>
        previousEvents.filter((event) => event.id !== selectedEvent.id),
      );
      setShowForm(false);
      setSelectedEvent(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to delete the session.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const eventPropGetter: EventPropGetter<SessionEvent> = (event) => ({
    style: {
      backgroundColor: sportColors[event.sport] ?? "#e5e7eb",
      color: "#111827",
      borderRadius: "10px",
      border: "1px solid rgba(17, 24, 39, 0.08)",
      padding: "2px 6px",
      fontSize: "0.85rem",
    },
  });

  return (
    <div className="page-shell">
      <div className="page-container">
        <header className="topbar">
          <div>
            <p className="eyebrow">Athlete Planner</p>
            <h1 className="page-title">Training Calendar</h1>
            <p className="page-copy">
              Plan, edit and visualize your upcoming sports sessions.
            </p>
          </div>

          <div className="topbar-actions">
            <button onClick={openCreateForm} className="primary-button" type="button">
              <Plus className="icon-sm" />
              Add session
            </button>
            <Link to="/performance" className="secondary-button secondary-link-button">
              View performance
            </Link>
            <div className="user-badge">
              Test profile <span>{profile?.email ?? "Loading..."}</span>
            </div>
          </div>
        </header>

        {profile ? (
          <section className="panel" style={{ marginBottom: "1.5rem" }}>
            <h2 className="panel-title">{profile.displayName}</h2>
            <p className="panel-copy">
              {profile.profile.bio} Primary sport:{" "}
              {plannerSportToUiSport(profile.profile.primarySport)}.
            </p>
          </section>
        ) : null}

        {errorMessage ? (
          <section className="panel" style={{ marginBottom: "1.5rem", borderColor: "#fca5a5" }}>
            <p className="panel-copy">{errorMessage}</p>
          </section>
        ) : null}

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">
              <CalendarDays className="icon-sm" />
              <span>Total sessions</span>
            </div>
            <p className="stat-value">{stats.total}</p>
          </div>
          <div className="stat-card">
            <p className="muted-label">Running</p>
            <p className="stat-value">{stats.running}</p>
          </div>
          <div className="stat-card">
            <p className="muted-label">Gym</p>
            <p className="stat-value">{stats.gym}</p>
          </div>
          <div className="stat-card">
            <p className="muted-label">Cycling</p>
            <p className="stat-value">{stats.cycling}</p>
          </div>
        </section>

        <section className="content-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Calendar overview</h2>
                <p className="panel-copy">
                  Click a slot to create a session, or click an event to edit it.
                </p>
              </div>
            </div>

            <div className="calendar-frame">
              <div className="calendar-shell">
                {isLoading ? (
                  <p className="panel-copy">Loading planner data...</p>
                ) : (
                  <Calendar<SessionEvent>
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    selectable
                    popup
                    views={["month", "week", "day", "agenda"]}
                    defaultView="week"
                    step={30}
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    eventPropGetter={eventPropGetter}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="sidebar-stack">
            <div className="panel">
              <h2 className="panel-title">Upcoming sessions</h2>
              <div className="session-list">
                {events
                  .slice()
                  .sort(
                    (firstEvent, secondEvent) =>
                      firstEvent.start.getTime() - secondEvent.start.getTime(),
                  )
                  .map((event) => (
                    <button
                      key={event.id}
                      onClick={() => handleSelectEvent(event)}
                      className="session-card"
                      type="button"
                    >
                      <div className="session-row">
                        <div>
                          <div className="session-chip-row">
                            <span className={sportStyles[event.sport]}>
                              <SportIcon sport={event.sport} />
                              {event.sport}
                            </span>
                          </div>
                          <p className="session-title">{event.title}</p>
                          <p className="session-copy">
                            {format(event.start, "EEE d MMM • HH:mm")} - {format(event.end, "HH:mm")}
                          </p>
                          {event.location ? (
                            <p className="session-copy">{event.location}</p>
                          ) : null}
                        </div>
                        <Clock3 className="session-icon" />
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            <div className="panel">
              <h2 className="panel-title">Testing mode</h2>
              <ul className="ideas-list">
                <li>The planner uses the backend for load, create, update and delete.</li>
                <li>The fake profile is served by `/api/planner/test-profile`.</li>
                <li>If Supabase is unavailable, the backend falls back to in-memory data.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      {showForm ? (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">
                  {selectedEvent ? "Edit session" : "Create session"}
                </h2>
                <p className="panel-copy">Fill the form to plan a new workout.</p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="ghost-button ghost-button-round"
                type="button"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="form-stack">
              <div>
                <label className="field-label" htmlFor="session-title">
                  Session title
                </label>
                <input
                  id="session-title"
                  type="text"
                  value={formData.title}
                  onChange={(event) =>
                    setFormData({ ...formData, title: event.target.value })
                  }
                  placeholder="Example: Tempo Run - 6 km"
                  className="field-input"
                  required
                />
              </div>

              <div>
                <label className="field-label" htmlFor="session-sport">
                  Sport
                </label>
                <select
                  id="session-sport"
                  value={formData.sport}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      sport: event.target.value as SessionSport,
                    })
                  }
                  className="field-input"
                >
                  <option value="Running">Running</option>
                  <option value="Gym">Gym</option>
                  <option value="Cycling">Cycling</option>
                  <option value="Mobility">Mobility</option>
                </select>
              </div>

              <div>
                <label className="field-label" htmlFor="session-date">
                  Date
                </label>
                <input
                  id="session-date"
                  type="date"
                  value={formData.date}
                  onChange={(event) =>
                    setFormData({ ...formData, date: event.target.value })
                  }
                  className="field-input"
                  required
                />
              </div>

              <div className="two-column-grid">
                <div>
                  <label className="field-label" htmlFor="session-start">
                    Start
                  </label>
                  <input
                    id="session-start"
                    type="time"
                    value={formData.startTime}
                    onChange={(event) =>
                      setFormData({ ...formData, startTime: event.target.value })
                    }
                    className="field-input"
                    required
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="session-end">
                    End
                  </label>
                  <input
                    id="session-end"
                    type="time"
                    value={formData.endTime}
                    onChange={(event) =>
                      setFormData({ ...formData, endTime: event.target.value })
                    }
                    className="field-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="field-label" htmlFor="session-location">
                  Location
                </label>
                <input
                  id="session-location"
                  type="text"
                  value={formData.location}
                  onChange={(event) =>
                    setFormData({ ...formData, location: event.target.value })
                  }
                  placeholder="Track, gym, park..."
                  className="field-input"
                />
              </div>

              <div>
                <label className="field-label" htmlFor="session-notes">
                  Notes
                </label>
                <textarea
                  id="session-notes"
                  rows={4}
                  value={formData.notes}
                  onChange={(event) =>
                    setFormData({ ...formData, notes: event.target.value })
                  }
                  placeholder="Optional details about the session"
                  className="field-input field-textarea"
                />
              </div>

              <div className="form-actions">
                <div>
                  {selectedEvent ? (
                    <button
                      type="button"
                      onClick={() => void handleDelete()}
                      className="danger-button"
                      disabled={isSubmitting}
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
                <div className="action-row">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="secondary-button"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="primary-button" disabled={isSubmitting}>
                    {isSubmitting
                      ? "Saving..."
                      : selectedEvent
                        ? "Save changes"
                        : "Create session"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
