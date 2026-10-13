import { useCallback, useMemo, useState } from 'react';
import { hasErrors, validateForm, validateValue } from '../utils/validation';

export default function useForm({
  initialValues = {},
  validationSchema = {},
  onSubmit,
} = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const setFieldValue = useCallback(
    (name, value) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => {
        if (!prev[name]) return prev;
        const next = { ...prev };
        delete next[name];
        return next;
      });
    },
    []
  );

  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => {
      const next = { ...prev };
      if (!error) delete next[name];
      else next[name] = error;
      return next;
    });
  }, []);

  const handleChange = useCallback(
    (name) => (value) => setFieldValue(name, typeof value === 'string' ? value : value),
    [setFieldValue]
  );

  const validatefield = useCallback(
    (name) => {
      const error = validateValue(values[name], validationSchema[name], values);
      setFieldError(name, error);
      return error;
    },
    [values, validationSchema, setFieldError]
  );

  const handleBlur = useCallback(
    (name) => () => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      validatefield(name);
    },
    [validatefield]
  );

  const validateAll = useCallback(() => {
    const nextErrors = validateForm(values, validationSchema);
    setErrors(nextErrors);
    setTouched(
      Object.keys(validationSchema).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    );
    return nextErrors;
  }, [values, validationSchema]);

  const reset = useCallback(
    (nextValues = initialValues) => {
      setValues(nextValues);
      setErrors({});
      setTouched({});
    },
    [initialValues]
  );

  const handleSubmit = useCallback(async () => {
    const nextErrors = validateAll();
    if (hasErrors(nextErrors)) return { ok: false, errors: nextErrors };
    if (!onSubmit) return { ok: true };
    setSubmitting(true);
    try {
      const result = await onSubmit(values);
      return { ok: true, result };
    } catch (error) {
      if (error && error.fieldErrors) setErrors(error.fieldErrors);
      return { ok: false, error };
    } finally {
      setSubmitting(false);
    }
  }, [values, validateAll, onSubmit]);

  const isValid = useMemo(
    () => !hasErrors(validateForm(values, validationSchema)),
    [values, validationSchema]
  );

  return {
    values,
    errors,
    touched,
    submitting,
    isValid,
    setValues,
    setFieldValue,
    setFieldError,
    handleChange,
    handleBlur,
    validatefield,
    validateAll,
    handleSubmit,
    reset,
  };
}
