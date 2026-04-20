import { z } from 'zod';

type FormValues = Record<string, unknown>;

export function getSchemaFieldErrorHelpers<TValues extends FormValues>(
  schema: z.ZodType<TValues>,
  values: TValues,
) {
  const parsed = schema.safeParse(values);
  const flattened = parsed.success ? null : z.flattenError(parsed.error);

  const getFieldError = (fieldName: keyof TValues): string | undefined => {
    if (!flattened) return undefined;
    return flattened.fieldErrors[String(fieldName)]?.[0];
  };

  return {
    parsed,
    getFieldError,
  };
}
