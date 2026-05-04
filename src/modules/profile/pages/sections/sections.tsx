import { useState, useEffect } from 'react';
import { useAuthStore } from '@/state/store/auth';
import {
  useGetSectionsByUserId,
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
} from '../../hooks/use-profile';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui-kit/button';
import { Input } from '@/components/ui-kit/input';
import { Label } from '@/components/ui-kit/label';
import { Textarea } from '@/components/ui-kit/textarea';
import { Skeleton } from '@/components/ui-kit/skeleton';
import { Plus, Trash, Edit, GripVertical, Eye, EyeOff } from 'lucide-react';
import { UserCustomSection } from '../../types/profile.types';

const SECTION_TYPES = ['Experience', 'Project', 'Skill', 'Education', 'Custom'];

export function SectionsPage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const userId = user?.itemId || '';

  const { data, isLoading } = useGetSectionsByUserId(userId);
  const sections = data?.getUserCustomSections?.items || [];

  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    section_type: 'Experience',
    section_title: '',
    section_content: '',
    section_order: 0,
    is_visible: true,
  });

  const resetForm = () => {
    setForm({
      section_type: 'Experience',
      section_title: '',
      section_content: '',
      section_order: sections.length,
      is_visible: true,
    });
    setIsAdding(false);
    setEditingId(null);
  };

  useEffect(() => {
    if (isAdding && !editingId) {
      setForm((prev) => ({ ...prev, section_order: sections.length }));
    }
  }, [isAdding, editingId, sections.length]);

  const handleEdit = (section: UserCustomSection) => {
    setForm({
      section_type: section.section_type,
      section_title: section.section_title || '',
      section_content: section.section_content || '',
      section_order: section.section_order || 0,
      is_visible: section.is_visible !== false,
    });
    setEditingId(section.ItemId);
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!userId) return;

    if (editingId) {
      updateSection.mutate({
        filter: editingId,
        input: {
          section_type: form.section_type,
          section_title: form.section_title,
          section_content: form.section_content,
          section_order: Number(form.section_order),
          is_visible: form.is_visible,
        },
      });
    } else {
      createSection.mutate({
        input: {
          user_id: userId,
          section_type: form.section_type,
          section_title: form.section_title,
          section_content: form.section_content,
          section_order: Number(form.section_order),
          is_visible: form.is_visible,
        },
      });
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteSection.mutate({ filter: id, input: { isHardDelete: true } });
  };

  const handleToggleVisibility = (section: UserCustomSection) => {
    updateSection.mutate({
      filter: section.ItemId,
      input: { is_visible: !section.is_visible },
    });
  };

  const sortedSections = [...sections].sort(
    (a, b) => (a.section_order || 0) - (b.section_order || 0)
  );

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="w-full h-10" />
        <Skeleton className="w-full h-24" />
        <Skeleton className="w-full h-24" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('CUSTOM_SECTIONS')}</h1>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            {t('ADD_SECTION')}
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6 space-y-4">
          <h2 className="font-semibold">{editingId ? t('EDIT_SECTION') : t('NEW_SECTION')}</h2>

          <div>
            <Label>{t('SECTION_TYPE')}</Label>
            <select
              value={form.section_type}
              onChange={(e) => setForm((prev) => ({ ...prev, section_type: e.target.value }))}
              className="w-full border rounded-md px-3 py-2 mt-1"
            >
              {SECTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>{t('SECTION_TITLE')}</Label>
            <Input
              value={form.section_title}
              onChange={(e) => setForm((prev) => ({ ...prev, section_title: e.target.value }))}
              placeholder={t('SECTION_TITLE_PLACEHOLDER')}
            />
          </div>

          <div>
            <Label>{t('SECTION_CONTENT')}</Label>
            <Textarea
              value={form.section_content}
              onChange={(e) => setForm((prev) => ({ ...prev, section_content: e.target.value }))}
              placeholder={t('SECTION_CONTENT_PLACEHOLDER')}
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_visible}
                onChange={(e) => setForm((prev) => ({ ...prev, is_visible: e.target.checked }))}
              />
              {t('VISIBLE')}
            </Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={createSection.isPending || updateSection.isPending}>
              {editingId ? t('UPDATE') : t('CREATE')}
            </Button>
            <Button variant="outline" onClick={resetForm}>
              {t('CANCEL')}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {sortedSections.length === 0 && !isAdding && (
          <div className="text-center py-12 text-gray-500">
            <p>{t('NO_SECTIONS_YET')}</p>
            <p className="text-sm mt-1">{t('ADD_FIRST_SECTION')}</p>
          </div>
        )}

        {sortedSections.map((section) => (
          <div
            key={section.ItemId}
            className={`flex items-start gap-3 p-4 rounded-lg border ${
              section.is_visible === false ? 'bg-gray-50 opacity-60' : 'bg-white'
            }`}
          >
            <div className="mt-1 text-gray-400">
              <GripVertical className="w-4 h-4" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                  {section.section_type}
                </span>
                <h3 className="font-semibold">{section.section_title || section.section_type}</h3>
              </div>
              {section.section_content && (
                <p className="text-sm text-gray-600 line-clamp-2">{section.section_content}</p>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleToggleVisibility(section)}
                className="p-2 hover:bg-gray-100 rounded"
                title={section.is_visible !== false ? t('HIDE') : t('SHOW')}
              >
                {section.is_visible !== false ? (
                  <Eye className="w-4 h-4 text-gray-500" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <button onClick={() => handleEdit(section)} className="p-2 hover:bg-gray-100 rounded">
                <Edit className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => handleDelete(section.ItemId)}
                className="p-2 hover:bg-red-50 rounded"
              >
                <Trash className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
