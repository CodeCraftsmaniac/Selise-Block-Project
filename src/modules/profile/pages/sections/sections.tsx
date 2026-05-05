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
import { Plus, Trash, Edit, GripVertical, Eye, EyeOff, FileText, ChevronUp, ChevronDown } from 'lucide-react';
import { UserCustomSection } from '../../types/profile.types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SECTION_TYPES = ['Experience', 'Project', 'Skill', 'Education', 'Custom'];

const SECTION_TEMPLATES: Record<string, { title: string; content: string }[]> = {
  Experience: [
    { title: 'Software Engineer at Company', content: '• Developed and maintained web applications\n• Collaborated with cross-functional teams\n• Improved application performance by 30%' },
    { title: 'Product Designer', content: '• Designed user interfaces for mobile and web\n• Conducted user research and usability testing\n• Created design systems and component libraries' },
  ],
  Project: [
    { title: 'E-commerce Platform', content: '• Built a full-stack e-commerce solution\n• Integrated payment gateways and inventory management\n• Achieved 99.9% uptime' },
    { title: 'Mobile App', content: '• Developed cross-platform mobile application\n• Implemented real-time notifications\n• 10,000+ downloads on app stores' },
  ],
  Skill: [
    { title: 'Technical Skills', content: '• JavaScript / TypeScript\n• React / Next.js\n• Node.js / Express\n• GraphQL / REST APIs' },
    { title: 'Design Skills', content: '• UI/UX Design\n• Figma / Sketch\n• Design Systems\n• Prototyping' },
  ],
  Education: [
    { title: 'Computer Science Degree', content: '• Bachelor of Science in Computer Science\n• GPA: 3.8/4.0\n• Relevant coursework: Algorithms, Data Structures, Software Engineering' },
    { title: 'Certifications', content: '• AWS Certified Solutions Architect\n• Google Cloud Professional\n• Scrum Master Certified' },
  ],
  Custom: [
    { title: 'About Me', content: 'Write a brief description about yourself...' },
    { title: 'Hobbies', content: '• Photography\n• Hiking\n• Reading\n• Cooking' },
  ],
};

interface SortableSectionItemProps {
  section: UserCustomSection;
  onEdit: (section: UserCustomSection) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (section: UserCustomSection) => void;
  onDuplicate: (section: UserCustomSection) => void;
  onTogglePreview: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
  isPreviewOpen: boolean;
}

function SortableSectionItem({ section, onEdit, onDelete, onToggleVisibility, onDuplicate, onTogglePreview, onMoveUp, onMoveDown, isFirst, isLast, isPreviewOpen }: SortableSectionItemProps) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.ItemId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-3 p-4 rounded-lg border ${
        section.is_visible === false ? 'bg-gray-50 opacity-60' : 'bg-white'
      }`}
    >
      <button
        className="mt-1 text-gray-400 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
            {section.section_type}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900">{section.section_title || section.section_type}</h3>
            <p className="text-sm text-gray-500">
              {section.section_type} · {(section.section_content || '').trim().split(/\s+/).filter(Boolean).length} {t('WORDS')}
            </p>
          </div>
        </div>
        {section.section_content && (
          <p className="text-sm text-gray-600 line-clamp-2">{section.section_content}</p>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onToggleVisibility(section)}
          className="p-2 hover:bg-gray-100 rounded"
          title={section.is_visible !== false ? t('HIDE') : t('SHOW')}
        >
          {section.is_visible !== false ? (
            <Eye className="w-4 h-4 text-gray-500" />
          ) : (
            <EyeOff className="w-4 h-4 text-gray-400" />
          )}
        </button>
        <button
          onClick={() => onTogglePreview(section.ItemId)}
          className={`p-2 rounded ${isPreviewOpen ? 'bg-blue-50' : 'hover:bg-gray-100'}`}
          title={t('PREVIEW')}
        >
          <FileText className={`w-4 h-4 ${isPreviewOpen ? 'text-blue-500' : 'text-gray-500'}`} />
        </button>
        <button onClick={() => onEdit(section)} className="p-2 hover:bg-gray-100 rounded" title={t('EDIT')}>
          <Edit className="w-4 h-4 text-gray-500" />
        </button>
        <button
          onClick={() => onMoveUp(section.ItemId)}
          disabled={isFirst}
          className="p-2 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
          title={t('MOVE_UP')}
        >
          <ChevronUp className="w-4 h-4 text-gray-500" />
        </button>
        <button
          onClick={() => onMoveDown(section.ItemId)}
          disabled={isLast}
          className="p-2 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
          title={t('MOVE_DOWN')}
        >
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>
        <button onClick={() => onDuplicate(section)} className="p-2 hover:bg-gray-100 rounded" title={t('DUPLICATE')}>
          <Plus className="w-4 h-4 text-gray-500" />
        </button>
        <button onClick={() => onDelete(section.ItemId)} className="p-2 hover:bg-red-50 rounded" title={t('DELETE')}>
          <Trash className="w-4 h-4 text-red-500" />
        </button>
      </div>
      {isPreviewOpen && section.section_content && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border text-sm text-gray-700 whitespace-pre-wrap">
          <p className="text-xs font-medium text-gray-400 uppercase mb-1">{t('PREVIEW')}</p>
          {section.section_content}
        </div>
      )}
    </div>
  );
}

export function SectionsPage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const userId = user?.itemId || '';

  const { data, isLoading } = useGetSectionsByUserId(userId);

  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();

  const [items, setItems] = useState<UserCustomSection[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewSectionId, setPreviewSectionId] = useState<string | null>(null);
  const [form, setForm] = useState({
    section_type: 'Experience',
    section_title: '',
    section_content: '',
    section_order: 0,
    is_visible: true,
  });

  useEffect(() => {
    const apiSections = data?.getUserCustomSections?.items || [];
    const sorted = [...apiSections].sort((a, b) => (a.section_order || 0) - (b.section_order || 0));
    setItems(sorted);
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.ItemId === active.id);
    const newIndex = items.findIndex((item) => item.ItemId === over.id);
    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);

    // Update section_order for all items
    newItems.forEach((item, index) => {
      if (item.section_order !== index) {
        updateSection.mutate({
          filter: item.ItemId,
          input: { section_order: index },
        });
      }
    });
  };

  const resetForm = () => {
    setForm({
      section_type: 'Experience',
      section_title: '',
      section_content: '',
      section_order: items.length,
      is_visible: true,
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleDuplicate = (section: UserCustomSection) => {
    createSection.mutate({
      input: {
        user_id: userId,
        section_type: section.section_type,
        section_title: `${section.section_title || section.section_type} (Copy)`,
        section_content: section.section_content || '',
        section_order: items.length,
        is_visible: section.is_visible,
      },
    });
  };

  useEffect(() => {
    if (isAdding && !editingId) {
      setForm((prev) => ({ ...prev, section_order: items.length }));
    }
  }, [isAdding, editingId, items.length]);

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
    if (window.confirm(t('CONFIRM_DELETE_SECTION'))) {
      deleteSection.mutate({ filter: id, input: { isHardDelete: true } });
    }
  };

  const handleToggleVisibility = (section: UserCustomSection) => {
    updateSection.mutate({
      filter: section.ItemId,
      input: { is_visible: !section.is_visible },
    });
  };

  const handleMoveUp = (id: string) => {
    const idx = items.findIndex((i) => i.ItemId === id);
    if (idx <= 0) return;
    const newItems = arrayMove(items, idx, idx - 1);
    setItems(newItems);
    newItems.forEach((item, index) => {
      if (item.section_order !== index) {
        updateSection.mutate({ filter: item.ItemId, input: { section_order: index } });
      }
    });
  };

  const handleMoveDown = (id: string) => {
    const idx = items.findIndex((i) => i.ItemId === id);
    if (idx === -1 || idx >= items.length - 1) return;
    const newItems = arrayMove(items, idx, idx + 1);
    setItems(newItems);
    newItems.forEach((item, index) => {
      if (item.section_order !== index) {
        updateSection.mutate({ filter: item.ItemId, input: { section_order: index } });
      }
    });
  };

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

          {SECTION_TEMPLATES[form.section_type] && SECTION_TEMPLATES[form.section_type].length > 0 && !editingId && (
            <div>
              <Label>{t('USE_TEMPLATE')}</Label>
              <select
                className="w-full border rounded-md px-3 py-2 mt-1"
                onChange={(e) => {
                  const idx = parseInt(e.target.value);
                  if (!isNaN(idx)) {
                    const template = SECTION_TEMPLATES[form.section_type][idx];
                    setForm((prev) => ({
                      ...prev,
                      section_title: template.title,
                      section_content: template.content,
                    }));
                  }
                }}
              >
                <option value="">{t('SELECT_TEMPLATE')}</option>
                {SECTION_TEMPLATES[form.section_type].map((template, idx) => (
                  <option key={idx} value={idx}>
                    {template.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Label>{t('SECTION_TITLE')}</Label>
            <Input
              value={form.section_title}
              onChange={(e) => setForm((prev) => ({ ...prev, section_title: e.target.value }))}
              placeholder={t('SECTION_TITLE_PLACEHOLDER')}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label>{t('SECTION_CONTENT')}</Label>
              <span className="text-xs text-gray-400">
                {(form.section_content || '').length} {t('CHARS')}
              </span>
            </div>
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
        {items.length === 0 && !isAdding && (
          <div className="text-center py-12 text-gray-500">
            <p>{t('NO_SECTIONS_YET')}</p>
            <p className="text-sm mt-1">{t('ADD_FIRST_SECTION')}</p>
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((item) => item.ItemId)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((section, idx) => (
              <SortableSectionItem
                key={section.ItemId}
                section={section}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleVisibility={handleToggleVisibility}
                onDuplicate={handleDuplicate}
                onTogglePreview={(id) => setPreviewSectionId(previewSectionId === id ? null : id)}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                isFirst={idx === 0}
                isLast={idx === items.length - 1}
                isPreviewOpen={previewSectionId === section.ItemId}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
