import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  description?: string;
  owner?: string;
  children: ReactNode;
};

export default function SectionCard({
  title,
  description,
  owner,
  children,
}: SectionCardProps) {
  return (
    <section className="section-card">
      <div className="section-card-header">
        <div>
          <h2 className="section-card-title">{title}</h2>
          {description ? <p className="section-card-copy">{description}</p> : null}
        </div>
        {owner ? <span className="owner-pill">{owner}</span> : null}
      </div>
      {children}
    </section>
  );
}
