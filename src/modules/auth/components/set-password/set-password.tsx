import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BasePasswordForm } from '@/components/core';
import { useAccountActivation } from '../../hooks/use-auth';
import { createUserProfile } from '@/modules/profile/services/profile.service';
import { setPasswordFormDefaultValue, getSetPasswordFormValidationSchema } from './utils';

/**
 * SetPasswordForm Component
 *
 * A wrapper component that handles the account activation and password setting process
 * by connecting the account activation API mutation with a base password form component.
 *
 * Features:
 * - Integrates account activation API with form submission
 * - Manages CAPTCHA validation state
 * - Passes loading state to the base form
 * - Handles form submission with password, verification code, and CAPTCHA token
 * - Delegates validation and UI rendering to the BasePasswordForm
 * - Auto-creates a user_profile after successful activation
 *
 */

export const SetpasswordForm = ({ code }: Readonly<{ code: string }>) => {
  const { t } = useTranslation();
  const { isPending, mutateAsync } = useAccountActivation();
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);

  // Check if captcha is enabled
  const captchaEnabled = (import.meta.env.VITE_CAPTCHA_SITE_KEY || '') !== '';

  const handleSubmit = async (password: string, code: string, captchaToken?: string, formData?: any) => {
    if (captchaEnabled && !captchaToken) {
      return;
    }

    const res = await mutateAsync({
      firstname: formData?.firstName ?? '',
      lastname: formData?.lastName ?? '',
      password,
      code,
      captchaCode: captchaToken ?? '',
      projectKey: import.meta.env.VITE_X_BLOCKS_KEY || '',
    });

    // Auto-create user profile after successful activation
    const userId = (res as any)?.itemId || (res as any)?.userId;
    if (userId) {
      try {
        const firstName = formData?.firstName ?? '';
        const lastName = formData?.lastName ?? '';
        const displayName = `${firstName} ${lastName}`.trim() || 'New User';
        const username = formData?.username?.trim() || `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 10000).toString().padStart(4, '0');

        await createUserProfile({
          input: {
            user_id: userId,
            username,
            display_name: displayName,
            headline: '',
            bio_text: '',
            profile_image_url: '',
            header_image_url: '',
            social_links: [],
            theme_preference: 'minimal',
            is_published: false,
          },
        });
      } catch {
        // Profile creation failure should not block activation flow
      }
    }
  };

  const handleCaptchaValidation = (isValid: boolean) => {
    setIsCaptchaValid(isValid);
  };

  return (
    <BasePasswordForm
      code={code}
      onSubmit={handleSubmit}
      validationSchema={getSetPasswordFormValidationSchema(t)}
      defaultValues={setPasswordFormDefaultValue}
      isPending={isPending}
      isCaptchaValid={isCaptchaValid}
      onCaptchaValidation={handleCaptchaValidation}
      showNameFields={true}
    />
  );
};
