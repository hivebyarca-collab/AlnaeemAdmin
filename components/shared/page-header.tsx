import type { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  actions,
  emoji,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  emoji?: string;
}) {
  return (
    <header className={`admin-page-header ${actions ? 'admin-page-header--split' : ''}`}>
      <div>
        <h1>{emoji ? <><span aria-hidden="true">{emoji}</span> {title}</> : title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions}
    </header>
  );
}
