import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import { performanceHighlights, weeklyMetrics } from "../data/mockData";

export default function PerformancePage() {
  return (
    <div className="route-page">
      <PageHeader
        eyebrow="Performance"
        title="Analytics connected to the training planner"
        description="This page is the natural extension of the calendar: the teammate in charge can consume planner data and turn it into charts, trends and recommendations."
        badge="Owner suggestion: Member 3"
      />

      <div className="route-grid route-grid-3">
        {weeklyMetrics.map((metric) => (
          <SectionCard
            key={metric.label}
            title={metric.label}
            description={metric.delta}
            owner="Shared data contract with planner"
          >
            <p className="metric-value">{metric.value}</p>
          </SectionCard>
        ))}
      </div>

      <div className="route-grid route-grid-2">
        <SectionCard
          title="Planned integrations"
          description="Hooks already implied between planner and analytics."
        >
          <ul className="list-clean">
            <li>Read sessions from the planner store or API.</li>
            <li>Compute weekly volume, streaks, intensity balance.</li>
            <li>Expose charts and AI summary blocks.</li>
          </ul>
          <Link to="/planner" className="secondary-button secondary-link-button">
            Back to planner
          </Link>
        </SectionCard>

        <SectionCard
          title="Mock highlights"
          description="Temporary placeholders until real visualisations are built."
        >
          <div className="stack-sm">
            {performanceHighlights.map((item) => (
              <div key={item.title} className="mini-panel">
                <strong>{item.title}</strong>
                <p className="metric-value metric-value-small">{item.value}</p>
                <p className="section-card-copy">{item.insight}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
