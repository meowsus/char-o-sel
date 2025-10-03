/**
 * @description Debounce function to delay callback execution until after wait time has elapsed since last call
 * @param {Function} func - The function to debounce
 * @param {number} wait - The delay in milliseconds
 * @returns {Function} The debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
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
    this.#cloneAndAppendInitialItems();
    this.#setupDebouncedWindowResizeHandler();
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
   * @description Clone and append initial items to the end of the track
   * @returns {void}
   * @private
   */
  #cloneAndAppendInitialItems() {
    this.$initialItems.forEach((item) => {
      const clonedItem = item.cloneNode(true);
      this.$track.appendChild(clonedItem);
    });

    console.log("Initial items cloned and appended");
  }

  /**
   * @description Set up debounced window resize handler
   * @returns {void}
   * @private
   */
  #setupDebouncedWindowResizeHandler() {
    this.#windowResizeHandler = debounce(() => {
      this.#calculateInitialItemsWidth();
    }, 250);
  }

  /**
   * @description Set up window resize listener
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
