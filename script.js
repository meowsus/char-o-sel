/**
 * @class COSElement
 * @extends HTMLElement
 */
class COSElement extends HTMLElement {
  /** @type {HTMLElement | null} */
  $track;

  /** @type {NodeListOf<HTMLElement> | null} */
  $items;

  /**
   * @constructor
   * @description Constructor
   * @returns {void}
   */
  constructor() {
    super();

    this.$track = this.querySelector("[data-track]");
    this.$items = this.querySelectorAll("[data-item]");
  }

  /**
   * @description Get image items
   * @returns {Array<HTMLElement>}
   */
  get $imageItems() {
    return Array.from(this.$items).filter((item) =>
      item.querySelector("[data-image-source]")
    );
  }

  /**
   * @description Connected callback
   * @returns {void}
   */
  connectedCallback() {
    this.#checkRequiredElements();

    this.#applyTrackStyles();
    this.#applyImagesStyles();
  }

  /**
   * @description Check if all required elements are present
   * @returns {void}
   * @throws {Error} If a child element is null
   * @private
   */
  #checkRequiredElements() {
    if (!this.$track) {
      throw new Error("Track element not found");
    }

    if (!this.$items.length) {
      throw new Error("Items element not found");
    }
  }

  /**
   * @description Apply track styles
   * @returns {void}
   * @private
   */
  #applyTrackStyles() {
    this.$track.style.touchAction = "pan-y";
    this.$track.style.filter = "blur(0px)";
    this.$track.style.opacity = "1";
    this.$track.style.visibility = "inherit";
  }

  /**
   * @description Apply images styles
   * @returns {void}
   * @private
   */
  #applyImagesStyles() {
    this.$imageItems.forEach((item) => {
      const $source = item.querySelector("[data-image-source]");
      const $placeholder = item.querySelector("[data-image-placeholder]");

      const $outer = item.querySelector("[data-image-container-outer]");
      const $inner = item.querySelector("[data-image-container-inner]");

      const { width, height } = $placeholder.getBoundingClientRect();

      const maxWidth = $source.sizes.split(", ")[1]; // Fairly brittle, but it works

      $outer.style.aspectRatio = `${width} / ${height}`;
      $inner.style.maxWidth = `${maxWidth}px`;
    });
  }
}

customElements.define("cos-element", COSElement);
