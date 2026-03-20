import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  type EventPropGetter,
  type SlotInfo,
  type ToolbarProps,
} from "react-big-calendar";
import {
  addDays,
  addMonths,
  addWeeks,
  format,
  getDay,
  parse,
  startOfWeek,
} from "date-fns";
import { enUS } from "date-fns/locale";
import {
  Bike,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Dumbbell,
  PersonStanding,
  Plus,
  LogOut,
} from "lucide-react";
import {
  createPlannerSession,
  deletePlannerSession,
  fetchSessions,
  updatePlannerSession,
  type CyclingCompletedData,
  type GymCompletedData,
  type MobilityCompletedData,
  type PlannerCompletedData,
  type PlannerProfile,
  type PlannerSessionDto,
  type PlannerSport,
  type RunningCompletedData,
} from "../api/planner";
import { readAuthSession } from "../lib/auth";
import { clearAuthSession } from "../lib/auth";
import { useNavigate } from "react-router-dom";

type SessionSport = "Running" | "Gym" | "Cycling" | "Mobility";
type SessionStatus = "PLANNED" | "COMPLETED" | "CANCELED";
type CalendarView = "month" | "week" | "day";

type CompletionFormState = {
  distanceKm: string;
  durationMinutes: string;
  elevationGainM: string;
  exercisesCount: string;
  totalSets: string;
  totalLoadKg: string;
  focusArea: string;
};

type SessionEvent = {
  id: string;
  userId: string;
  title: string;
  sport: SessionSport;
  start: Date;
  end: Date;
  notes: string;
  location: string;
  status: SessionStatus;
  completedData: PlannerCompletedData | null;
};

type FormState = {
  title: string;
  sport: SessionSport;
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
  location: string;
  isCompleted: boolean;
  completionData: CompletionFormState;
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

const defaultCompletionData = (): CompletionFormState => ({
  distanceKm: "",
  durationMinutes: "",
  elevationGainM: "",
  exercisesCount: "",
  totalSets: "",
  totalLoadKg: "",
  focusArea: "",
});

const defaultFormData: FormState = {
  title: "",
  sport: "Running",
  date: "2026-03-16",
  startTime: "18:00",
  endTime: "19:00",
  notes: "",
  location: "",
  isCompleted: false,
  completionData: defaultCompletionData(),
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

function completionDataToFormState(
  sport: SessionSport,
  completedData: PlannerCompletedData | null,
): CompletionFormState {
  const formState = defaultCompletionData();

  if (!completedData) {
    return formState;
  }

  if (sport === "Running" || sport === "Cycling") {
    const enduranceData = completedData as
      | RunningCompletedData
      | CyclingCompletedData;
    return {
      ...formState,
      distanceKm: String(enduranceData.distanceKm),
      durationMinutes: String(enduranceData.durationMinutes),
      elevationGainM: String(enduranceData.elevationGainM),
    };
  }

  if (sport === "Gym") {
    const gymData = completedData as GymCompletedData;
    return {
      ...formState,
      exercisesCount: String(gymData.exercisesCount),
      totalSets: String(gymData.totalSets),
      totalLoadKg: String(gymData.totalLoadKg),
    };
  }

  const mobilityData = completedData as MobilityCompletedData;
  return {
    ...formState,
    durationMinutes: String(mobilityData.durationMinutes),
    focusArea: mobilityData.focusArea,
  };
}

function buildCompletedData(
  formData: FormState,
): PlannerCompletedData | undefined {
  if (!formData.isCompleted) {
    return undefined;
  }

  const numberField = (value: string, label: string, allowZero = false) => {
    const parsed = Number(value);

    if (
      !Number.isFinite(parsed) ||
      (!allowZero && parsed <= 0) ||
      (allowZero && parsed < 0)
    ) {
      throw new Error(`${label} is invalid.`);
    }

    return parsed;
  };

  if (formData.sport === "Running" || formData.sport === "Cycling") {
    return {
      distanceKm: numberField(formData.completionData.distanceKm, "Distance"),
      durationMinutes: numberField(
        formData.completionData.durationMinutes,
        "Time",
      ),
      elevationGainM: numberField(
        formData.completionData.elevationGainM,
        "Elevation gain",
        true,
      ),
    };
  }

  if (formData.sport === "Gym") {
    return {
      exercisesCount: numberField(
        formData.completionData.exercisesCount,
        "Exercises count",
      ),
      totalSets: numberField(formData.completionData.totalSets, "Total sets"),
      totalLoadKg: numberField(
        formData.completionData.totalLoadKg,
        "Total load",
        true,
      ),
    };
  }

  const focusArea = formData.completionData.focusArea.trim();

  if (!focusArea) {
    throw new Error("Focus area is required.");
  }

  return {
    durationMinutes: numberField(
      formData.completionData.durationMinutes,
      "Duration",
    ),
    focusArea,
  };
}

function formatCompletedSummary(event: SessionEvent) {
  if (event.status !== "COMPLETED" || !event.completedData) {
    return null;
  }

  if (event.sport === "Running" || event.sport === "Cycling") {
    const enduranceData = event.completedData as
      | RunningCompletedData
      | CyclingCompletedData;
    return `${enduranceData.distanceKm} km, ${enduranceData.durationMinutes} min, ${enduranceData.elevationGainM} m+`;
  }

  if (event.sport === "Gym") {
    const gymData = event.completedData as GymCompletedData;
    return `${gymData.exercisesCount} exercises, ${gymData.totalSets} sets, ${gymData.totalLoadKg} kg`;
  }

  const mobilityData = event.completedData as MobilityCompletedData;
  return `${mobilityData.durationMinutes} min, ${mobilityData.focusArea}`;
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
    status: session.status,
    completedData: session.completedData,
  };
}

function SportIcon({ sport }: { sport: SessionSport }) {
  if (sport === "Running") return <PersonStanding className="icon-sm" />;
  if (sport === "Cycling") return <Bike className="icon-sm" />;
  return <Dumbbell className="icon-sm" />;
}

function PlannerCalendarToolbar({
  date,
  view,
  onNavigate,
  onView,
}: ToolbarProps<SessionEvent, object>) {
  const label =
    view === "month"
      ? format(date, "MMMM yyyy")
      : view === "week"
        ? `${format(startOfWeek(date), "d MMM")} - ${format(addDays(startOfWeek(date), 6), "d MMM yyyy")}`
        : format(date, "EEEE d MMMM yyyy");

  return (
    <div className="planner-toolbar">
      <div className="planner-toolbar-row">
        <button
          type="button"
          className="secondary-button"
          onClick={() => onNavigate("PREV")}
        >
          Back
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => onNavigate("TODAY")}
        >
          Today
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => onNavigate("NEXT")}
        >
          Next
        </button>
      </div>

      <p className="planner-toolbar-label">{label}</p>

      <div className="planner-toolbar-row">
        <button
          type="button"
          className={view === "month" ? "primary-button" : "secondary-button"}
          onClick={() => onView("month")}
        >
          Month
        </button>
        <button
          type="button"
          className={view === "week" ? "primary-button" : "secondary-button"}
          onClick={() => onView("week")}
        >
          Week
        </button>
        <button
          type="button"
          className={view === "day" ? "primary-button" : "secondary-button"}
          onClick={() => onView("day")}
        >
          Day
        </button>
      </div>
    </div>
  );
}

export default function PlannerPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PlannerProfile | null>(null);
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SessionEvent | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormState>(defaultFormData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<CalendarView>("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    let isMounted = true;

    async function loadPlannerData() {
      try {
        setIsLoading(true);

        const session = readAuthSession();
        if (!session?.user.id) {
          navigate("/login");
          return;
        }

        // Build a synthetic PlannerProfile from the auth session
        const nextProfile: PlannerProfile = {
          id: session.user.id,
          email: session.user.email,
          displayName: session.user.displayName,
          avatarUrl: session.user.avatarUrl ?? null,
          profile: {
            primarySport: "RUNNING",
            bio: null,
            timezone: "Europe/Paris",
          },
        };
        const nextSessions = await fetchSessions(session.user.id);

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
          error instanceof Error
            ? error.message
            : "Unable to load planner data.",
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
    const completed = events.filter(
      (event) => event.status === "COMPLETED",
    ).length;
    return { total, running, gym, completed };
  }, [events]);

  const todaySessions = useMemo(() => {
    const today = new Date();
    const todayKey = format(today, "yyyy-MM-dd");

    return events
      .filter((event) => format(event.start, "yyyy-MM-dd") === todayKey)
      .sort(
        (firstEvent, secondEvent) =>
          firstEvent.start.getTime() - secondEvent.start.getTime(),
      );
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
      isCompleted: false,
      completionData: defaultCompletionData(),
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
      isCompleted: event.status === "COMPLETED",
      completionData: completionDataToFormState(
        event.sport,
        event.completedData,
      ),
    });
    setShowForm(true);
  };

  const handleSubmit = async (
    submitEvent: React.FormEvent<HTMLFormElement>,
  ) => {
    submitEvent.preventDefault();

    if (!profile) {
      return;
    }

    const start = new Date(`${formData.date}T${formData.startTime}`);
    const end = new Date(`${formData.date}T${formData.endTime}`);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      setErrorMessage("Start and end times are invalid.");
      return;
    }

    let completedData: PlannerCompletedData | undefined;

    try {
      completedData = buildCompletedData(formData);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Completion data is invalid.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const payload = {
        title: formData.title.trim(),
        sport: uiSportToPlannerSport(formData.sport),
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        notes: formData.notes.trim(),
        location: formData.location.trim(),
        status: formData.isCompleted
          ? ("COMPLETED" as const)
          : ("PLANNED" as const),
        completedData,
      };

      if (selectedEvent) {
        const updatedSession = await updatePlannerSession(
          selectedEvent.id,
          payload,
        );

        setEvents((previousEvents) =>
          previousEvents.map((event) =>
            event.id === selectedEvent.id
              ? toSessionEvent(updatedSession)
              : event,
          ),
        );
      } else {
        const createdSession = await createPlannerSession({
          userId: profile.id,
          ...payload,
        });

        setEvents((previousEvents) => [
          ...previousEvents,
          toSessionEvent(createdSession),
        ]);
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
        error instanceof Error
          ? error.message
          : "Unable to delete the session.",
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
      border:
        event.status === "COMPLETED"
          ? "1px solid rgba(22, 163, 74, 0.35)"
          : "1px solid rgba(17, 24, 39, 0.08)",
      padding: "2px 6px",
      fontSize: "0.85rem",
      opacity: event.status === "COMPLETED" ? 0.92 : 1,
    },
  });

  const handleCalendarNavigate = (
    action: "PREV" | "NEXT" | "TODAY" | "DATE",
  ) => {
    if (action === "TODAY") {
      setCurrentDate(new Date());
      setCurrentView("day");
      return;
    }

    if (action === "PREV") {
      setCurrentDate((previousDate) =>
        currentView === "month"
          ? addMonths(previousDate, -1)
          : currentView === "week"
            ? addWeeks(previousDate, -1)
            : addDays(previousDate, -1),
      );
      return;
    }

    if (action === "NEXT") {
      setCurrentDate((previousDate) =>
        currentView === "month"
          ? addMonths(previousDate, 1)
          : currentView === "week"
            ? addWeeks(previousDate, 1)
            : addDays(previousDate, 1),
      );
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

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
            <button
              onClick={openCreateForm}
              className="primary-button"
              type="button"
            >
              <Plus className="icon-sm" />
              Add session
            </button>
            <div className="user-badge">
              Account{" "}
              <span>
                {readAuthSession()?.user.email ??
                  profile?.email ??
                  "Loading..."}
              </span>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={handleLogout}
            >
              <LogOut className="icon-sm" />
              Sign out
            </button>
          </div>
        </header>

        <section className="panel" style={{ marginBottom: "1.5rem" }}>
          <h2 className="panel-title">Today sessions</h2>
          {todaySessions.length > 0 ? (
            <div className="today-session-list">
              {todaySessions.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  className="today-session-card"
                  onClick={() => handleSelectEvent(event)}
                >
                  <div className="session-chip-row">
                    <span className={sportStyles[event.sport]}>
                      <SportIcon sport={event.sport} />
                      {event.sport}
                    </span>
                    {event.status === "COMPLETED" ? (
                      <span className="chip chip-completed">Completed</span>
                    ) : null}
                  </div>
                  <p className="session-title">{event.title}</p>
                  <p className="session-copy">
                    {format(event.start, "HH:mm")} -{" "}
                    {format(event.end, "HH:mm")}
                  </p>
                  {event.location ? (
                    <p className="session-copy">{event.location}</p>
                  ) : null}
                </button>
              ))}
            </div>
          ) : (
            <p className="panel-copy">No session planned for today.</p>
          )}
        </section>

        {errorMessage ? (
          <section
            className="panel"
            style={{ marginBottom: "1.5rem", borderColor: "#fca5a5" }}
          >
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
            <div className="stat-label">
              <CheckCircle2 className="icon-sm" />
              <span>Completed</span>
            </div>
            <p className="stat-value">{stats.completed}</p>
          </div>
          <div className="stat-card">
            <p className="muted-label">Running</p>
            <p className="stat-value">{stats.running}</p>
          </div>
          <div className="stat-card">
            <p className="muted-label">Gym</p>
            <p className="stat-value">{stats.gym}</p>
          </div>
        </section>

        <section className="content-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Calendar overview</h2>
                <p className="panel-copy">
                  Click a slot to create a session, or click an event to edit
                  it.
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
                    date={currentDate}
                    view={currentView}
                    selectable
                    popup
                    views={["month", "week", "day"]}
                    step={30}
                    onNavigate={(date, view, action) => {
                      if (action === "TODAY") {
                        setCurrentDate(new Date());
                        setCurrentView("day");
                        return;
                      }

                      if (action === "DATE") {
                        setCurrentDate(date);
                        if (
                          view === "month" ||
                          view === "week" ||
                          view === "day"
                        ) {
                          setCurrentView(view);
                        }
                        return;
                      }

                      if (date) {
                        setCurrentDate(date);
                        return;
                      }

                      if (action === "PREV" || action === "NEXT") {
                        handleCalendarNavigate(action);
                      }
                    }}
                    onView={(view) => {
                      if (
                        view === "month" ||
                        view === "week" ||
                        view === "day"
                      ) {
                        setCurrentView(view);
                      }
                    }}
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    eventPropGetter={eventPropGetter}
                    components={{
                      toolbar: PlannerCalendarToolbar,
                    }}
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
                  .map((event) => {
                    const completedSummary = formatCompletedSummary(event);

                    return (
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
                              {event.status === "COMPLETED" ? (
                                <span className="chip chip-completed">
                                  Completed
                                </span>
                              ) : null}
                            </div>
                            <p className="session-title">{event.title}</p>
                            <p className="session-copy">
                              {format(event.start, "EEE d MMM - HH:mm")} -{" "}
                              {format(event.end, "HH:mm")}
                            </p>
                            {event.location ? (
                              <p className="session-copy">{event.location}</p>
                            ) : null}
                            {completedSummary ? (
                              <p className="session-copy session-copy-strong">
                                {completedSummary}
                              </p>
                            ) : null}
                          </div>
                          <Clock3 className="session-icon" />
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </section>
      </div>

      {showForm ? (
        <div className="modal-backdrop">
          <div className="modal-card planner-modal-card">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">
                  {selectedEvent ? "Edit session" : "Create session"}
                </h2>
                <p className="panel-copy">
                  Plan the session and add actual results once it is done.
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="ghost-button ghost-button-round"
                type="button"
                aria-label="Close modal"
              >
                x
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
                      completionData: defaultCompletionData(),
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
                      setFormData({
                        ...formData,
                        startTime: event.target.value,
                      })
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

              <label className="completion-toggle">
                <input
                  type="checkbox"
                  checked={formData.isCompleted}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      isCompleted: event.target.checked,
                    })
                  }
                />
                <span>Mark this session as done</span>
              </label>

              {formData.isCompleted ? (
                <div className="completion-panel">
                  <div className="completion-panel-header">
                    <h3 className="completion-panel-title">
                      Completed session data
                    </h3>
                    <p className="panel-copy">
                      {formData.sport === "Running" ||
                      formData.sport === "Cycling"
                        ? "Add distance, time and elevation gain."
                        : formData.sport === "Gym"
                          ? "Add exercises count, total sets and total load."
                          : "Add session duration and the main focus area."}
                    </p>
                  </div>

                  {(formData.sport === "Running" ||
                    formData.sport === "Cycling") && (
                    <div className="two-column-grid">
                      <div>
                        <label className="field-label" htmlFor="distance-km">
                          Distance (km)
                        </label>
                        <input
                          id="distance-km"
                          type="number"
                          min="0"
                          step="0.1"
                          value={formData.completionData.distanceKm}
                          onChange={(event) =>
                            setFormData({
                              ...formData,
                              completionData: {
                                ...formData.completionData,
                                distanceKm: event.target.value,
                              },
                            })
                          }
                          className="field-input"
                          required
                        />
                      </div>
                      <div>
                        <label
                          className="field-label"
                          htmlFor="duration-minutes"
                        >
                          Time (min)
                        </label>
                        <input
                          id="duration-minutes"
                          type="number"
                          min="0"
                          step="1"
                          value={formData.completionData.durationMinutes}
                          onChange={(event) =>
                            setFormData({
                              ...formData,
                              completionData: {
                                ...formData.completionData,
                                durationMinutes: event.target.value,
                              },
                            })
                          }
                          className="field-input"
                          required
                        />
                      </div>
                      <div className="field-span-two">
                        <label className="field-label" htmlFor="elevation-gain">
                          Elevation gain (m)
                        </label>
                        <input
                          id="elevation-gain"
                          type="number"
                          min="0"
                          step="1"
                          value={formData.completionData.elevationGainM}
                          onChange={(event) =>
                            setFormData({
                              ...formData,
                              completionData: {
                                ...formData.completionData,
                                elevationGainM: event.target.value,
                              },
                            })
                          }
                          className="field-input"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {formData.sport === "Gym" && (
                    <div className="two-column-grid">
                      <div>
                        <label
                          className="field-label"
                          htmlFor="exercises-count"
                        >
                          Exercises
                        </label>
                        <input
                          id="exercises-count"
                          type="number"
                          min="1"
                          step="1"
                          value={formData.completionData.exercisesCount}
                          onChange={(event) =>
                            setFormData({
                              ...formData,
                              completionData: {
                                ...formData.completionData,
                                exercisesCount: event.target.value,
                              },
                            })
                          }
                          className="field-input"
                          required
                        />
                      </div>
                      <div>
                        <label className="field-label" htmlFor="total-sets">
                          Total sets
                        </label>
                        <input
                          id="total-sets"
                          type="number"
                          min="1"
                          step="1"
                          value={formData.completionData.totalSets}
                          onChange={(event) =>
                            setFormData({
                              ...formData,
                              completionData: {
                                ...formData.completionData,
                                totalSets: event.target.value,
                              },
                            })
                          }
                          className="field-input"
                          required
                        />
                      </div>
                      <div className="field-span-two">
                        <label className="field-label" htmlFor="total-load">
                          Total load (kg)
                        </label>
                        <input
                          id="total-load"
                          type="number"
                          min="0"
                          step="0.5"
                          value={formData.completionData.totalLoadKg}
                          onChange={(event) =>
                            setFormData({
                              ...formData,
                              completionData: {
                                ...formData.completionData,
                                totalLoadKg: event.target.value,
                              },
                            })
                          }
                          className="field-input"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {formData.sport === "Mobility" && (
                    <div className="two-column-grid">
                      <div>
                        <label
                          className="field-label"
                          htmlFor="mobility-duration"
                        >
                          Duration (min)
                        </label>
                        <input
                          id="mobility-duration"
                          type="number"
                          min="1"
                          step="1"
                          value={formData.completionData.durationMinutes}
                          onChange={(event) =>
                            setFormData({
                              ...formData,
                              completionData: {
                                ...formData.completionData,
                                durationMinutes: event.target.value,
                              },
                            })
                          }
                          className="field-input"
                          required
                        />
                      </div>
                      <div>
                        <label className="field-label" htmlFor="focus-area">
                          Focus area
                        </label>
                        <input
                          id="focus-area"
                          type="text"
                          value={formData.completionData.focusArea}
                          onChange={(event) =>
                            setFormData({
                              ...formData,
                              completionData: {
                                ...formData.completionData,
                                focusArea: event.target.value,
                              },
                            })
                          }
                          placeholder="Hips, shoulders, full body..."
                          className="field-input"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

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
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={isSubmitting}
                  >
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
