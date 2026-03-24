type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Back-compat avec les anciennes pages */
  subtitle?: string;
  badge?: string;
};

export default function PageHeader({
  eyebrow,
  title,
  description,
  subtitle,
  badge,
}: PageHeaderProps) {
  return (
    <header className="route-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="route-title">{title}</h1>
        {description || subtitle ? (
          <p className="route-copy">{description ?? subtitle}</p>
        ) : null}
      </div>
      {badge ? <div className="route-badge">{badge}</div> : null}
    </header>
  );
}
