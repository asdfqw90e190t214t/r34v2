export class URLBuilder {
  private static API_KEY: string = '%API_KEY%';
  private static USER_ID: string = '%USER_ID%';

  private static api_key: string = '';
  private static user_id: number = 0;

  public static prefix = 'https://api.rule34.xxx/';
  public static credentialTemplate: string = `api_key=${URLBuilder.API_KEY}&user_id=${URLBuilder.USER_ID}&`;

  public static postsPerPage: number = 50;
  public static postURL: string = `${URLBuilder.prefix}index.php?page=dapi&%CREDENTIALS%s=post&q=index&json=1&limit=${URLBuilder.postsPerPage}`;
  public static tagURL: string = `${URLBuilder.prefix}index.php?page=dapi&%CREDENTIALS%s=tag&q=index`;
  public static autocompleteURL: string = `${URLBuilder.prefix}autocomplete.php?`;

  static updateAPIKey(key: string) {
    URLBuilder.api_key = key;
  }

  static updateUserID(id: number) {
    URLBuilder.user_id = id;
  }

  private static getCredentials() {
    return URLBuilder.credentialTemplate
      .replace(URLBuilder.API_KEY, URLBuilder.api_key)
      .replace(URLBuilder.USER_ID, URLBuilder.user_id.toString());
  }

  constructor(private base_url: string) {}

  add(key: string, value: string | number): URLBuilder {
    if (this.base_url.endsWith('&')) {
      this.base_url += `${encodeURIComponent(key)}=${encodeURIComponent(value)}&`;
    } else {
      this.base_url += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    }

    return this;
  }

  addRaw(key: string, value: string | number): URLBuilder {
    if (this.base_url.endsWith('&')) {
      this.base_url += `${key}=${value}&`;
    } else {
      this.base_url += `&${key}=${value}`;
    }

    return this;
  }

  div(value: string): URLBuilder {
    if (this.base_url.endsWith('/')) {
      this.base_url += `${encodeURIComponent(value)}/`;
    } else {
      this.base_url += `/${encodeURIComponent(value)}`;
    }
    return this;
  }

  build(): Promise<string> {
    return new Promise<string>(res =>
      res(this.base_url.replace('%CREDENTIALS%', URLBuilder.getCredentials())),
    );
  }
}
