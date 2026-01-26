import { PostDTO } from './PostDTO';
import { SimpleTagDTO, TagDTO } from './TagDTO';
import { URLBuilder } from './URLBuilder';

export class APIHandler {
  private controller?: AbortController;

  private async fetch(url: string, abortable: boolean = false): Promise<Response> {
    try {
      return await fetch(
        url,
        abortable
          ? {
              signal: this.controller?.signal,
            }
          : {},
      );
    } catch (e: unknown) {
      if ((e as never)['name'] === 'AbortError') {
        throw e;
      }
      throw e;
    }
  }

  private async json(url: string, abortable: boolean = false): Promise<unknown> {
    try {
      const raw = await this.fetch(url, abortable);
      if (raw) {
        return await raw.json();
      } else {
        return {};
      }
    } catch (e: unknown) {
      if ((e as never)['name'] === 'AbortError') {
        throw e;
      }
      throw e;
    }
  }

  private static buildTags(included_tags: Array<TagDTO>, excluded_tags: Array<TagDTO>): string {
    let tags: string = '';

    for (const tag of included_tags) {
      tags += `+${tag.name}`;
    }

    for (const tag of excluded_tags) {
      tags += `+-${tag.name}`;
    }
    return tags;
  }

  public getPosts(
    included_tags: Array<TagDTO>,
    excluded_tags: Array<TagDTO>,
    page: number = 0,
  ): Promise<Array<PostDTO>> {
    return new Promise<Array<PostDTO>>((res, rej) => {
      const builder: URLBuilder = new URLBuilder(URLBuilder.postURL);
      const tags = APIHandler.buildTags(included_tags, excluded_tags);

      builder
        .addRaw('tags', tags)
        .add('pid', page)
        .build()
        .then(async url => {
          try {
            const response = await this.json(url);
            if (Array.isArray(response)) {
              const posts = response.map(raw => new PostDTO(raw));
              res(posts.filter(t => new URL(t.file_url).pathname !== '/images//'));
            } else {
              res([]);
            }
          } catch (e) {
            rej(e);
          }
        });
    });
  }

  public getPostCount(included_tags: TagDTO[], excluded_tags: TagDTO[]): Promise<number> {
    return new Promise<number>((res, rej) => {
      const builder: URLBuilder = new URLBuilder(URLBuilder.postURL);
      const tags = APIHandler.buildTags(included_tags, excluded_tags);

      builder
        .addRaw('tags', tags)
        .build()
        .then(async url => {
          try {
            const raw = await this.fetch(url.replace('&json=1', ''));
            const xml_div = document.createElement('div');
            const xml = await raw.text();
            xml_div.innerHTML = xml;

            res(Number(xml_div.querySelector('posts')?.getAttribute('count') || 0));
          } catch (e) {
            rej(e);
          }
        });
    });
  }

  public getTag(value: string): Promise<TagDTO | undefined> {
    return new Promise<TagDTO | undefined>((res, rej) => {
      const builder: URLBuilder = new URLBuilder(URLBuilder.tagURL);
      builder
        .add('name', value)
        .build()
        .then(async url => {
          try {
            console.log(url);
            const raw = await this.fetch(url);
            const xml = await raw.text();
            res(TagDTO.fromXML(xml));
          } catch (e) {
            rej(e);
          }
        });
    });
  }

  public async getAutocomplete(value: string): Promise<Array<SimpleTagDTO>> {
    if (this.controller) {
      this.controller.abort();
    }

    const controller = new AbortController();
    this.controller = controller;

    try {
      const builder = new URLBuilder(URLBuilder.autocompleteURL);
      const url = await builder.add('q', value).build();

      const json = await this.json(url, true);

      if (Array.isArray(json)) {
        return json.map(SimpleTagDTO.from);
      }

      return [];
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        return [];
      }
      throw e;
    }
  }
}
