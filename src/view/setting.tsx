import { HTMLInputTypeAttribute, useContext } from 'react';
import { SettingsContext } from './settings';

export function Setting({
  type,
  label,
  id,
  defaultValue,
  placeholder,
}: {
  type: HTMLInputTypeAttribute;
  label: string;
  id: string;
  defaultValue?: string | number | boolean;
  placeholder?: string;
}) {
  const settingErrors = useContext(SettingsContext);

  const checkbox = typeof defaultValue === 'boolean' ? { defaultChecked: defaultValue } : {};

  return (
    <div className="setting">
      <div className="setting_text">{label} -&nbsp;</div>
      <input
        type={type}
        name={id}
        id={id}
        defaultValue={defaultValue ? String(defaultValue) : ''}
        placeholder={placeholder || ''}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        {...checkbox}
      />
      <div className="setting_error">{settingErrors[id] && `* ${settingErrors[id]}`}</div>
    </div>
  );
}
