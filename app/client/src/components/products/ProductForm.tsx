import { zodResolver } from '@hookform/resolvers/zod';
import { useId, type ReactNode } from 'react';
import { useForm, type FieldPath, type UseFormRegisterReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fieldIssuesOf } from '@/api/http';
import { useProductCategories } from '@/hooks/products/useProductQueries';
import { cn } from '@/lib/utils';
import { productFormSchema, type ProductFormValues } from './product-form.schema';

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  suffix?: string;
  registration: UseFormRegisterReturn;
  inputMode?: 'decimal' | 'numeric' | 'text';
  list?: string;
  autoFocus?: boolean;
}

function Field({ label, hint, error, suffix, registration, inputMode = 'text', list, autoFocus }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs font-normal text-ink-2">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          inputMode={inputMode}
          list={list}
          autoComplete="off"
          autoFocus={autoFocus}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(suffix && 'pr-12')}
          {...registration}
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-ink-3">
            {suffix}
          </span>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-xs text-signal">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface ProductFormProps {
  initialValues: ProductFormValues;
  submitLabel: string;
  pendingLabel: string;
  onSubmit: (values: ProductFormValues) => Promise<unknown>;
  onCancel?: () => void;
  banner?: ReactNode;
  focusOnOpen?: boolean;
}

const FIELD_NAMES = new Set<string>(Object.keys(productFormSchema.shape));

export function ProductForm({
  initialValues,
  submitLabel,
  pendingLabel,
  onSubmit,
  onCancel,
  banner,
  focusOnOpen = false,
}: ProductFormProps) {
  const categoriesListId = useId();
  const categories = useProductCategories();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProductFormValues>({ resolver: zodResolver(productFormSchema), defaultValues: initialValues });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      fieldIssuesOf(error)
        .filter((issue) => FIELD_NAMES.has(issue.path))
        .forEach((issue) => setError(issue.path as FieldPath<ProductFormValues>, { message: issue.message }));
    }
  });

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-6">
      {banner}

      <div className="flex flex-col gap-5">
        <Field
          label="Name"
          error={errors.displayName?.message}
          registration={register('displayName')}
          autoFocus={focusOnOpen}
        />
        <Field
          label="Category"
          hint="Lowercase snake_case. Pick an existing category or type a new one."
          error={errors.categoryEn?.message}
          registration={register('categoryEn')}
          list={categoriesListId}
        />
        <datalist id={categoriesListId}>
          {(categories.data ?? []).map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
        <Field
          label="List price"
          suffix="BRL"
          inputMode="decimal"
          error={errors.listPriceBrl?.message}
          registration={register('listPriceBrl')}
        />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-xs text-ink-3">Package dimensions, optional</legend>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Weight"
            suffix="g"
            inputMode="numeric"
            error={errors.weightG?.message}
            registration={register('weightG')}
          />
          <Field
            label="Length"
            suffix="cm"
            inputMode="numeric"
            error={errors.lengthCm?.message}
            registration={register('lengthCm')}
          />
          <Field
            label="Height"
            suffix="cm"
            inputMode="numeric"
            error={errors.heightCm?.message}
            registration={register('heightCm')}
          />
          <Field
            label="Width"
            suffix="cm"
            inputMode="numeric"
            error={errors.widthCm?.message}
            registration={register('widthCm')}
          />
        </div>
      </fieldset>

      <div className="flex items-center justify-end gap-2 border-t border-hairline pt-5">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? pendingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
