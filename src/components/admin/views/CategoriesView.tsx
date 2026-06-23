import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Edit, GripVertical, MoreVertical, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { get } from '@/services/api';
import type { Category } from '@/types';
import { cn } from '@/utils/cn';
import { getLocalizedName } from '@/utils/i18nHelper';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CategoryModal } from '../components/Modals/CategoryModal';
import { DataTable, Td, Th } from '../components/DataTable';
import { SectionTitle } from '../components/SectionTitle';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { useActiveBranchId } from '../hooks/useActiveBranch';
import { useCategoryMutations } from '../hooks/useAdminMutations';

type AdminCategory = Category & {
  _count?: {
    products: number;
  };
};

export function CategoriesView() {
  const { t } = useTranslation();
  const branchId = useActiveBranchId();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | undefined>();
  const [deletingCategory, setDeletingCategory] = useState<AdminCategory | undefined>();
  const [orderedCategories, setOrderedCategories] = useState<AdminCategory[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const { createCategory, updateCategory, deleteCategory, reorderCategories } = useCategoryMutations(branchId);

  const { data: categories, isLoading, refetch } = useQuery({
    queryKey: ['categories', branchId, 'admin'],
    queryFn: () => get<AdminCategory[]>(`/branches/${branchId}/categories/admin`),
    enabled: !!branchId,
  });
  const categoryModalLoading = editingCategory ? updateCategory.isPending : createCategory.isPending;

  const sortedCategories = useMemo(
    () => [...(categories?.data || [])].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [categories?.data],
  );

  useEffect(() => {
    setOrderedCategories(sortedCategories);
  }, [sortedCategories]);

  const openCreate = () => {
    setEditingCategory(undefined);
    setModalOpen(true);
  };

  const openEdit = (category: AdminCategory) => {
    setEditingCategory(category);
    setModalOpen(true);
  };

  const handleSubmit = (data: Record<string, unknown>) => {
    if (editingCategory) {
      updateCategory.mutate(
        { id: editingCategory.id, data },
        {
          onSuccess: () => {
            setModalOpen(false);
            setEditingCategory(undefined);
          },
        },
      );
      return;
    }

    createCategory.mutate(data, {
      onSuccess: () => setModalOpen(false),
    });
  };

  const moveCategory = (sourceId: string, targetId: string) => {
    const sourceIndex = orderedCategories.findIndex((category) => category.id === sourceId);
    const targetIndex = orderedCategories.findIndex((category) => category.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;

    const nextCategories = [...orderedCategories];
    const [movedCategory] = nextCategories.splice(sourceIndex, 1);
    nextCategories.splice(targetIndex, 0, movedCategory);
    setOrderedCategories(nextCategories);

    reorderCategories.mutate(nextCategories.map((category) => category.id), {
      onError: () => {
        setOrderedCategories(sortedCategories);
        refetch();
      },
    });
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title={t('admin.categories.title')}
        action={
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium">
            <Plus className="w-4 h-4" />
            {t('admin.categories.addCategory')}
          </button>
        }
      />

      <DataTable loading={isLoading} colSpan={7}>
        <thead className="bg-foreground-muted/5">
          <tr>
            <Th>
              <span className="sr-only">{t('admin.categories.dragHint')}</span>
            </Th>
            <Th>{t('admin.categories.icon')}</Th>
            <Th>{t('admin.name')}</Th>
            <Th>{t('admin.categories.languages')}</Th>
            <Th>{t('admin.categories.products')}</Th>
            <Th>{t('admin.status')}</Th>
            <Th right>{t('admin.actions')}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {orderedCategories.map((category) => {
            const productCount = category._count?.products || 0;
            const completedLanguages = [
              ['AZ', category.nameAz],
              ['EN', category.nameEn],
              ['RU', category.nameRu],
              ['TR', category.nameTr],
            ];

            return (
              <tr
                key={category.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const sourceId = event.dataTransfer.getData('categoryId') || draggedId;
                  if (sourceId) moveCategory(sourceId, category.id);
                  setDraggedId(null);
                }}
                className={cn(
                  'hover:bg-foreground-muted/5 transition-colors',
                  draggedId === category.id && 'opacity-50',
                )}
              >
                <Td className="w-10">
                  <button
                    type="button"
                    draggable
                    title={t('admin.categories.dragHint')}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('categoryId', category.id);
                      setDraggedId(category.id);
                    }}
                    onDragEnd={() => setDraggedId(null)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground-muted cursor-grab active:cursor-grabbing hover:bg-foreground-muted/10"
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                </Td>
                <Td>
                  <CategoryIcon
                    value={category.icon}
                    className="h-9 w-9 rounded-xl border border-border bg-surface-elevated shadow-sm"
                    iconClassName="h-4 w-4"
                  />
                </Td>
                <Td className="font-medium">{getLocalizedName(category)}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1.5">
                    {completedLanguages.map(([label, value]) => (
                      <span
                        key={label}
                        className={cn(
                          'inline-flex h-6 min-w-8 items-center justify-center rounded-full border px-2 text-[11px] font-semibold',
                          value
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                            : 'border-border bg-surface text-foreground-muted',
                        )}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </Td>
                <Td>{productCount}</Td>
                <Td>
                  <ToggleSwitch
                    checked={category.status === 'active'}
                    loading={updateCategory.isPending && (updateCategory.variables as any)?.id === category.id}
                    onChange={() => updateCategory.mutate({ id: category.id, data: { status: category.status === 'active' ? 'inactive' : 'active' } })}
                  />
                </Td>
                <Td right>
                  <CategoryActionsMenu
                    onEdit={() => openEdit(category)}
                    onDelete={() => setDeletingCategory(category)}
                  />
                </Td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>

      <CategoryModal
        open={modalOpen}
        category={editingCategory}
        loading={categoryModalLoading}
        onClose={() => {
          setModalOpen(false);
          setEditingCategory(undefined);
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deletingCategory}
        title={t('admin.categories.deleteTitle')}
        message={t('admin.categories.deleteConfirm', { name: getLocalizedName(deletingCategory) })}
        confirmLabel={t('common.delete')}
        loading={deleteCategory.isPending}
        onCancel={() => setDeletingCategory(undefined)}
        onConfirm={() => {
          if (!deletingCategory) return;
          deleteCategory.mutate(deletingCategory.id, {
            onSuccess: () => setDeletingCategory(undefined),
          });
        }}
      />
    </div>
  );
}

function CategoryActionsMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Menu>
      <MenuButton
        title={t('admin.actions')}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-foreground-muted hover:text-foreground hover:border-primary-500/50 focus:outline-none"
      >
        <MoreVertical className="h-4 w-4" />
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        className="z-[9999] w-56 rounded-xl border border-border bg-surface-elevated p-1 shadow-xl focus:outline-none"
      >
        <MenuAction icon={Edit} label={t('common.edit')} onClick={onEdit} />
        <MenuAction danger icon={Trash2} label={t('common.delete')} onClick={onDelete} />
      </MenuItems>
    </Menu>
  );
}

function MenuAction({
  icon: Icon,
  label,
  danger,
  onClick,
}: {
  icon: typeof Edit;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <MenuItem>
      {({ focus }) => (
        <button
          type="button"
          onClick={onClick}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
            danger ? 'text-red-600 dark:text-red-400' : 'text-foreground',
            focus && (danger ? 'bg-red-500/10' : 'bg-foreground-muted/10'),
          )}
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </button>
      )}
    </MenuItem>
  );
}
