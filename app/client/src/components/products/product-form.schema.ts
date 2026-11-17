import { z } from 'zod';
import type { Product, ProductInput } from '@/types/product.types';

const MAX_DIMENSION = 1_000_000;
const MAX_PRICE_BRL = 1_000_000;

const optionalNumber = (label: string, max: number, integer: boolean) =>
  z
    .string()
    .trim()
    .refine((value) => value === '' || !Number.isNaN(Number(value)), `${label} must be a number`)
    .refine((value) => value === '' || Number(value) >= 0, `${label} cannot be negative`)
    .refine((value) => value === '' || Number(value) <= max, `${label} must be at most ${max.toLocaleString('en-US')}`)
    .refine((value) => !integer || value === '' || Number.isInteger(Number(value)), `${label} must be a whole number`);

export const productFormSchema = z.object({
  displayName: z.string().trim().min(1, 'Enter a product name').max(200, 'Keep the name under 200 characters'),
  categoryEn: z
    .string()
    .trim()
    .min(1, 'Choose or type a category')
    .max(100, 'Keep the category under 100 characters')
    .regex(/^[a-z0-9_]+$/, 'Use lowercase snake_case, for example health_beauty'),
  listPriceBrl: optionalNumber('Price', MAX_PRICE_BRL, false),
  weightG: optionalNumber('Weight', MAX_DIMENSION, true),
  lengthCm: optionalNumber('Length', MAX_DIMENSION, true),
  heightCm: optionalNumber('Height', MAX_DIMENSION, true),
  widthCm: optionalNumber('Width', MAX_DIMENSION, true),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  displayName: '',
  categoryEn: '',
  listPriceBrl: '',
  weightG: '',
  lengthCm: '',
  heightCm: '',
  widthCm: '',
};

const toText = (value: number | null) => (value === null ? '' : String(value));
const toNumber = (value: string) => (value.trim() === '' ? null : Number(value));

export const productToFormValues = (product: Product): ProductFormValues => ({
  displayName: product.displayName,
  categoryEn: product.categoryEn,
  listPriceBrl: toText(product.listPriceBrl),
  weightG: toText(product.weightG),
  lengthCm: toText(product.lengthCm),
  heightCm: toText(product.heightCm),
  widthCm: toText(product.widthCm),
});

export const formValuesToInput = (values: ProductFormValues): ProductInput => ({
  displayName: values.displayName.trim(),
  categoryEn: values.categoryEn.trim(),
  listPriceBrl: toNumber(values.listPriceBrl),
  weightG: toNumber(values.weightG),
  lengthCm: toNumber(values.lengthCm),
  heightCm: toNumber(values.heightCm),
  widthCm: toNumber(values.widthCm),
});

export const changedFields = (product: Product, input: ProductInput): Partial<ProductInput> =>
  Object.fromEntries(
    (Object.keys(input) as (keyof ProductInput)[])
      .filter((key) => input[key] !== product[key])
      .map((key) => [key, input[key]])
  );
