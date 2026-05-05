import { describe, it, expect } from 'vitest';
import { getSetPasswordFormValidationSchema, setPasswordFormDefaultValue } from './utils';

describe('Set Password Form Validation', () => {
  const t = (key: string) => key;

  it('validates firstName as required', () => {
    const schema = getSetPasswordFormValidationSchema(t);
    const result = schema.safeParse({
      ...setPasswordFormDefaultValue,
      firstName: '',
      lastName: 'Doe',
      username: 'johndoe',
      password: 'Test@1234',
      confirmPassword: 'Test@1234',
    });
    expect(result.success).toBe(false);
  });

  it('validates lastName as required', () => {
    const schema = getSetPasswordFormValidationSchema(t);
    const result = schema.safeParse({
      ...setPasswordFormDefaultValue,
      firstName: 'John',
      lastName: '',
      username: 'johndoe',
      password: 'Test@1234',
      confirmPassword: 'Test@1234',
    });
    expect(result.success).toBe(false);
  });

  it('validates username minimum length of 3', () => {
    const schema = getSetPasswordFormValidationSchema(t);
    const result = schema.safeParse({
      ...setPasswordFormDefaultValue,
      firstName: 'John',
      lastName: 'Doe',
      username: 'ab',
      password: 'Test@1234',
      confirmPassword: 'Test@1234',
    });
    expect(result.success).toBe(false);
  });

  it('validates username maximum length of 30', () => {
    const schema = getSetPasswordFormValidationSchema(t);
    const result = schema.safeParse({
      ...setPasswordFormDefaultValue,
      firstName: 'John',
      lastName: 'Doe',
      username: 'a'.repeat(31),
      password: 'Test@1234',
      confirmPassword: 'Test@1234',
    });
    expect(result.success).toBe(false);
  });

  it('validates username only allows lowercase alphanumeric and underscore', () => {
    const schema = getSetPasswordFormValidationSchema(t);
    const result = schema.safeParse({
      ...setPasswordFormDefaultValue,
      firstName: 'John',
      lastName: 'Doe',
      username: 'John-Doe',
      password: 'Test@1234',
      confirmPassword: 'Test@1234',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid username with underscore', () => {
    const schema = getSetPasswordFormValidationSchema(t);
    const result = schema.safeParse({
      ...setPasswordFormDefaultValue,
      firstName: 'John',
      lastName: 'Doe',
      username: 'john_doe123',
      password: 'Test@1234',
      confirmPassword: 'Test@1234',
    });
    expect(result.success).toBe(true);
  });

  it('default values include username field', () => {
    expect(setPasswordFormDefaultValue).toHaveProperty('username', '');
    expect(setPasswordFormDefaultValue).toHaveProperty('firstName', '');
    expect(setPasswordFormDefaultValue).toHaveProperty('lastName', '');
  });
});
