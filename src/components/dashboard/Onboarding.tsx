import { type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

type ChecklistItem = {
  label: string;
  done: boolean;
  href?: string;
};

type OnboardingChecklistProps = {
  items: ChecklistItem[];
};

export function OnboardingChecklist({ items }: OnboardingChecklistProps) {
  const allDone = items.every((item) => item.done);

  return (
    <div className="rounded-lg border border-ink-200/60 bg-ivory-50 p-5">
      <h2 className="text-sm font-medium uppercase tracking-wider text-ink-400 mb-4">
        Getting started
      </h2>
      {allDone ? (
        <p className="text-sm text-ink-500">
          All set. Your workspace is ready to go.
        </p>
      ) : (
        <ol className="space-y-3">
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-3">
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full shrink-0 ${
                  item.done
                    ? 'bg-lime-300 text-ink-900'
                    : 'border border-ink-200 text-ink-300'
                }`}
                aria-hidden="true"
              >
                {item.done && <Check size={12} />}
              </span>
              {item.href && !item.done ? (
                <Link
                  to={item.href}
                  className="text-sm text-ink-700 hover:text-ink-900 underline underline-offset-4"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={`text-sm ${item.done ? 'text-ink-400' : 'text-ink-700'}`}
                >
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function SampleDataBanner({ onRemove, removing }: { onRemove: () => void; removing: boolean }) {
  return (
    <div className="rounded-md border border-lime-200 bg-lime-50/60 px-4 py-3 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-sm text-lime-800">
          This workspace contains fictional sample data for demonstration. Metrics include sample records.
        </p>
        <button
          onClick={onRemove}
          disabled={removing}
          className="text-sm text-lime-800 underline underline-offset-4 hover:text-lime-900 disabled:opacity-50 shrink-0"
        >
          {removing ? 'Removing...' : 'Remove sample data'}
        </button>
      </div>
    </div>
  );
}

export function SampleBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-lime-200 bg-lime-50 px-1.5 py-0.5 text-2xs font-medium uppercase tracking-wider text-lime-700">
      Sample
    </span>
  );
}

export function SampleDataActions({
  onLoad,
  onRemove,
  loading,
  removing,
  hasSample,
}: {
  onLoad: () => void;
  onRemove: () => void;
  loading: boolean;
  removing: boolean;
  hasSample: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {!hasSample && (
        <button
          onClick={onLoad}
          disabled={loading}
          className="text-sm text-ink-500 underline underline-offset-4 hover:text-ink-900 disabled:opacity-50"
        >
          {loading ? 'Loading sample data...' : 'Load sample workspace data'}
        </button>
      )}
      {hasSample && (
        <button
          onClick={onRemove}
          disabled={removing}
          className="text-sm text-ink-500 underline underline-offset-4 hover:text-ink-900 disabled:opacity-50"
        >
          {removing ? 'Removing sample data...' : 'Remove sample workspace data'}
        </button>
      )}
    </div>
  );
}

export function SampleConfirmDialogs({
  showLoad,
  showRemove,
  onLoadConfirm,
  onRemoveConfirm,
  onLoadCancel,
  onRemoveCancel,
  loadLoading,
  removeLoading,
}: {
  showLoad: boolean;
  showRemove: boolean;
  onLoadConfirm: () => void;
  onRemoveConfirm: () => void;
  onLoadCancel: () => void;
  onRemoveCancel: () => void;
  loadLoading: boolean;
  removeLoading: boolean;
}) {
  return (
    <>
      <ConfirmDialogWrapper
        open={showLoad}
        title="Load sample workspace?"
        message="This will add clearly labeled fictional clients, proposals, and activity to your workspace so you can explore the full product. All sample data is marked with a Sample badge and can be removed at any time. Your real data will not be affected."
        confirmLabel="Load sample data"
        onConfirm={onLoadConfirm}
        onCancel={onLoadCancel}
        loading={loadLoading}
      />
      <ConfirmDialogWrapper
        open={showRemove}
        title="Remove sample workspace?"
        message="This will permanently delete all sample clients and proposals from your workspace. Your real clients and proposals will not be affected."
        confirmLabel="Remove sample data"
        onConfirm={onRemoveConfirm}
        onCancel={onRemoveCancel}
        loading={removeLoading}
        variant="outline"
      />
    </>
  );
}

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

function ConfirmDialogWrapper(props: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  variant?: 'primary' | 'outline';
}) {
  return <ConfirmDialog {...props} />;
}
