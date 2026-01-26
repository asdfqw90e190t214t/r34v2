type PostRating = 'explicit' | 'questionable' | string;

export class PostDTO {
  /**
   * Low resolution preview for image or video
   */
  public preview_url: string = '';

  /**
   * High resolution preview for image or video
   */
  public sample_url: string = '';

  /**
   * Source media at full quality and type
   */
  public file_url: string = '';

  /**
   * Epoch for created / modified
   */
  public change: number = 0;

  /**
   * Identifier for post
   */
  public id: number = 0;

  /**
   * Original poster
   */
  public owner: string = '';

  /**
   * Post rating, currently only known are:
   * "explicit" or "questionable"
   */
  public rating: PostRating = '';

  /**
   * If non-zero, height of sample_url source
   */
  public sample_height: number = 0;

  /**
   * If non-zero, width of sample_url source
   */
  public sample_width: number = 0;

  /**
   * Space-delimited tags for post
   */
  public tags: string = '';

  /**
   * Width of file_url media
   */
  public width: number = 0;

  /**
   * Height of file_url media
   */
  public height: number = 0;

  constructor(props: Partial<PostDTO>) {
    Object.assign(this, props);
  }
}
