import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import UserPage from 'flarum/forum/components/UserPage';
import type ItemList from 'flarum/common/utils/ItemList';

const NAV_ORDER = [
  'discussions',
  'posts',
  'recharge',
  'pay-history',
  'userMoneyHistory',
  'uploads',
  'mentions',
  'likes',
  'money-rewards',
  'ignored-users',
  'expLogs',
  'settings',
  'security',
];

const HIGH_PRIORITY = 1000;

function transformUserHref(href: string | null): string | null {
  if (!href || typeof window === 'undefined') {
    return null;
  }

  try {
    const url =
      href.startsWith('http://') || href.startsWith('https://')
        ? new URL(href)
        : new URL(href, window.location.origin);

    if (url.origin !== window.location.origin) {
      return null;
    }

    const match = url.pathname.match(/^\/u\/([^\/?#]+)(\/.*)?$/);

    if (!match) {
      return null;
    }

    const rest = match[2] ?? '';

    if (rest && rest !== '/') {
      return null;
    }

    url.pathname = `/u/${match[1]}/discussions`;

    return url.pathname + url.search + url.hash;
  } catch (error) {
    return null;
  }
}

function updatePostUserLinks(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const anchors = document.querySelectorAll<HTMLAnchorElement>('.PostUser-name a[href^="/u/"]');

  anchors.forEach((anchor) => {
    const newHref = transformUserHref(anchor.getAttribute('href'));

    if (newHref) {
      anchor.setAttribute('href', newHref);
    }
  });
}

function reorderUserNav(items: ItemList<unknown>): void {
  let priority = HIGH_PRIORITY;

  NAV_ORDER.forEach((key) => {
    if (!items.has(key)) {
      return;
    }

    const content = items.get(key);

    if (typeof content === 'undefined') {
      return;
    }

    items.add(key, content, priority);
    priority -= 10;
  });
}

app.initializers.add('aixueyuan/flarum-custom-css', () => {
  extend(UserPage.prototype, 'navItems', reorderUserNav);

  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }

  updatePostUserLinks();

  if ('MutationObserver' in window) {
    const observer = new MutationObserver((mutations) => {
      const shouldUpdate = mutations.some((mutation) => mutation.type === 'childList' && mutation.addedNodes.length > 0);

      if (shouldUpdate) {
        window.requestAnimationFrame(updatePostUserLinks);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }
});