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
  $track = null;

  /** @type {NodeListOf<HTMLElement> | null} */
  $initialItems = null;

  /** @type {number} */
  initialItemsWidth = 0;

  /** @type {() => void} */
  #windowResizeHandler = null;

  /** @type {() => void} */
  #windowScrollHandler = null;

  /** @type {number} */
  #lastScrollY = 0;

  /** @type {'down' | 'up'} */
  #scrollDirection = "down";

  /** @type {number} */
  #currentPosition = 0;

  /** @type {number | null} */
  #animationFrameId = null;

  /** @type {number} */
  #speed = 1; // pixels per frame (adjust for desired speed)

  /**
   * @constructor
   * @description Constructor
   * @returns {void}
   */
  constructor() {
    super();

    this.$track = this.querySelector("[data-track]");
    this.$initialItems = this.querySelectorAll("[data-item]");

    this.#lastScrollY = window.scrollY;
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
    this.#setupWindowScrollHandler();
    this.#setupWindowScrollListener();
    this.#startAnimation();
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
   * @description Set up window scroll handler
   * @returns {void}
   * @private
   */
  #setupWindowScrollHandler() {
    this.#windowScrollHandler = () => {
      const currentScrollY = window.scrollY;
      const newDirection = currentScrollY > this.#lastScrollY ? "down" : "up";

      // Only update if scroll direction has changed
      if (newDirection !== this.#scrollDirection) {
        this.#scrollDirection = newDirection;
        this.#updateAnimationDirection();
      }

      this.#lastScrollY = currentScrollY;
    };
  }

  /**
   * @description Set up window scroll listener
   * @returns {void}
   * @private
   */
  #setupWindowScrollListener() {
    window.addEventListener("scroll", this.#windowScrollHandler, {
      passive: true,
    });
  }

  /**
   * @description Start the animation loop
   * @returns {void}
   * @private
   */
  #startAnimation() {
    this.#animate();
  }

  /**
   * @description Animation loop using requestAnimationFrame
   * @returns {void}
   * @private
   */
  #animate() {
    // Update position based on scroll direction
    if (this.#scrollDirection === "down") {
      this.#currentPosition -= this.#speed; // Move left
    } else {
      this.#currentPosition += this.#speed; // Move right
    }

    // Reset position when we've scrolled past one full loop
    // This creates the infinite loop effect
    if (this.#currentPosition <= -this.initialItemsWidth) {
      this.#currentPosition = 0;
    } else if (this.#currentPosition >= 0) {
      // When going backwards, reset to negative position
      this.#currentPosition = -this.initialItemsWidth;
    }

    // Apply transform
    this.$track.style.transform = `translateX(${this.#currentPosition}px)`;

    // Continue animation
    this.#animationFrameId = requestAnimationFrame(() => this.#animate());
  }

  /**
   * @description Update animation direction based on scroll direction
   * @returns {void}
   * @private
   */
  #updateAnimationDirection() {
    // Direction change is now seamless - just update the direction
    // The #animate method will handle the rest
    console.log(`Scroll direction changed to: ${this.#scrollDirection}`);
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

    if (this.#windowScrollHandler) {
      window.removeEventListener("scroll", this.#windowScrollHandler);
      this.#windowScrollHandler = null;
    }

    if (this.#animationFrameId) {
      cancelAnimationFrame(this.#animationFrameId);
      this.#animationFrameId = null;
    }
  }
}

customElements.define("cos-element", COSElement);
