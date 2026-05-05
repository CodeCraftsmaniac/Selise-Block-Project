import {
  createPasswordValidationSchema,
  passwordFormDefaultValues,
} from '../../../../lib/utils/validation/password-validation';
import { z } from 'zod';

/**
 * Set Password Form Schema
 *
 * Defines the validation schema, type definition, and default values for the account activation
 * password setting form. This module reuses common password validation logic from a shared
 * password validation module.
 *
 * Exports:
 * - setPasswordFormValidationSchema: Zod validation schema for password setting, created from common password validation schema
 * - setPasswordFormType: TypeScript type for the set password form, aliased from common password form type
 * - setPasswordFormDefaultValue: Default initial values for the form, reused from common password defaults
 *
 * @module setPasswordForm
 */

export const getSetPasswordFormValidationSchema = (t: (key: string) => string) =>
  z.intersection(
    z.object({
      firstName: z.string().min(1, { message: t('REQUIRED_FIELD') }),
      lastName: z.string().min(1, { message: t('REQUIRED_FIELD') }),
      username: z
        .string()
        .min(3, { message: t('USERNAME_MIN_3') })
        .max(30, { message: t('USERNAME_MAX_30') })
        .regex(/^[a-z0-9_]+$/, { message: t('USERNAME_ALPHANUMERIC') }),
    }),
    createPasswordValidationSchema(t)
  );
export type setPasswordFormType = z.infer<ReturnType<typeof getSetPasswordFormValidationSchema>>;
export const setPasswordFormDefaultValue = {
  ...passwordFormDefaultValues,
  firstName: '',
  lastName: '',
  username: '',
};
