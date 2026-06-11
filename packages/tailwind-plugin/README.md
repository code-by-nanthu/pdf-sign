# @pdf-sign/tailwind-plugin

Tailwind CSS v3 + v4 plugin for `@pdf-sign/*`.

Registers `bg-psign-*`, `text-psign-*`, `border-psign-*`, and
`ring-psign-*` utilities. Also ships `base.css` which sets default
CSS custom property values.

## Usage

### Always (all frameworks)

Import `base.css` once in your app entry point:

```ts
import '@pdf-sign/vue/base.css'      // or /react, /angular
```

This sets the default token values on `.pdf-sign-root`.

### Optional: Tailwind v3 plugin

```js
// tailwind.config.js
module.exports = {
  plugins: [
    require('@pdf-sign/tailwind-plugin')({
      primary: '#dc2626',
    }),
  ],
}
```

### Optional: Tailwind v4 plugin

```css
@import "tailwindcss";
@plugin "@pdf-sign/tailwind-plugin";
```

## Token overrides

All tokens can be overridden via CSS custom properties on `.pdf-sign-root`
or any ancestor. See `packages/tailwind-plugin/dist/base.css` for the
full list of `--psign-*` variables.
