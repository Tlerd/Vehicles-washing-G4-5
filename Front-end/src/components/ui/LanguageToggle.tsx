import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { SUPPORTED_LANGS, type Lang } from '@/i18n';

export function LanguageToggle({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const active = i18n.language as Lang;

  return (
    <div
      className={cn(
        'flex items-center rounded-full border border-border bg-surface p-0.5 text-xs font-semibold',
        className,
      )}
      role="group"
      aria-label="Language"
    >
      {SUPPORTED_LANGS.map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => i18n.changeLanguage(lang)}
          className={cn(
            'rounded-full px-2.5 py-1 uppercase transition-colors',
            active === lang
              ? 'bg-primary text-white'
              : 'text-text-secondary hover:text-text-primary',
          )}
          aria-pressed={active === lang}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
