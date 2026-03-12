type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
};

export default function PageHeader({
  eyebrow,
  title,
  description,
  badge,
}: PageHeaderProps) {
  return (
    <header className="route-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="route-title">{title}</h1>
        <p className="route-copy">{description}</p>
      </div>
      {badge ? <div className="route-badge">{badge}</div> : null}
    </header>
  );
}
