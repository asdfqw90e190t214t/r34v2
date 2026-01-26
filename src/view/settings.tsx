import { createContext, FormEvent, useCallback, useContext, useEffect, useState } from 'react';
import { SettingHandler } from '../api/SettingHandler';
import { MainContext } from './main';
import { Setting } from './setting';
import { URLBuilder } from '../api/URLBuilder';

export const SettingsContext = createContext<Record<string, string>>({});

export function Settings({ hidden }: { hidden: boolean }) {
  const { toggleSettings, setAutoloadEnd, setLooping } = useContext(MainContext);

  const [settingErrors, setSettingErrors] = useState<Record<string, string>>({});
  const [loopDefault, setLoopDefault] = useState<boolean>(
    SettingHandler.get('loop_input', Boolean),
  );

  const [autoloadDefault, setAutoloadDefault] = useState<boolean>(
    SettingHandler.get('autoload_end_input', Boolean),
  );

  const addSettingError = (entry: Record<string, string>) => {
    setSettingErrors(prev => ({ ...prev, ...entry }));
  };

  const removeSettingError = (key: string) => {
    setSettingErrors(prev => {
      delete prev[key];
      return prev;
    });
  };

  const handleSettingsSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const expectedFields = new Set(
        Array.from(e.currentTarget.querySelectorAll('input')).map(o => o.id),
      );

      const formData: FormData = new FormData(e.currentTarget);
      const ignored: Set<string> = new Set<string>();

      formData.forEach((value, key) => {
        expectedFields.delete(key);

        if (value.toString().trim() === '') {
          ignored.add(key);
        }
      });

      const new_api_key = formData.get('api_key_input');
      const new_user_id = formData.get('user_id_input');

      if (!ignored.has('api_key_input')) {
        if (new_api_key?.toString().length !== 128) {
          addSettingError({ api_key_input: 'Expects 128 characters' });
        } else {
          removeSettingError('api_key_input');
        }
      }

      if (!ignored.has('user_id_input')) {
        const validateID = /^\d+$/;
        if (!validateID.test(new_user_id?.toString() || '')) {
          setSettingErrors(prev => ({ ...prev, user_id_input: 'User ID is numeric only' }));
        } else {
          removeSettingError('user_id_input');
        }
      }

      if (Object.keys(settingErrors).length > 0) {
        return;
      }

      formData.forEach((value, key) => {
        const field = document.querySelector(`#${key}`);
        if (field instanceof HTMLInputElement) {
          if (field.type === 'checkbox') {
            SettingHandler.save(key, 'on');
          } else if (field.type === 'number') {
            SettingHandler.save(key, Number(value.toString()));
          } else {
            SettingHandler.save(key, value.toString());
          }
        } else {
          SettingHandler.save(key, value.toString());
        }
      });

      expectedFields.forEach(id => {
        SettingHandler.save(id, '');
      });

      URLBuilder.updateAPIKey(String(SettingHandler.get('api_key_input', String)));
      URLBuilder.updateUserID(SettingHandler.get('user_id_input', Number));

      toggleSettings();
    },
    [settingErrors, toggleSettings],
  );

  useEffect(() => {
    const value = SettingHandler.get('autoload_end_input', Boolean);
    setAutoloadDefault(value);
    setAutoloadEnd(value);
  }, [setAutoloadEnd]);

  useEffect(() => {
    const value = SettingHandler.get('loop_input', Boolean);
    setLoopDefault(value);
    setLooping(value);
  }, [setLooping]);

  return (
    <SettingsContext.Provider value={settingErrors}>
      <div id="settings" className={hidden ? 'hidden' : 'visible'}>
        <div id="settings_exit" onClick={toggleSettings} />
        <form onSubmit={handleSettingsSubmit}>
          <Setting label="Loop" id="loop_input" type="checkbox" defaultValue={loopDefault} />
          <Setting
            label="Autoload Towards End"
            id="autoload_end_input"
            type="checkbox"
            defaultValue={autoloadDefault}
          />
          <Setting
            label="API Key"
            type="text"
            id="api_key_input"
            placeholder="Expects 128 characters"
            defaultValue={(() => {
              const value = SettingHandler.get('api_key_input', String);
              URLBuilder.updateAPIKey(value);
              return value;
            })()}
          />
          <Setting
            label="User ID"
            type="number"
            id="user_id_input"
            placeholder="Expects numeric-only"
            defaultValue={(() => {
              const value = SettingHandler.get('user_id_input', Number);
              URLBuilder.updateUserID(value);
              return value;
            })()}
          />
          <button type="submit">Save Settings</button>
        </form>
      </div>
    </SettingsContext.Provider>
  );
}
