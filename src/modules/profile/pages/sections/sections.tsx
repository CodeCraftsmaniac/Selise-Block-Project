import { useState, useEffect, useMemo, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

import { useAuthStore } from '@/state/store/auth';
import {
  useGetMySections,
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
  useReorderSections,
} from '../../hooks/use-profile';
import { useUploadImage } from '../../hooks/use-upload-image';
import { useProfileEditorStore } from '../../state/use-profile-editor-store';
import {
  sectionFormSchema,
  SectionFormValues,
  UserCustomSection,
} from '../../types/profile.types';

import { Button } from '@/components/ui-kit/button';
import { Input } from '@/components/ui-kit/input';
import { Label } from '@/components/ui-kit/label';
import { Textarea } from '@/components/ui-kit/textarea';
import { Skeleton } from '@/components/ui-kit/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui-kit/alert-dialog';
import {
  Plus,
  Trash,
  Edit,
  GripVertical,
  Eye,
  EyeOff,
  FileText,
  ChevronUp,
  ChevronDown,
  ImagePlus,
  Loader2,
} from 'lucide-react';
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

/**
 * Allowed `section_type` enum values. Mirrors `sectionTypeSchema` in
 * `profile.types.ts` (kept in sync manually so the template dropdown reads
 * an ordered list rather than iterating schema internals).
 */
const SECTION_TYPES = [
  'Experience',
  'Project',
  'Skill',
  'Education',
  'Custom',
] as const;
type SectionType = (typeof SECTION_TYPES)[number];

/**
 * Static prefilled templates shown in the create form. Not part of the
 * validation contract — purely a UX convenience.
 */
const SECTION_TEMPLATES: Record<SectionType, { title: string; content: string }[]> = {
  Experience: [
    {
      title: 'Software Engineer at Company',
      content:
        '• Developed and maintained web applications\n• Collaborated with cross-functional teams\n• Improved application performance by 30%',
    },
    {
      title: 'Product Designer',
      content:
        '• Designed user interfaces for mobile and web\n• Conducted user research and usability testing\n• Created design systems and component libraries',
    },
  ],
  Project: [
    {
      title: 'E-commerce Platform',
      content:
        '• Built a full-stack e-commerce solution\n• Integrated payment gateways and inventory management\n• Achieved 99.9% uptime',
    },
    {
      title: 'Mobile App',
      content:
        '• Developed cross-platform mobile application\n• Implemented real-time notifications\n• 10,000+ downloads on app stores',
    },
  ],
  Skill: [
    {
      title: 'Technical Skills',
      content:
        '• JavaScript / TypeScript\n• React / Next.js\n• Node.js / Express\n• GraphQL / REST APIs',
    },
    {
      title: 'Design Skills',
      content: '• UI/UX Design\n• Figma / Sketch\n• Design Systems\n• Prototyping',
    },
  ],
  Education: [
    {
      title: 'Computer Science Degree',
      content:
        '• Bachelor of Science in Computer Science\n• GPA: 3.8/4.0\n• Relevant coursework: Algorithms, Data Structures, Software Engineering',
    },
    {
      title: 'Certifications',
      content:
        '• AWS Certified Solutions Architect\n• Google Cloud Professional\n• Scrum Master Certified',
    },
  ],
  Custom: [
    { title: 'About Me', content: 'Write a brief description about yourself...' },
    { title: 'Hobbies', content: '• Photography\n• Hiking\n• Reading\n• Cooking' },
  ],
};

/** Default values for the section create form. */
const EMPTY_SECTION_VALUES: SectionFormValues = {
  section_type: 'Experience',
  section_title: '',
  section_content: '',
  section_order: 0,
  is_visible: true,
};

// ---------------------------------------------------------------------------
// Sortable row
// ---------------------------------------------------------------------------

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

function SortableSectionItem({
  section,
  onEdit,
  onDelete,
  onToggleVisibility,
  onDuplicate,
  onTogglePreview,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  isPreviewOpen,
}: SortableSectionItemProps) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.ItemId });

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
        type="button"
        className="mt-1 text-gray-400 cursor-grab active:cursor-grabbing"
        title={t('DRAG_TO_REORDER')}
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
            <h3 className="font-medium text-gray-900">
              {section.section_title || section.section_type}
            </h3>
            <p className="text-sm text-gray-500">
              {section.section_type} ·{' '}
              {(section.section_content || '').trim().split(/\s+/).filter(Boolean).length}{' '}
              {t('WORDS')}
            </p>
          </div>
        </div>
        {section.section_content && (
          <p className="text-sm text-gray-600 line-clamp-2">{section.section_content}</p>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
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
          type="button"
          onClick={() => onTogglePreview(section.ItemId)}
          className={`p-2 rounded ${isPreviewOpen ? 'bg-blue-50' : 'hover:bg-gray-100'}`}
          title={t('PREVIEW')}
        >
          <FileText
            className={`w-4 h-4 ${isPreviewOpen ? 'text-blue-500' : 'text-gray-500'}`}
          />
        </button>
        <button
          type="button"
          onClick={() => onEdit(section)}
          className="p-2 hover:bg-gray-100 rounded"
          title={t('EDIT')}
        >
          <Edit className="w-4 h-4 text-gray-500" />
        </button>
        <button
          type="button"
          onClick={() => onMoveUp(section.ItemId)}
          disabled={isFirst}
          className="p-2 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
          title={t('MOVE_UP')}
        >
          <ChevronUp className="w-4 h-4 text-gray-500" />
        </button>
        <button
          type="button"
          onClick={() => onMoveDown(section.ItemId)}
          disabled={isLast}
          className="p-2 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
          title={t('MOVE_DOWN')}
        >
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>
        <button
          type="button"
          onClick={() => onDuplicate(section)}
          className="p-2 hover:bg-gray-100 rounded"
          title={t('DUPLICATE')}
        >
          <Plus className="w-4 h-4 text-gray-500" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(section.ItemId)}
          className="p-2 hover:bg-red-50 rounded"
          title={t('DELETE')}
        >
          <Trash className="w-4 h-4 text-red-500" />
        </button>
      </div>
      {isPreviewOpen && section.section_content && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border text-sm text-gray-700 prose prose-sm max-w-none">
          <p className="text-xs font-medium text-gray-400 uppercase mb-1">
            {t('PREVIEW')}
          </p>
          {/*
           * Render Markdown through `rehype-sanitize` rather than
           * `dangerouslySetInnerHTML` to guard against XSS in
           * user-authored section_content (design §Security Considerations).
           */}
          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
            {section.section_content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function SectionsPage() {
  const { t } = useTranslation();
  const meItemId = useAuthStore((state) => state.user?.itemId ?? '');

  // List hook — design contract §Hook Signatures. Sorted by section_order.
  const { data, isLoading } = useGetMySections();

  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();
  const reorderSections = useReorderSections();

  // Upload hook for `section_media`. Each call issues a fresh presigned URL.
  const sectionMediaUpload = useUploadImage({
    moduleName: 'section_media',
    maxBytes: 5 * 1024 * 1024,
  });

  const setDragPreview = useProfileEditorStore((s) => s.setDragPreview);

  const items = useMemo<UserCustomSection[]>(() => {
    const apiSections = data?.getUserCustomSections?.items ?? [];
    return [...apiSections].sort(
      (a, b) => (a.section_order ?? 0) - (b.section_order ?? 0)
    );
  }, [data]);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewSectionId, setPreviewSectionId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // react-hook-form instance backed by sectionFormSchema so inline Zod
  // errors (max length, int>=0, enum) surface through formState.errors.
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<SectionFormValues>({
    resolver: zodResolver(sectionFormSchema),
    defaultValues: EMPTY_SECTION_VALUES,
    mode: 'onBlur',
  });

  const watchedType = watch('section_type');
  const watchedContent = watch('section_content') ?? '';

  // Caret-tracking ref for the content Textarea so uploaded images can be
  // inserted at the cursor rather than appended.
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const { ref: contentRHFRef, ...contentRegister } = register('section_content');

  // Clear the ghost preview once the reorder mutation settles (success or
  // error). `onSettled` on the hook invalidates the cache; we only need to
  // drop our local dragPreviewOrder tracker so the UI stops rendering the
  // optimistic ghost.
  useEffect(() => {
    if (!reorderSections.isPending && reorderSections.status !== 'idle') {
      setDragPreview(null);
    }
  }, [reorderSections.isPending, reorderSections.status, setDragPreview]);

  // Keep the "next order" field correct as items are added/removed while
  // the create form is open.
  useEffect(() => {
    if (isAdding && !editingId) {
      setValue('section_order', items.length, { shouldDirty: false });
    }
  }, [isAdding, editingId, items.length, setValue]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // -----------------------------------------------------------------
  // Reorder — single useReorderSections.mutate(orderedIds) call.
  // -----------------------------------------------------------------

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.ItemId === active.id);
    const newIndex = items.findIndex((item) => item.ItemId === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const newItems = arrayMove(items, oldIndex, newIndex);
    const orderedIds = newItems.map((i) => i.ItemId);

    // Populate the drag preview so the UI can surface the optimistic
    // ordering before the mutation's cache update lands. The hook
    // performs the optimistic cache write itself in onMutate.
    setDragPreview(orderedIds);
    reorderSections.mutate(orderedIds);
  };

  const handleMoveUp = (id: string) => {
    const idx = items.findIndex((i) => i.ItemId === id);
    if (idx <= 0) return;
    const newItems = arrayMove(items, idx, idx - 1);
    const orderedIds = newItems.map((i) => i.ItemId);
    setDragPreview(orderedIds);
    reorderSections.mutate(orderedIds);
  };

  const handleMoveDown = (id: string) => {
    const idx = items.findIndex((i) => i.ItemId === id);
    if (idx === -1 || idx >= items.length - 1) return;
    const newItems = arrayMove(items, idx, idx + 1);
    const orderedIds = newItems.map((i) => i.ItemId);
    setDragPreview(orderedIds);
    reorderSections.mutate(orderedIds);
  };

  // -----------------------------------------------------------------
  // Create / edit / delete
  // -----------------------------------------------------------------

  const resetForm = () => {
    reset({ ...EMPTY_SECTION_VALUES, section_order: items.length });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (section: UserCustomSection) => {
    reset({
      section_type: (SECTION_TYPES as readonly string[]).includes(section.section_type)
        ? (section.section_type as SectionType)
        : 'Custom',
      section_title: section.section_title ?? '',
      section_content: section.section_content ?? '',
      section_order: section.section_order ?? 0,
      is_visible: section.is_visible !== false,
    });
    setEditingId(section.ItemId);
    setIsAdding(true);
  };

  const onSubmit = async (values: SectionFormValues) => {
    if (editingId) {
      await updateSection.mutateAsync({
        filter: JSON.stringify({ ItemId: editingId }),
        input: values,
      });
    } else {
      if (!meItemId) return;
      await createSection.mutateAsync({
        input: { user_id: meItemId, ...values },
      });
    }
    resetForm();
  };

  const handleDuplicate = (section: UserCustomSection) => {
    if (!meItemId) return;
    createSection.mutate({
      input: {
        user_id: meItemId,
        section_type: section.section_type,
        section_title: `${section.section_title || section.section_type} (Copy)`,
        section_content: section.section_content ?? '',
        section_order: items.length,
        is_visible: section.is_visible !== false,
      },
    });
  };

  const handleToggleVisibility = (section: UserCustomSection) => {
    updateSection.mutate({
      filter: JSON.stringify({ ItemId: section.ItemId }),
      input: { is_visible: !section.is_visible },
    });
  };

  const confirmDelete = () => {
    if (!deleteTargetId) return;
    deleteSection.mutate({
      filter: JSON.stringify({ ItemId: deleteTargetId }),
      input: { isHardDelete: true },
    });
    setDeleteTargetId(null);
  };

  // -----------------------------------------------------------------
  // Inline image upload for section_content
  // -----------------------------------------------------------------

  const imagePickerRef = useRef<HTMLInputElement | null>(null);

  const handleInsertImageClick = () => {
    imagePickerRef.current?.click();
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input so the same file can be picked again in the same session.
    e.target.value = '';
    if (!file) return;

    try {
      const { fileUrl } = await sectionMediaUpload.upload(file);
      const markdown = `![${file.name}](${fileUrl})`;
      const current = getValues('section_content') ?? '';
      const textarea = contentRef.current;

      let nextContent: string;
      if (textarea) {
        const start = textarea.selectionStart ?? current.length;
        const end = textarea.selectionEnd ?? current.length;
        nextContent = current.slice(0, start) + markdown + current.slice(end);
      } else {
        // Fallback: append with a newline separator if the textarea ref is
        // not yet available (e.g. upload completed after unmount).
        nextContent = current.length > 0 ? `${current}\n${markdown}` : markdown;
      }

      setValue('section_content', nextContent, {
        shouldDirty: true,
        shouldValidate: true,
      });

      // Put the caret at the end of the inserted Markdown so the next
      // keystroke continues after the image.
      if (textarea) {
        const caret = (textarea.selectionStart ?? 0) + markdown.length;
        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(caret, caret);
        });
      }
    } catch {
      // useUploadImage already surfaces a destructive toast via
      // useErrorHandler; swallow here so the caret/selection state is not
      // disturbed.
    }
  };

  // -----------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------

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
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t('CUSTOM_SECTIONS')}</h1>
          <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-sm rounded-full font-medium">
            {items.length}
          </span>
        </div>
        {!isAdding && (
          <Button
            onClick={() => {
              reset({ ...EMPTY_SECTION_VALUES, section_order: items.length });
              setEditingId(null);
              setIsAdding(true);
            }}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('ADD_SECTION')}
          </Button>
        )}
      </div>

      {isAdding && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-gray-50 p-4 rounded-lg mb-6 space-y-4"
          noValidate
        >
          <h2 className="font-semibold">
            {editingId ? t('EDIT_SECTION') : t('NEW_SECTION')}
          </h2>

          <div>
            <Label>{t('SECTION_TYPE')}</Label>
            <Controller
              control={control}
              name="section_type"
              render={({ field }) => (
                <select
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value as SectionType)}
                  onBlur={field.onBlur}
                  className="w-full border rounded-md px-3 py-2 mt-1"
                >
                  {SECTION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.section_type && (
              <p className="text-xs text-red-600 mt-1">{errors.section_type.message}</p>
            )}
          </div>

          {!editingId && SECTION_TEMPLATES[watchedType]?.length > 0 && (
            <div>
              <Label>{t('USE_TEMPLATE')}</Label>
              <select
                className="w-full border rounded-md px-3 py-2 mt-1"
                onChange={(e) => {
                  const idx = parseInt(e.target.value, 10);
                  if (!Number.isNaN(idx)) {
                    const template = SECTION_TEMPLATES[watchedType][idx];
                    setValue('section_title', template.title, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    setValue('section_content', template.content, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }
                }}
                defaultValue=""
              >
                <option value="">{t('SELECT_TEMPLATE')}</option>
                {SECTION_TEMPLATES[watchedType].map((template, idx) => (
                  <option key={idx} value={idx}>
                    {template.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Label htmlFor="section_title">{t('SECTION_TITLE')}</Label>
            <Input
              id="section_title"
              placeholder={t('SECTION_TITLE_PLACEHOLDER')}
              {...register('section_title')}
            />
            {errors.section_title && (
              <p className="text-xs text-red-600 mt-1">
                {errors.section_title.message}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="section_content">{t('SECTION_CONTENT')}</Label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">
                  {watchedContent.length} {t('CHARS')}
                </span>
                <button
                  type="button"
                  onClick={handleInsertImageClick}
                  disabled={sectionMediaUpload.isUploading}
                  className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 disabled:opacity-50"
                  title={t('INSERT_IMAGE')}
                >
                  {sectionMediaUpload.isUploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ImagePlus className="w-3.5 h-3.5" />
                  )}
                  {t('INSERT_IMAGE')}
                </button>
              </div>
            </div>
            <input
              ref={imagePickerRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleImageFileChange}
            />
            <Textarea
              id="section_content"
              rows={6}
              placeholder={t('SECTION_CONTENT_PLACEHOLDER')}
              {...contentRegister}
              ref={(el) => {
                contentRHFRef(el);
                contentRef.current = el;
              }}
            />
            {sectionMediaUpload.isUploading && (
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${sectionMediaUpload.progress}%` }}
                />
              </div>
            )}
            {errors.section_content && (
              <p className="text-xs text-red-600 mt-1">
                {errors.section_content.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="section_order">{t('SECTION_ORDER')}</Label>
              <Input
                id="section_order"
                type="number"
                min={0}
                {...register('section_order', { valueAsNumber: true })}
              />
              {errors.section_order && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.section_order.message}
                </p>
              )}
            </div>
            <div className="flex items-end">
              <Label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('is_visible')} />
                {t('VISIBLE')}
              </Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={createSection.isPending || updateSection.isPending}
            >
              {editingId ? t('UPDATE') : t('CREATE')}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              {t('CANCEL')}
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {items.length === 0 && !isAdding && (
          <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-700">{t('NO_SECTIONS_YET')}</p>
            <p className="text-sm mt-1 mb-4">{t('ADD_FIRST_SECTION')}</p>
            <Button
              onClick={() => {
                reset({ ...EMPTY_SECTION_VALUES, section_order: items.length });
                setEditingId(null);
                setIsAdding(true);
              }}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('ADD_SECTION')}
            </Button>
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
                onDelete={(id) => setDeleteTargetId(id)}
                onToggleVisibility={handleToggleVisibility}
                onDuplicate={handleDuplicate}
                onTogglePreview={(id) =>
                  setPreviewSectionId(previewSectionId === id ? null : id)
                }
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

      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('CONFIRM_DELETE_SECTION_TITLE')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('CONFIRM_DELETE_SECTION')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('CANCEL')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              {t('DELETE')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
