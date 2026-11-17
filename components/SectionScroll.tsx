'use client';

import { useEffect } from 'react';

/** Strip a trailing slash so "/repo" and "/repo/" count as the same page. */
const samePath = (a: string, b: string) => a.replace(/\/$/, '') === b.replace(/\/$/, '');

/**
 * Keeps the homepage URL clean: no "#home", "#about", "#contact" in the
 * address bar.
 *
 * - Clicking any link to a section of this page smooth-scrolls to it without
 *   adding the hash (covers footer links, hero/process buttons, etc.).
 * - Arriving from another page via "/#contact" scrolls to that section, then
 *   removes the hash from the URL.
 *
 * Links keep their real "/#section" href, so they still work without JS.
 */
export default function SectionScroll() {
  useEffect(() => {
    const scrollToId = (id: string, smooth: boolean) => {
      const el = document.getElementById(id);
      if (!el) return false;
      el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
      return true;
    };

    const dropHash = () =>
      window.history.replaceState(
        window.history.state,
        '',
        window.location.pathname + window.location.search,
      );

    // Came here from another page with "/#section" → go there, then clean URL.
    if (window.location.hash) {
      const id = decodeURIComponent(window.location.hash.slice(1));
      requestAnimationFrame(() => {
        scrollToId(id, false);
        dropHash();
      });
    }

    // Capture phase runs before next/link's handler; preventDefault() makes
    // next/link skip its own navigation, so no hash is ever pushed.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // new tab etc.

      const link = (e.target as Element | null)?.closest?.('a');
      if (!link || link.target === '_blank' || !link.href) return;

      const url = new URL(link.href, window.location.href);
      if (!url.hash || url.hash === '#main') return; // #main = skip link, needs native focus
      if (url.origin !== window.location.origin) return;
      if (!samePath(url.pathname, window.location.pathname)) return;

      if (scrollToId(decodeURIComponent(url.hash.slice(1)), true)) e.preventDefault();
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
