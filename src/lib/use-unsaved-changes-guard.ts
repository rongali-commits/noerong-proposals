import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export type UnsavedChangesGuard = {
  showDialog: boolean;
  handleLeave: () => void;
  handleCancel: () => void;
  requestNavigation: (target: string) => void;
};

/**
 * Guards a page that has unsaved form changes.
 *
 * - Internal SPA link clicks are intercepted and confirmed via the dialog.
 * - Browser Back/Forward (popstate) is intercepted and confirmed.
 * - Reload, close, and external navigation trigger the native beforeunload prompt.
 *
 * The caller renders a ConfirmDialog using `showDialog`, `handleLeave`, and
 * `handleCancel`, and calls `requestNavigation(target)` from its own Cancel
 * button so that the same guard logic applies.
 */
export function useUnsavedChangesGuard(
  isDirty: () => boolean,
): UnsavedChangesGuard {
  const navigate = useNavigate();
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  const skipGuardRef = useRef(false);
  const [showDialog, setShowDialog] = useState(false);
  const pendingTargetRef = useRef<string | null>(null);
  const originalUrlRef = useRef('');

  useEffect(() => {
    originalUrlRef.current =
      window.location.pathname +
      window.location.search +
      window.location.hash;
  }, []);

  const requestNavigation = useCallback(
    (target: string) => {
      if (skipGuardRef.current || !isDirtyRef.current()) {
        navigate(target);
        return;
      }
      pendingTargetRef.current = target;
      setShowDialog(true);
    },
    [navigate],
  );

  const handleLeave = useCallback(() => {
    setShowDialog(false);
    const target = pendingTargetRef.current;
    pendingTargetRef.current = null;
    if (target) {
      skipGuardRef.current = true;
      navigate(target);
      setTimeout(() => {
        skipGuardRef.current = false;
      }, 0);
    }
  }, [navigate]);

  const handleCancel = useCallback(() => {
    setShowDialog(false);
    pendingTargetRef.current = null;
  }, []);

  // beforeunload: reload, close, external navigation
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirtyRef.current()) {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // popstate: browser Back/Forward
  useEffect(() => {
    function onPopState(e: PopStateEvent) {
      if (skipGuardRef.current) return;
      if (!isDirtyRef.current()) return;

      const targetUrl =
        window.location.pathname +
        window.location.search +
        window.location.hash;

      if (targetUrl === originalUrlRef.current) return;

      // Restore the original URL so the user stays on this page
      window.history.pushState(null, '', originalUrlRef.current);

      // Prevent BrowserRouter from processing this popstate
      e.stopImmediatePropagation();

      pendingTargetRef.current = targetUrl;
      setShowDialog(true);
    }

    window.addEventListener('popstate', onPopState, true);
    return () => window.removeEventListener('popstate', onPopState, true);
  }, []);

  // Click interception: internal SPA links
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (skipGuardRef.current || !isDirtyRef.current()) return;

      const target = e.target as HTMLElement | null;
      if (!target || typeof target.closest !== 'function') return;
      const anchor = target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      if (anchor.target === '_blank') return;
      if (anchor.hasAttribute('download')) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (e.button !== 0) return;

      let url: URL;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;

      // Don't block hash-only navigation on the same page
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      )
        return;

      e.preventDefault();
      e.stopPropagation();

      pendingTargetRef.current = url.pathname + url.search + url.hash;
      setShowDialog(true);
    }

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return {
    showDialog,
    handleLeave,
    handleCancel,
    requestNavigation,
  };
}
