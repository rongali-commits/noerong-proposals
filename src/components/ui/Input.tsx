import { type InputHTMLAttributes, type ReactNode, useId } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | null;
  hint?: string;
};

export function Input({ label, error, hint, className = '', id, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-ink-700 mb-1.5">
        {label}
      </label>
      <input
        id={inputId}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={`w-full rounded-md border bg-ivory-50 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 transition-colors focus:outline-none focus:ring-2 focus:ring-ink-400/30 focus:border-ink-400 ${
          error ? 'border-error-500' : 'border-ink-200'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-error-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-ink-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type FieldProps = {
  children: ReactNode;
};

export function FormField({ children }: FieldProps) {
  return <div className="space-y-1.5">{children}</div>;
}
