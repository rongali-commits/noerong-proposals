import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

type PageHeaderProps = {
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
  backTo?: string;
  backLabel?: string;
};

export function PageHeader({ title, eyebrow, actions, backTo, backLabel }: PageHeaderProps) {
  return (
    <div className="mb-8">
      {backTo && (
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-700 transition-colors mb-4"
        >
          <ArrowLeft size={15} />
          {backLabel ?? 'Back'}
        </Link>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {eyebrow && (
            <p className="text-2xs font-medium uppercase tracking-[0.18em] text-ink-400 mb-2">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl md:text-3xl text-ink-900 font-serif">{title}</h1>
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}
