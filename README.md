# Char-O-Sel

I unabashedly reverse-engineered [Character](https://character.studio/)'s carousel but as a web component. Y'all brohs feel free to come at me.

You can check out a demo here: https://codepen.io/meowsus/pen/raxWrLZ

## Container HTML

Functionality is provided by the custom element `cos-element`. This structure is necessary for the element to work.

```html
<cos-element class="cos">
  <section class="cos__section">
    <ul class="cos__list" data-track>
      <li class="cos__item" data-item style="aspect-ratio: 1 / 1">
        <div class="cos__item-container">...</div>
      </li>
    </ul>
  </section>
</cos-element>
```

## Item HTML

`style="aspect-ratio: X / Y"` attributes are required for each item. In a pinch you can just use the width and height of the image.

### Videos

```html
<li class="cos__item" data-item style="aspect-ratio: 570.61 / 661">
  <div class="cos__item-container">
    <video
      src="https://www.datocms-assets.com/143253/1736787490-charsquare.mp4"
      autoplay="true"
      loop="true"
      playsinline="true"
      muted="true"
      class="cos__media"
      data-video
    ></video>
  </div>
</li>
```

### Pictures

```html
<li class="cos__item" data-item style="aspect-ratio: 1 / 1">
  <div class="cos__item-container">
    <picture class="cos__picture">
      <source
        srcset="
          https://www.datocms-assets.com/143253/1735928673-img-01.png?dpr=0.2  920w,
          https://www.datocms-assets.com/143253/1735928673-img-01.png?dpr=0.4 1840w,
          https://www.datocms-assets.com/143253/1735928673-img-01.png?dpr=0.6 2760w,
          https://www.datocms-assets.com/143253/1735928673-img-01.png?dpr=0.8 3680w,
          https://www.datocms-assets.com/143253/1735928673-img-01.png         4600w
        "
        sizes="(max-width: 4600px) 100vw, 4600px"
      />
      <img
        src="https://www.datocms-assets.com/143253/1735928673-img-01.png"
        alt="Hipp's scheduling UI"
        title="Hipp's scheduling UI"
        fetchpriority="high"
        class="cos__media"
      />
    </picture>
  </div>
</li>
```
