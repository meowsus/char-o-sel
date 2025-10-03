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
   * @description Calculate the total width of all initial items including margins
   * @returns {void}
   * @private
   */
  #calculateInitialItemsWidth() {
    // Calculate the actual width of each initial item including margins
    let totalWidth = 0;

    this.$initialItems.forEach((item) => {
      const itemWidth = item.offsetWidth;
      const computedStyle = window.getComputedStyle(item);
      const marginLeft = parseFloat(computedStyle.marginLeft) || 0;
      const marginRight = parseFloat(computedStyle.marginRight) || 0;

      totalWidth += itemWidth + marginLeft + marginRight;
    });

    this.initialItemsWidth = totalWidth;

    this.$track.style.setProperty(
      "--cos-initial-items-width",
      `${this.initialItemsWidth}px`
    );

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
