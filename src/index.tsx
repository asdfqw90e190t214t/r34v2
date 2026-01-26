import { SettingHandler } from './api/SettingHandler';
import { Main } from './view/main';

import ReactDOM from 'react-dom/client';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

declare global {
  interface Window {
    __APP_ENV__: Record<string, string>;
  }
}

for (const [key, value] of Object.entries(window.__APP_ENV__)) {
  SettingHandler.save(`${key.replace('APP_', '')}_input`, value);
  console.log(key, value);
}

root.render(<Main />);
