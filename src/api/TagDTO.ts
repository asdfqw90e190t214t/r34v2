type TagXML = string | HTMLElement | null;

export class SimpleTagDTO {
  public label: string = '';
  public value: string = '';

  static from(props: Partial<SimpleTagDTO>): SimpleTagDTO {
    return new SimpleTagDTO(props);
  }

  private constructor(props: Partial<SimpleTagDTO>) {
    Object.assign(this, props);
  }
}

export class TagDTO {
  public type: number = 0;
  public count: number = 0;
  public name: string = '';
  public ambiguous: boolean = false;
  public id: number = 0;

  private constructor(props: Partial<TagDTO>) {
    Object.assign(this, props);
  }

  static fromXML(input?: TagXML): TagDTO | undefined {
    if (!input) {
      return undefined;
    }

    let tag: HTMLElement | null;
    if (typeof input === 'string') {
      tag = document.createElement('div');
      tag.innerHTML = input;
      tag = tag.querySelector('tag') as HTMLElement;
    } else {
      tag = input;
    }

    if (!tag) {
      return undefined;
    }

    const raw: Record<string, string | number | boolean> = {};
    raw['name'] = tag.getAttribute('name') || 'MISSING';

    if (raw['name'] === 'MISSING') {
      return undefined;
    }

    raw['id'] = Number(tag.getAttribute('id') || 0);
    raw['type'] = Number(tag.getAttribute('type') || 0);
    raw['count'] = Number(tag.getAttribute('count') || 0);
    raw['ambiguous'] = tag.getAttribute('ambiguous') === 'true';
    return new TagDTO(raw);
  }

  static fromXMLArray(xml: TagXML): Array<TagDTO> {
    const results: Array<TagDTO> = [];
    if (xml instanceof HTMLElement) {
      xml.querySelectorAll('tag').forEach(tag => {
        const tag_dto = TagDTO.fromXML(tag as TagXML);
        if (tag_dto) {
          results.push(tag_dto);
        }
      });
    }
    return results;
  }
}
