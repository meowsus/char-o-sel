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
  #baseSpeed = 1; // pixels per frame (adjust for desired speed)

  /** @type {number} */
  #currentSpeed = 1; // current speed (can be boosted)

  /** @type {number} */
  #speedBoostMultiplier = 3; // 2x speed on direction change

  /** @type {number} */
  #speedDecayRate = 0.1; // how fast speed returns to normal (lower = slower decay)

  /** @type {boolean} */
  #isDragging = false;

  /** @type {number} */
  #dragStartX = 0;

  /** @type {number} */
  #dragStartY = 0;

  /** @type {number} */
  #dragStartPosition = 0;

  /** @type {boolean} */
  #touchDirectionDetermined = false;

  /** @type {'horizontal' | 'vertical' | null} */
  #touchDirection = null;

  /** @type {Function | null} */
  #boundMouseDown = null;

  /** @type {Function | null} */
  #boundMouseMove = null;

  /** @type {Function | null} */
  #boundMouseUp = null;

  /** @type {Function | null} */
  #boundMouseLeave = null;

  /** @type {Function | null} */
  #boundTouchStart = null;

  /** @type {Function | null} */
  #boundTouchMove = null;

  /** @type {Function | null} */
  #boundTouchEnd = null;

  /** @type {Function | null} */
  #boundTouchCancel = null;

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
    this.#setupDragListeners();
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

      // Apply speed boost on every scroll
      this.#applySpeedBoost();

      // Update direction if it changed
      if (newDirection !== this.#scrollDirection) {
        this.#scrollDirection = newDirection;
        console.log(`Scroll direction changed to: ${this.#scrollDirection}`);
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
   * @description Set up drag listeners for click and drag functionality
   * @returns {void}
   * @private
   */
  #setupDragListeners() {
    // Bind and store functions for proper cleanup
    this.#boundMouseDown = this.#handleMouseDown.bind(this);
    this.#boundMouseMove = this.#handleMouseMove.bind(this);
    this.#boundMouseUp = this.#handleMouseUp.bind(this);
    this.#boundMouseLeave = this.#handleMouseLeave.bind(this);

    this.$track.addEventListener("mousedown", this.#boundMouseDown);
    this.$track.addEventListener("mousemove", this.#boundMouseMove);
    this.$track.addEventListener("mouseup", this.#boundMouseUp);
    this.$track.addEventListener("mouseleave", this.#boundMouseLeave);

    // Touch event listeners for mobile
    this.#boundTouchStart = this.#handleTouchStart.bind(this);
    this.#boundTouchMove = this.#handleTouchMove.bind(this);
    this.#boundTouchEnd = this.#handleTouchEnd.bind(this);
    this.#boundTouchCancel = this.#handleTouchCancel.bind(this);

    this.$track.addEventListener("touchstart", this.#boundTouchStart, {
      passive: false,
    });
    this.$track.addEventListener("touchmove", this.#boundTouchMove, {
      passive: false,
    });
    this.$track.addEventListener("touchend", this.#boundTouchEnd);
    this.$track.addEventListener("touchcancel", this.#boundTouchCancel);

    // Prevent default drag behavior on images/videos
    this.$track.addEventListener("dragstart", (e) => e.preventDefault());
  }

  /**
   * @description Handle mouse down event to start dragging
   * @param {MouseEvent} e - Mouse event
   * @returns {void}
   * @private
   */
  #handleMouseDown(e) {
    this.#isDragging = true;
    this.#dragStartX = e.clientX;
    this.#dragStartPosition = this.#currentPosition;
    this.$track.style.cursor = "grabbing";

    console.log("Drag started");
  }

  /**
   * @description Handle mouse move event to update position while dragging
   * @param {MouseEvent} e - Mouse event
   * @returns {void}
   * @private
   */
  #handleMouseMove(e) {
    if (!this.#isDragging) return;

    const deltaX = e.clientX - this.#dragStartX;
    this.#currentPosition = this.#dragStartPosition + deltaX;

    // Calculate the visual position with wrapping (for display only)
    // This allows seamless infinite scrolling without resetting drag state
    let visualPosition = this.#currentPosition;

    // Normalize visual position to always be within bounds [-range, 0)
    const range = this.initialItemsWidth;
    visualPosition = ((visualPosition % range) + range) % range;
    if (visualPosition >= 0) {
      visualPosition -= range;
    }

    // Apply transform with wrapped position
    this.$track.style.transform = `translateX(${visualPosition}px)`;
  }

  /**
   * @description Handle mouse up event to stop dragging
   * @returns {void}
   * @private
   */
  #handleMouseUp() {
    if (this.#isDragging) {
      this.#isDragging = false;
      this.$track.style.cursor = "grab";

      // Normalize position after drag for smooth animation continuation
      const range = this.initialItemsWidth;
      this.#currentPosition = ((this.#currentPosition % range) + range) % range;
      if (this.#currentPosition >= 0) {
        this.#currentPosition -= range;
      }

      console.log("Drag ended");
    }
  }

  /**
   * @description Handle mouse leave event to stop dragging if mouse leaves
   * @returns {void}
   * @private
   */
  #handleMouseLeave() {
    if (this.#isDragging) {
      this.#isDragging = false;
      this.$track.style.cursor = "grab";

      // Normalize position after drag for smooth animation continuation
      const range = this.initialItemsWidth;
      this.#currentPosition = ((this.#currentPosition % range) + range) % range;
      if (this.#currentPosition >= 0) {
        this.#currentPosition -= range;
      }

      console.log("Drag ended (mouse left track)");
    }
  }

  /**
   * @description Handle touch start event to start dragging on mobile
   * @param {TouchEvent} e - Touch event
   * @returns {void}
   * @private
   */
  #handleTouchStart(e) {
    if (e.touches.length !== 1) return; // Only handle single touch

    // Record initial touch position but don't prevent default yet
    // We'll determine direction in touchmove
    this.#dragStartX = e.touches[0].clientX;
    this.#dragStartY = e.touches[0].clientY;
    this.#dragStartPosition = this.#currentPosition;
    this.#touchDirectionDetermined = false;
    this.#touchDirection = null;

    console.log("Touch started - waiting for direction");
  }

  /**
   * @description Handle touch move event to update position while dragging on mobile
   * @param {TouchEvent} e - Touch event
   * @returns {void}
   * @private
   */
  #handleTouchMove(e) {
    if (e.touches.length !== 1) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;

    // Determine touch direction on first move
    if (!this.#touchDirectionDetermined) {
      const deltaX = Math.abs(currentX - this.#dragStartX);
      const deltaY = Math.abs(currentY - this.#dragStartY);

      // Need some minimum movement to determine direction (avoid jitter)
      if (deltaX > 5 || deltaY > 5) {
        this.#touchDirectionDetermined = true;

        if (deltaX > deltaY) {
          // Horizontal movement - engage carousel drag
          this.#touchDirection = "horizontal";
          this.#isDragging = true;
          console.log("Touch direction: horizontal - carousel drag engaged");
        } else {
          // Vertical movement - allow normal scrolling
          this.#touchDirection = "vertical";
          this.#isDragging = false;
          console.log("Touch direction: vertical - allowing page scroll");
          return; // Let the browser handle vertical scroll
        }
      } else {
        // Not enough movement yet to determine direction
        return;
      }
    }

    // Only handle horizontal dragging
    if (this.#touchDirection === "vertical") {
      return; // Let the browser handle vertical scroll
    }

    if (!this.#isDragging) return;

    // Prevent default to avoid scrolling while horizontally dragging
    e.preventDefault();

    const deltaX = currentX - this.#dragStartX;
    this.#currentPosition = this.#dragStartPosition + deltaX;

    // Calculate the visual position with wrapping (for display only)
    // This allows seamless infinite scrolling without resetting drag state
    let visualPosition = this.#currentPosition;

    // Normalize visual position to always be within bounds [-range, 0)
    const range = this.initialItemsWidth;
    visualPosition = ((visualPosition % range) + range) % range;
    if (visualPosition >= 0) {
      visualPosition -= range;
    }

    // Apply transform with wrapped position
    this.$track.style.transform = `translateX(${visualPosition}px)`;
  }

  /**
   * @description Handle touch end event to stop dragging on mobile
   * @returns {void}
   * @private
   */
  #handleTouchEnd() {
    if (this.#isDragging) {
      this.#isDragging = false;

      // Normalize position after drag for smooth animation continuation
      const range = this.initialItemsWidth;
      this.#currentPosition = ((this.#currentPosition % range) + range) % range;
      if (this.#currentPosition >= 0) {
        this.#currentPosition -= range;
      }

      console.log("Touch drag ended");
    }

    // Reset touch direction tracking
    this.#touchDirectionDetermined = false;
    this.#touchDirection = null;
  }

  /**
   * @description Handle touch cancel event to stop dragging on mobile
   * @returns {void}
   * @private
   */
  #handleTouchCancel() {
    if (this.#isDragging) {
      this.#isDragging = false;

      // Normalize position after drag for smooth animation continuation
      const range = this.initialItemsWidth;
      this.#currentPosition = ((this.#currentPosition % range) + range) % range;
      if (this.#currentPosition >= 0) {
        this.#currentPosition -= range;
      }

      console.log("Touch drag cancelled");
    }

    // Reset touch direction tracking
    this.#touchDirectionDetermined = false;
    this.#touchDirection = null;
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
    // Skip animation if user is dragging
    if (!this.#isDragging) {
      // Smoothly decay speed back to base speed if boosted
      if (this.#currentSpeed > this.#baseSpeed) {
        this.#currentSpeed = Math.max(
          this.#baseSpeed,
          this.#currentSpeed -
            (this.#currentSpeed - this.#baseSpeed) * this.#speedDecayRate
        );
      }

      // Update position based on scroll direction
      if (this.#scrollDirection === "down") {
        this.#currentPosition -= this.#currentSpeed; // Move left
      } else {
        this.#currentPosition += this.#currentSpeed; // Move right
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
    }

    // Continue animation loop
    this.#animationFrameId = requestAnimationFrame(() => this.#animate());
  }

  /**
   * @description Apply speed boost to carousel animation
   * @returns {void}
   * @private
   */
  #applySpeedBoost() {
    // Boost speed on every scroll action
    this.#currentSpeed = this.#baseSpeed * this.#speedBoostMultiplier;

    console.log(
      `Speed boosted to ${this.#currentSpeed}px/frame (direction: ${
        this.#scrollDirection
      })`
    );
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

    // Clean up drag listeners
    if (this.#boundMouseDown) {
      this.$track.removeEventListener("mousedown", this.#boundMouseDown);
      this.#boundMouseDown = null;
    }

    if (this.#boundMouseMove) {
      this.$track.removeEventListener("mousemove", this.#boundMouseMove);
      this.#boundMouseMove = null;
    }

    if (this.#boundMouseUp) {
      this.$track.removeEventListener("mouseup", this.#boundMouseUp);
      this.#boundMouseUp = null;
    }

    if (this.#boundMouseLeave) {
      this.$track.removeEventListener("mouseleave", this.#boundMouseLeave);
      this.#boundMouseLeave = null;
    }

    // Clean up touch listeners
    if (this.#boundTouchStart) {
      this.$track.removeEventListener("touchstart", this.#boundTouchStart);
      this.#boundTouchStart = null;
    }

    if (this.#boundTouchMove) {
      this.$track.removeEventListener("touchmove", this.#boundTouchMove);
      this.#boundTouchMove = null;
    }

    if (this.#boundTouchEnd) {
      this.$track.removeEventListener("touchend", this.#boundTouchEnd);
      this.#boundTouchEnd = null;
    }

    if (this.#boundTouchCancel) {
      this.$track.removeEventListener("touchcancel", this.#boundTouchCancel);
      this.#boundTouchCancel = null;
    }
  }
}

customElements.define("cos-element", COSElement);
