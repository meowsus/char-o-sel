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
  $initialItems;

  /** @type {number} */
  initialItemsWidth = 0;

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
    this.$initialItems = this.querySelectorAll("[data-item]");
  }

  /**
   * @description Connected callback
   * @returns {void}
   */
  connectedCallback() {
    this.#checkRequiredElements();

    this.#calculateInitialItemsWidth();
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

    if (!this.$initialItems.length) {
      throw new Error("Items element not found");
    }
  }

  /**
   * @description Calculate the total width of all items using scrollWidth
   * @returns {void}
   * @private
   */
  #calculateInitialItemsWidth() {
    // Use scrollWidth to get the total width of all items including margins
    this.initialItemsWidth = this.$track.scrollWidth;

    console.log("Initial items width calculated:", this.initialItemsWidth);
  }

  /**
   * @description Set up throttled window resize handler
   * @returns {void}
   * @private
   */
  #setupThrottledWindowResizeHandler() {
    this.#windowResizeHandler = throttle(() => {
      this.#calculateInitialItemsWidth();
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
