import { type TextareaHTMLAttributes, useId } from 'react';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string | null;
  hint?: string;
};

export function Textarea({ label, error, hint, className = '', id, ...props }: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const describedBy = error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined;

  return (
    <div>
      <label htmlFor={textareaId} className="block text-sm font-medium text-ink-700 mb-1.5">
        {label}
      </label>
      <textarea
        id={textareaId}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={`w-full rounded-md border bg-ivory-50 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 transition-colors focus:outline-none focus:ring-2 focus:ring-ink-400/30 focus:border-ink-400 resize-y min-h-[88px] ${
          error ? 'border-error-500' : 'border-ink-200'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p id={`${textareaId}-error`} className="mt-1.5 text-xs text-error-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${textareaId}-hint`} className="mt-1.5 text-xs text-ink-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
