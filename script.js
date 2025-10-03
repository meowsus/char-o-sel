/**
 * @description Throttle function to limit callback execution frequency
 * @param {Function} func - The function to throttle
 * @param {number} wait - The delay in milliseconds
 * @returns {Function} The throttled function
 */
function throttle(func, wait) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), wait);
    }
  };
}

/**
 * @class COSElement
 * @extends HTMLElement
 */
class COSElement extends HTMLElement {
  /** @type {HTMLElement | null} */
  $track;

  /** @type {NodeListOf<HTMLElement> | null} */
  $items;

  /** @type {number} */
  itemsWidth = 0;

  /** @type {() => void} */
  #windowResizeHandler = null;

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
    this.#calculateItemsWidth();
    this.#setupThrottledWindowResizeHandler();
    this.#setupWindowResizeListener();
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

  /**
   * @description Calculate the total width of all items using scrollWidth
   * @returns {void}
   * @private
   */
  #calculateItemsWidth() {
    // Use scrollWidth to get the total width of all items including margins
    this.itemsWidth = this.$track.scrollWidth;

    console.log("Items width calculated:", this.itemsWidth);
  }

  /**
   * @description Set up throttled window resize handler
   * @returns {void}
   * @private
   */
  #setupThrottledWindowResizeHandler() {
    this.#windowResizeHandler = throttle(() => {
      this.#calculateItemsWidth();
    }, 100);
  }

  /**
   * @description Set up window resize listener as backup
   * @returns {void}
   * @private
   */
  #setupWindowResizeListener() {
    window.addEventListener("resize", this.#windowResizeHandler);
  }

  /**
   * @description Disconnected callback
   * @returns {void}
   */
  disconnectedCallback() {
    if (this.#windowResizeHandler) {
      window.removeEventListener("resize", this.#windowResizeHandler);
      this.#windowResizeHandler = null;
    }
  }
}

customElements.define("cos-element", COSElement);
