import { useTranslation } from 'react-i18next';
import type { ServiceCategory } from '@/types';
import { cn } from '@/lib/utils';
import { CategoryIcon } from './CategoryIcon';

interface ServiceIconGridProps {
  categories: ServiceCategory[];
  countByCategory: Record<string, number>;
  onOpen: (categoryId: string) => void;
}

/** D-05: icon grid, COMBO group visually separated from SINGLE services. */
export function ServiceIconGrid({ categories, countByCategory, onOpen }: ServiceIconGridProps) {
  const { t } = useTranslation('booking');
  const combos = categories.filter((c) => c.kind === 'COMBO');
  const singles = categories.filter((c) => c.kind === 'SINGLE');

  return (
    <div className="space-y-6">
      {combos.length > 0 && (
        <Group
          title={t('categoryGrid.comboGroupTitle')}
          categories={combos}
          counts={countByCategory}
          onOpen={onOpen}
        />
      )}
      <Group
        title={t('categoryGrid.singleGroupTitle')}
        categories={singles}
        counts={countByCategory}
        onOpen={onOpen}
      />
    </div>
  );
}

function Group({
  title,
  categories,
  counts,
  onOpen,
}: {
  title: string;
  categories: ServiceCategory[];
  counts: Record<string, number>;
  onOpen: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">{title}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {categories.map((cat) => {
          const count = counts[cat.id] ?? 0;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onOpen(cat.id)}
              className={cn(
                'relative flex flex-col items-center gap-2 rounded-2xl border bg-surface p-4 text-center transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-sm',
                count > 0 ? 'border-primary ring-1 ring-primary' : 'border-border',
              )}
            >
              <span className="rounded-xl bg-primary-light/60 p-3 text-primary-dark">
                <CategoryIcon name={cat.icon} className="h-6 w-6" />
              </span>
              <span className="text-sm font-semibold text-text-primary">{cat.name}</span>
              {count > 0 && (
                <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-white">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
