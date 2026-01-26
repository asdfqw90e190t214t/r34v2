export class SettingHandler {
  private static prefix: string = 'r34v3_';

  public static save(key: string, value: string | number | boolean | object): boolean {
    let overwriting = false;
    if (window.localStorage.getItem(`${SettingHandler.prefix}${key}`)) {
      overwriting = true;
    }

    if (typeof value === 'object') {
      window.localStorage.setItem(`${SettingHandler.prefix}${key}`, JSON.stringify(value));
    } else {
      window.localStorage.setItem(`${SettingHandler.prefix}${key}`, String(value));
    }

    return overwriting;
  }

  public static get<T = string | boolean | number>(
    key: string,
    parser: (v: string | null) => T,
  ): T {
    const value = window.localStorage.getItem(`${SettingHandler.prefix}${key}`);
    return parser(value);
  }
}
