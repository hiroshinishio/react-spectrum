/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {colorScale, colorToken, fontSizeToken, getToken, simpleColorScale, weirdColorToken} from './tokens' with {type: 'macro'};
import {createArbitraryProperty, createColorProperty, createMappedProperty, createRenamedProperty, createTheme} from './style-macro';
import type * as CSS from 'csstype';

interface MacroContext {
  addAsset(asset: {type: string, content: string}): void
}

function pxToRem(px: string | number) {
  if (typeof px === 'string') {
    px = parseFloat(px);
  }
  return px / 16 + 'rem';
}

const color = {
  transparent: 'transparent',
  black: 'black',
  white: 'white',

  ...colorScale('gray'),
  ...colorScale('blue'),
  ...colorScale('red'),
  ...colorScale('orange'),
  ...colorScale('yellow'),
  ...colorScale('chartreuse'),
  ...colorScale('celery'),
  ...colorScale('green'),
  ...colorScale('seafoam'),
  ...colorScale('cyan'),
  ...colorScale('indigo'),
  ...colorScale('purple'),
  ...colorScale('fuchsia'),
  ...colorScale('magenta'),
  ...colorScale('pink'),
  ...colorScale('turquoise'),
  ...colorScale('brown'),
  ...colorScale('silver'),
  ...colorScale('cinnamon'),

  ...colorScale('accent-color'),
  ...colorScale('informative-color'),
  ...colorScale('negative-color'),
  ...colorScale('notice-color'),
  ...colorScale('positive-color'),

  ...simpleColorScale('transparent-white'),
  ...simpleColorScale('transparent-black'),

  // High contrast mode.
  Background: 'Background',
  ButtonBorder: 'ButtonBorder',
  ButtonFace: 'ButtonFace',
  ButtonText: 'ButtonText',
  Field: 'Field',
  Highlight: 'Highlight',
  HighlightText: 'HighlightText',
  GrayText: 'GrayText',
  Mark: 'Mark',
  LinkText: 'LinkText'
};

export function baseColor(base: keyof typeof color) {
  let keys = Object.keys(color) as (keyof typeof color)[];
  let index = keys.indexOf(base);
  if (index === -1) {
    throw new Error('Invalid base color ' + base);
  }

  return {
    default: base,
    isHovered: keys[index + 1],
    isFocusVisible: keys[index + 1],
    isPressed: keys[index + 1]
  };
}

export function lightDark(light: keyof typeof color, dark: keyof typeof color): `[${string}]` {
  return `[light-dark(${color[light]}, ${color[dark]})]`;
}

function generateSpacing<K extends number[]>(px: K): {[P in K[number]]: string} {
  let res: any = {};
  for (let p of px) {
    res[p] = pxToRem(p);
  }
  return res;
}

const baseSpacing = generateSpacing([
  0,
  // 2, // spacing-50 !! TODO: should we support this?
  4, // spacing-75
  8, // spacing-100
  12, // spacing-200
  16, // spacing-300
  20,
  24, // spacing-400
  28,
  32, // spacing-500
  36,
  40, // spacing-600
  44,
  48, // spacing-700
  56,
  // From here onward the values are mostly spaced by 1rem (16px)
  64, // spacing-800
  80, // spacing-900
  96, // spacing-1000
  // TODO: should these only be available as sizes rather than spacing?
  112,
  128,
  144,
  160,
  176,
  192,
  208,
  224,
  240,
  256,
  288,
  320,
  384
] as const);

// This should match the above, but negative. There's no way to negate a number
// type in typescript so this has to be done manually for now.
const negativeSpacing = generateSpacing([
  // -2, // spacing-50 !! TODO: should we support this?
  -4, // spacing-75
  -8, // spacing-100
  -12, // spacing-200
  -16, // spacing-300
  -20,
  -24, // spacing-400
  -28,
  -32, // spacing-500
  -36,
  -40, // spacing-600
  -44,
  -48, // spacing-700
  -56,
  // From here onward the values are mostly spaced by 1rem (16px)
  -64, // spacing-800
  -80, // spacing-900
  -96, // spacing-1000
  // TODO: should these only be available as sizes rather than spacing?
  -112,
  -128,
  -144,
  -160,
  -176,
  -192,
  -208,
  -224,
  -240,
  -256,
  -288,
  -320,
  -384
] as const);

function arbitrary(ctx: MacroContext | void, value: string): `[${string}]` {
  return ctx ? `[${value}]` : value as any;
}

export function fontRelative(this: MacroContext | void, base: number, baseFontSize = 14) {
  return arbitrary(this, (base / baseFontSize) + 'em');
}

export function edgeToText(this: MacroContext | void, height: keyof typeof baseSpacing) {
  return `calc(${baseSpacing[height]} * 3 / 8)`;
}

export function space(this: MacroContext | void, px: number) {
  return arbitrary(this, pxToRem(px));
}

const spacing = {
  ...baseSpacing,

  // font-size relative values
  'text-to-control': fontRelative(10),
  'text-to-visual': {
    default: fontRelative(6), // -> 5px, 5px, 6px, 7px, 8px
    touch: fontRelative(8, 17) // -> 6px, 7px, 8px, 9px, 10px, should be 7px, 7px, 8px, 9px, 11px
  },
  // height relative values
  'edge-to-text': 'calc(self(height, self(minHeight)) * 3 / 8)',
  'pill': 'calc(self(height, self(minHeight)) / 2)'
};

export function size(this: MacroContext | void, px: number) {
  return {default: arbitrary(this, pxToRem(px)), touch: arbitrary(this, pxToRem(px * 1.25))};
}

const scaledSpacing: {[key in keyof typeof baseSpacing]: {default: string, touch: string}} =
  Object.fromEntries(Object.entries(baseSpacing).map(([k, v]) =>
    [k, {default: v, touch: parseFloat(v) * 1.25 + v.match(/[^0-9.]+/)![0]}])
  ) as any;

const sizing = {
  ...scaledSpacing,
  auto: 'auto',
  full: '100%',
  screen: '100vh',
  min: 'min-content',
  max: 'max-content',
  fit: 'fit-content',

  control: {
    default: size(32),
    size: {
      XS: size(20),
      S: size(24),
      L: size(40),
      XL: size(48)
    }
  },
  // With browser support for round() we could do this:
  // 'control-sm': `round(${16 / 14}em, 2px)`
  'control-sm': {
    default: size(16),
    size: {
      S: size(14),
      L: size(18),
      XL: size(20)
    }
  }
};

const margin = {
  ...spacing,
  ...negativeSpacing,
  auto: 'auto'
};

const inset = {
  ...baseSpacing,
  auto: 'auto',
  full: '100%'
};

const translate = {
  ...baseSpacing,
  ...negativeSpacing,
  full: '100%'
};

const borderWidth = {
  0: '0px',
  1: getToken('border-width-100'),
  2: getToken('border-width-200'),
  4: getToken('border-width-400')
};

const radius = {
  none: getToken('corner-radius-none'), // 0px
  sm: pxToRem(getToken('corner-radius-small-default')), // 4px
  default: pxToRem(getToken('corner-radius-medium-default')), // 8px
  lg: pxToRem(getToken('corner-radius-large-default')), // 10px
  xl: pxToRem(getToken('corner-radius-extra-large-default')), // 16px
  full: '9999px',
  pill: 'calc(self(height, self(minHeight, 9999px)) / 2)',
  control: fontRelative(8), // automatic based on font size (e.g. t-shirt size logarithmic scale)
  'control-sm': fontRelative(4)
};

type GridTrack = 'none' | 'subgrid' | (string & {}) | readonly GridTrackSize[];
type GridTrackSize = 'auto' | 'min-content' | 'max-content' | `${number}fr` | `minmax(${string}, ${string})` | keyof typeof baseSpacing | (string & {});

let gridTrack = (value: GridTrack) => {
  if (typeof value === 'string') {
    return value;
  }
  return value.map(v => gridTrackSize(v)).join(' ');
};

let gridTrackSize = (value: GridTrackSize) => {
  // @ts-ignore
  return value in baseSpacing ? baseSpacing[value] : value;
};

const transitionProperty = {
  default: 'color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, backdrop-filter',
  colors: 'color, background-color, border-color, text-decoration-color, fill, stroke',
  opacity: 'opacity',
  shadow: 'box-shadow',
  transform: 'transform, translate, scale, rotate',
  all: 'all',
  none: 'none'
};

// TODO
const timingFunction = {
  default: 'cubic-bezier(0.45, 0, 0.4, 1)',
  linear: 'linear',
  in: 'cubic-bezier(0.5, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.40, 1)',
  'in-out': 'cubic-bezier(0.45, 0, 0.4, 1)'
};

// TODO: do these need tokens or are arbitrary values ok?
let durationProperty = createArbitraryProperty((value: number | string, property) => ({[property]: typeof value === 'number' ? value + 'ms' : value}));

// const colorWithAlpha = createColorProperty(color);

const fontWeightBase = {
  light: '300',
  // TODO: spectrum calls this "regular" but CSS calls it "normal". We also call other properties "default". What do we want to match?
  normal: '400',
  medium: '500',
  bold: '700',
  'extra-bold': '800',
  black: '900'
} as const;

const i18nFonts = {
  ':lang(ar)': 'myriad-arabic, ui-sans-serif, system-ui, sans-serif',
  ':lang(he)': 'myriad-hebrew, ui-sans-serif, system-ui, sans-serif',
  ':lang(ja)': "adobe-clean-han-japanese, 'Hiragino Kaku Gothic ProN', 'ヒラギノ角ゴ ProN W3', Osaka, YuGothic, 'Yu Gothic', 'メイリオ', Meiryo, 'ＭＳ Ｐゴシック', 'MS PGothic', sans-serif",
  ':lang(ko)': "adobe-clean-han-korean, source-han-korean, 'Malgun Gothic', 'Apple Gothic', sans-serif",
  ':lang(zh)': "adobe-clean-han-traditional, source-han-traditional, 'MingLiu', 'Heiti TC Light', sans-serif",
  // TODO: are these fallbacks supposed to be different than above?
  ':lang(zh-hant)': "adobe-clean-han-traditional, source-han-traditional, 'MingLiu', 'Microsoft JhengHei UI', 'Microsoft JhengHei', 'Heiti TC Light', sans-serif",
  ':lang(zh-Hans, zh-CN, zh-SG)': "adobe-clean-han-simplified-c, source-han-simplified-c, 'SimSun', 'Heiti SC Light', sans-serif"
} as const;

export const style = createTheme({
  properties: {
    // colors
    color: createColorProperty({
      ...color,
      accent: {
        default: colorToken('accent-content-color-default'),
        isHovered: colorToken('accent-content-color-hover'),
        isFocusVisible: colorToken('accent-content-color-key-focus'),
        isPressed: colorToken('accent-content-color-down')
        // isSelected: colorToken('accent-content-color-selected'), // same as pressed
      },
      neutral: {
        default: colorToken('neutral-content-color-default'),
        isHovered: colorToken('neutral-content-color-hover'),
        isFocusVisible: colorToken('neutral-content-color-key-focus'),
        isPressed: colorToken('neutral-content-color-down')
        // isSelected: colorToken('neutral-subdued-content-color-selected'),
      },
      'neutral-subdued': {
        default: colorToken('neutral-subdued-content-color-default'),
        isHovered: colorToken('neutral-subdued-content-color-hover'),
        isFocusVisible: colorToken('neutral-subdued-content-color-key-focus'),
        isPressed: colorToken('neutral-subdued-content-color-down')
        // isSelected: colorToken('neutral-subdued-content-color-selected'),
      },
      negative: {
        default: colorToken('negative-content-color-default'),
        isHovered: colorToken('negative-content-color-hover'),
        isFocusVisible: colorToken('negative-content-color-key-focus'),
        isPressed: colorToken('negative-content-color-down')
      },
      disabled: {
        default: colorToken('disabled-content-color')
        // forcedColors: 'GrayText'
      },
      heading: colorToken('heading-color'),
      body: colorToken('body-color'),
      detail: colorToken('detail-color'),
      code: colorToken('code-color')
    }),
    backgroundColor: createColorProperty({
      ...color,
      accent: {
        default: weirdColorToken('accent-background-color-default'),
        isHovered: weirdColorToken('accent-background-color-hover'),
        isFocusVisible: weirdColorToken('accent-background-color-key-focus'),
        isPressed: weirdColorToken('accent-background-color-down')
      },
      neutral: {
        default: colorToken('neutral-background-color-default'),
        isHovered: colorToken('neutral-background-color-hover'),
        isFocusVisible: colorToken('neutral-background-color-key-focus'),
        isPressed: colorToken('neutral-background-color-down')
      },
      'neutral-subdued': {
        default: weirdColorToken('neutral-subdued-background-color-default'),
        isHovered: weirdColorToken('neutral-subdued-background-color-hover'),
        isFocusVisible: weirdColorToken('neutral-subdued-background-color-key-focus'),
        isPressed: weirdColorToken('neutral-subdued-background-color-down')
      },
      'neutral-subtle': colorToken('neutral-subtle-background-color-default'),
      negative: {
        default: weirdColorToken('negative-background-color-default'),
        isHovered: weirdColorToken('negative-background-color-hover'),
        isFocusVisible: weirdColorToken('negative-background-color-key-focus'),
        isPressed: weirdColorToken('negative-background-color-down')
      },
      'negative-subdued': {
        default: colorToken('negative-subdued-background-color-default'),
        isHovered: colorToken('negative-subdued-background-color-hover'),
        isFocusVisible: colorToken('negative-subdued-background-color-key-focus'),
        isPressed: colorToken('negative-subdued-background-color-down')
      },
      // Sort of weird to have both subdued and subtle that map to the same color...
      'negative-subtle': colorToken('negative-subtle-background-color-default'),
      informative: {
        default: weirdColorToken('informative-background-color-default'),
        isHovered: weirdColorToken('informative-background-color-hover'),
        isFocusVisible: weirdColorToken('informative-background-color-key-focus'),
        isPressed: weirdColorToken('informative-background-color-down')
      },
      'informative-subtle': colorToken('informative-subtle-background-color-default'),
      positive: {
        default: weirdColorToken('positive-background-color-default'),
        isHovered: weirdColorToken('positive-background-color-hover'),
        isFocusVisible: weirdColorToken('positive-background-color-key-focus'),
        isPressed: weirdColorToken('positive-background-color-down')
      },
      'positive-subtle': colorToken('positive-subtle-background-color-default'),
      notice: weirdColorToken('notice-background-color-default'),
      'notice-subtle': colorToken('notice-subtle-background-color-default'),
      gray: weirdColorToken('gray-background-color-default'),
      red: weirdColorToken('red-background-color-default'),
      orange: weirdColorToken('orange-background-color-default'),
      yellow: weirdColorToken('yellow-background-color-default'),
      chartreuse: weirdColorToken('chartreuse-background-color-default'),
      celery: weirdColorToken('celery-background-color-default'),
      green: weirdColorToken('green-background-color-default'),
      seafoam: weirdColorToken('seafoam-background-color-default'),
      cyan: weirdColorToken('cyan-background-color-default'),
      blue: weirdColorToken('blue-background-color-default'),
      indigo: weirdColorToken('indigo-background-color-default'),
      purple: weirdColorToken('purple-background-color-default'),
      fuchsia: weirdColorToken('fuchsia-background-color-default'),
      magenta: weirdColorToken('magenta-background-color-default'),
      pink: weirdColorToken('pink-background-color-default'),
      turquoise: weirdColorToken('turquoise-background-color-default'),
      cinnamon: weirdColorToken('cinnamon-background-color-default'),
      brown: weirdColorToken('brown-background-color-default'),
      silver: weirdColorToken('silver-background-color-default'),
      disabled: colorToken('disabled-background-color'),
      base: colorToken('background-base-color'),
      'layer-1': colorToken('background-layer-1-color'),
      'layer-2': weirdColorToken('background-layer-2-color'),
      pasteboard: weirdColorToken('background-pasteboard-color')
    }),
    borderColor: createColorProperty({
      ...color,
      negative: {
        default: colorToken('negative-border-color-default'),
        isHovered: colorToken('negative-border-color-hover'),
        isFocusVisible: colorToken('negative-border-color-key-focus'),
        isPressed: colorToken('negative-border-color-down')
      },
      disabled: colorToken('disabled-border-color')
        // forcedColors: 'GrayText'

    }),
    outlineColor: createColorProperty({
      ...color,
      'focus-ring': {
        default: colorToken('focus-indicator-color'),
        forcedColors: 'Highlight'
      }
    }),
    // textDecorationColor: colorWithAlpha,
    // accentColor: colorWithAlpha,
    // caretColor: colorWithAlpha,
    fill: createColorProperty({
      none: 'none',
      currentColor: 'currentColor',
      accent: weirdColorToken('accent-visual-color'),
      neutral: weirdColorToken('neutral-visual-color'),
      negative: weirdColorToken('negative-visual-color'),
      informative: weirdColorToken('informative-visual-color'),
      positive: weirdColorToken('positive-visual-color'),
      notice: weirdColorToken('notice-visual-color'),
      gray: weirdColorToken('gray-visual-color'),
      red: weirdColorToken('red-visual-color'),
      orange: weirdColorToken('orange-visual-color'),
      yellow: weirdColorToken('yellow-visual-color'),
      chartreuse: weirdColorToken('chartreuse-visual-color'),
      celery: weirdColorToken('celery-visual-color'),
      green: weirdColorToken('green-visual-color'),
      seafoam: weirdColorToken('seafoam-visual-color'),
      cyan: weirdColorToken('cyan-visual-color'),
      blue: weirdColorToken('blue-visual-color'),
      indigo: weirdColorToken('indigo-visual-color'),
      purple: weirdColorToken('purple-visual-color'),
      fuchsia: weirdColorToken('fuchsia-visual-color'),
      magenta: weirdColorToken('magenta-visual-color'),
      pink: weirdColorToken('pink-visual-color'),
      turquoise: weirdColorToken('turquoise-visual-color'),
      cinnamon: weirdColorToken('cinnamon-visual-color'),
      brown: weirdColorToken('brown-visual-color'),
      silver: weirdColorToken('silver-visual-color'),
      ...color
    }),
    stroke: createColorProperty({
      none: 'none',
      currentColor: 'currentColor',
      ...color
    }),

    // dimensions
    borderSpacing: baseSpacing, // TODO: separate x and y
    flexBasis: {
      auto: 'auto',
      full: '100%',
      ...baseSpacing
    },
    rowGap: spacing,
    columnGap: spacing,
    height: sizing,
    width: sizing,
    containIntrinsicWidth: sizing,
    containIntrinsicHeight: sizing,
    minHeight: sizing,
    maxHeight: {
      ...sizing,
      none: 'none'
    },
    minWidth: sizing,
    maxWidth: {
      ...sizing,
      none: 'none'
    },
    borderStartWidth: createRenamedProperty('borderInlineStartWidth', borderWidth),
    borderEndWidth: createRenamedProperty('borderInlineEndWidth', borderWidth),
    borderTopWidth: borderWidth,
    borderBottomWidth: borderWidth,
    borderStyle: ['solid', 'dashed', 'dotted', 'double', 'hidden', 'none'] as const,
    strokeWidth: {
      0: '0',
      1: '1',
      2: '2'
    },
    marginStart: createRenamedProperty('marginInlineStart', margin),
    marginEnd: createRenamedProperty('marginInlineEnd', margin),
    marginTop: margin,
    marginBottom: margin,
    paddingStart: createRenamedProperty('paddingInlineStart', spacing),
    paddingEnd: createRenamedProperty('paddingInlineEnd', spacing),
    paddingTop: spacing,
    paddingBottom: spacing,
    scrollMarginStart: createRenamedProperty('scrollMarginInlineStart', baseSpacing),
    scrollMarginEnd: createRenamedProperty('scrollMarginInlineEnd', baseSpacing),
    scrollMarginTop: baseSpacing,
    scrollMarginBottom: baseSpacing,
    scrollPaddingStart: createRenamedProperty('scrollPaddingInlineStart', baseSpacing),
    scrollPaddingEnd: createRenamedProperty('scrollPaddingInlineEnd', baseSpacing),
    scrollPaddingTop: baseSpacing,
    scrollPaddingBottom: baseSpacing,
    textIndent: baseSpacing,
    translateX: createMappedProperty(value => ({
      '--translateX': value,
      translate: 'var(--translateX, 0) var(--translateY, 0)'
    }), translate),
    translateY: createMappedProperty(value => ({
      '--translateY': value,
      translate: 'var(--translateX, 0) var(--translateY, 0)'
    }), translate),
    rotate: createArbitraryProperty((value: number | `${number}deg` | `${number}rad` | `${number}grad` | `${number}turn`, property) => ({[property]: typeof value === 'number' ? `${value}deg` : value})),
    scale: createArbitraryProperty<number>(),
    transform: createArbitraryProperty<string>(),
    position: ['absolute', 'fixed', 'relative', 'sticky', 'static'] as const,
    insetStart: createRenamedProperty('insetInlineStart', inset),
    insetEnd: createRenamedProperty('insetInlineEnd', inset),
    top: inset,
    left: inset,
    bottom: inset,
    right: inset,
    aspectRatio: {
      auto: 'auto',
      square: '1 / 1',
      video: '16 / 9'
    },

    // text
    fontFamily: {
      sans: {
        default: 'Adobe Colin VF, adobe-clean, ui-sans-serif, system-ui, sans-serif',
        ...i18nFonts
      },
      serif: {
        default: 'adobe-clean-serif, "Source Serif", Georgia, serif',
        ...i18nFonts
      },
      code: 'source-code-pro, "Source Code Pro", Monaco, monospace'
    },
    fontSize: {
      // The default font size scale is for use within UI components.
      'ui-xs': fontSizeToken('font-size-50'),
      'ui-sm': fontSizeToken('font-size-75'),
      ui: fontSizeToken('font-size-100'),
      'ui-lg': fontSizeToken('font-size-200'),
      'ui-xl': fontSizeToken('font-size-300'),
      'ui-2xl': fontSizeToken('font-size-400'),
      'ui-3xl': fontSizeToken('font-size-500'),

      control: {
        default: fontSizeToken('font-size-100'),
        size: {
          XS: fontSizeToken('font-size-50'),
          S: fontSizeToken('font-size-75'),
          L: fontSizeToken('font-size-200'),
          XL: fontSizeToken('font-size-300')
        }
      },

      'heading-xs': fontSizeToken('heading-size-xs'),
      'heading-sm': fontSizeToken('heading-size-s'),
      heading: fontSizeToken('heading-size-m'),
      'heading-lg': fontSizeToken('heading-size-l'),
      'heading-xl': fontSizeToken('heading-size-xl'),
      'heading-2xl': fontSizeToken('heading-size-xxl'),
      'heading-3xl': fontSizeToken('heading-size-xxxl'),

      // Body is for large blocks of text, e.g. paragraphs, not in UI components.
      'body-xs': fontSizeToken('body-size-xs'),
      'body-sm': fontSizeToken('body-size-s'),
      body: fontSizeToken('body-size-m'),
      'body-lg': fontSizeToken('body-size-l'),
      'body-xl': fontSizeToken('body-size-xl'),
      'body-2xl': fontSizeToken('body-size-xxl'),
      'body-3xl': fontSizeToken('body-size-xxxl'),

      'detail-sm': fontSizeToken('detail-size-s'),
      detail: fontSizeToken('detail-size-m'),
      'detail-lg': fontSizeToken('detail-size-l'),
      'detail-xl': fontSizeToken('detail-size-xl'),

      'code-xs': fontSizeToken('code-size-xs'),
      'code-sm': fontSizeToken('code-size-s'),
      code: fontSizeToken('code-size-m'),
      'code-lg': fontSizeToken('code-size-l'),
      'code-xl': fontSizeToken('code-size-xl')
    },
    fontWeight: {
      ...fontWeightBase,
      heading: {
        default: fontWeightBase[getToken('heading-sans-serif-font-weight') as keyof typeof fontWeightBase],
        ':lang(ja, ko, zh, zh-Hant, zh-Hans)': fontWeightBase[getToken('heading-cjk-font-weight') as keyof typeof fontWeightBase]
      },
      detail: {
        default: fontWeightBase[getToken('detail-sans-serif-font-weight') as keyof typeof fontWeightBase],
        ':lang(ja, ko, zh, zh-Hant, zh-Hans)': fontWeightBase[getToken('detail-cjk-font-weight') as keyof typeof fontWeightBase]
      }
    },
    lineHeight: {
      // See https://spectrum.corp.adobe.com/page/typography/#Line-height
      ui: {
        default: getToken('line-height-100'),
        ':lang(ja, ko, zh, zh-Hant, zh-Hans)': getToken('line-height-200')
      },
      heading: {
        default: getToken('heading-line-height'),
        ':lang(ja, ko, zh, zh-Hant, zh-Hans)': getToken('heading-cjk-line-height')
      },
      body: {
        default: getToken('body-line-height'),
        ':lang(ja, ko, zh, zh-Hant, zh-Hans)': getToken('body-cjk-line-height')
      },
      detail: {
        default: getToken('detail-line-height'),
        ':lang(ja, ko, zh, zh-Hant, zh-Hans)': getToken('detail-cjk-line-height')
      },
      code: {
        default: getToken('code-line-height'),
        ':lang(ja, ko, zh, zh-Hant, zh-Hans)': getToken('code-cjk-line-height')
      }
    },
    listStyleType: ['none', 'dist', 'decimal'] as const,
    listStylePosition: ['inside', 'outside'] as const,
    textTransform: ['uppercase', 'lowercase', 'capitalize', 'none'] as const,
    textAlign: ['start', 'center', 'end', 'justify'] as const,
    verticalAlign: ['baseline', 'top', 'middle', 'bottom', 'text-top', 'text-bottom', 'sub', 'super'] as const,
    textDecoration: createMappedProperty((value) => ({
      textDecoration: value === 'none' ? 'none' : `${value} ${getToken('text-underline-thickness')}`,
      textUnderlineOffset: value === 'underline' ? getToken('text-underline-gap') : undefined
    }), ['underline', 'overline', 'line-through', 'none'] as const),
    textOverflow: ['ellipsis', 'clip'] as const,
    lineClamp: createArbitraryProperty((value: number) => ({
      overflow: 'hidden',
      display: '-webkit-box',
      '-webkit-box-orient': 'vertical',
      '-webkit-line-clamp': value
    })),
    hyphens: ['none', 'manual', 'auto'] as const,
    whiteSpace: ['normal', 'nowrap', 'pre', 'pre-line', 'pre-wrap', 'break-spaces'] as const,
    textWrap: ['wrap', 'nowrap', 'balance', 'pretty'] as const,
    wordBreak: ['normal', 'break-all', 'keep-all'] as const, // also overflowWrap??
    boxDecorationBreak: ['slice', 'clone'] as const,

    // effects
    boxShadow: {
      emphasized: `${getToken('drop-shadow-emphasized-default-x')} ${getToken('drop-shadow-emphasized-default-y')} ${getToken('drop-shadow-emphasized-default-blur')} ${colorToken('drop-shadow-emphasized-default-color')}`,
      elevated: `${getToken('drop-shadow-elevated-x')} ${getToken('drop-shadow-elevated-y')} ${getToken('drop-shadow-elevated-blur')} ${colorToken('drop-shadow-elevated-color')}`,
      none: 'none'
    },
    filter: {
      emphasized: `drop-shadow(${getToken('drop-shadow-emphasized-default-x')} ${getToken('drop-shadow-emphasized-default-y')} ${getToken('drop-shadow-emphasized-default-blur')} ${colorToken('drop-shadow-emphasized-default-color')})`,
      elevated: `drop-shadow(${getToken('drop-shadow-elevated-x')} ${getToken('drop-shadow-elevated-y')} ${getToken('drop-shadow-elevated-blur')} ${colorToken('drop-shadow-elevated-color')})`,
      none: 'none'
    },
    borderTopStartRadius: createRenamedProperty('borderStartStartRadius', radius),
    borderTopEndRadius: createRenamedProperty('borderStartEndRadius', radius),
    borderBottomStartRadius: createRenamedProperty('borderEndStartRadius', radius),
    borderBottomEndRadius: createRenamedProperty('borderEndEndRadius', radius),
    forcedColorAdjust: ['auto', 'none'] as const,
    colorScheme: ['light', 'dark', 'light dark'] as const,
    backgroundImage: createArbitraryProperty<string>(),
    // TODO: do we need separate x and y properties?
    backgroundPosition: ['bottom', 'center', 'left', 'left bottom', 'left top', 'right', 'right bottom', 'right top', 'top'] as const,
    backgroundSize: ['auto', 'cover', 'contain'] as const,
    backgroundAttachment: ['fixed', 'local', 'scroll'] as const,
    backgroundClip: ['border-box', 'padding-box', 'content-box', 'text'] as const,
    backgroundRepeat: ['repeat', 'no-repeat', 'repeat-x', 'repeat-y', 'round', 'space'] as const,
    backgroundOrigin: ['border-box', 'padding-box', 'content-box'] as const,
    backgroundBlendMode: ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'] as const,
    mixBlendMode: ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity', 'plus-darker', 'plus-lighter'] as const,
    opacity: createArbitraryProperty<number>(),

    outlineStyle: ['none', 'solid', 'dashed', 'dotted', 'double', 'inset'] as const,
    outlineOffset: createArbitraryProperty<number>((v, property) => ({[property]: `${v}px`})),
    outlineWidth: borderWidth,

    transition: createRenamedProperty('transitionProperty', transitionProperty),
    transitionDelay: durationProperty,
    transitionDuration: durationProperty,
    transitionTimingFunction: timingFunction,
    animation: createArbitraryProperty((value: string, property) => ({[property === 'animation' ? 'animationName' : property]: value})),
    animationDuration: durationProperty,
    animationDelay: durationProperty,
    animationDirection: ['normal', 'reverse', 'alternate', 'alternate-reverse'] as const,
    animationFillMode: ['none', 'forwards', 'backwards', 'both'] as const,
    animationIterationCount: createArbitraryProperty<string>(),
    animationTimingFunction: timingFunction,

    // layout
    display: ['block', 'inline-block', 'inline', 'flex', 'inline-flex', 'grid', 'inline-grid', 'contents', 'list-item', 'none'] as const, // tables?
    alignContent: ['normal', 'center', 'start', 'end', 'space-between', 'space-around', 'space-evenly', 'baseline', 'stretch'] as const,
    alignItems: ['start', 'end', 'center', 'baseline', 'stretch'] as const,
    justifyContent: ['normal', 'start', 'end', 'center', 'space-between', 'space-around', 'space-evenly', 'stretch'] as const,
    justifyItems: ['start', 'end', 'center', 'stretch'] as const,
    alignSelf: ['auto', 'start', 'end', 'center', 'stretch', 'baseline'] as const,
    justifySelf: ['auto', 'start', 'end', 'center', 'stretch'] as const,
    flexDirection: ['row', 'column', 'row-reverse', 'column-reverse'] as const,
    flexWrap: ['wrap', 'wrap-reverse', 'nowrap'] as const,
    flexShrink: createArbitraryProperty<CSS.Property.FlexShrink>(),
    flexGrow: createArbitraryProperty<CSS.Property.FlexGrow>(),
    gridColumnStart: createArbitraryProperty<CSS.Property.GridColumnStart>(),
    gridColumnEnd: createArbitraryProperty<CSS.Property.GridColumnEnd>(),
    gridRowStart: createArbitraryProperty<CSS.Property.GridRowStart>(),
    gridRowEnd: createArbitraryProperty<CSS.Property.GridRowEnd>(),
    gridAutoFlow: ['row', 'column', 'dense', 'row dense', 'column dense'] as const,
    gridAutoRows: createArbitraryProperty((value: GridTrackSize, property) => ({[property]: gridTrackSize(value)})),
    gridAutoColumns: createArbitraryProperty((value: GridTrackSize, property) => ({[property]: gridTrackSize(value)})),
    gridTemplateColumns: createArbitraryProperty((value: GridTrack, property) => ({[property]: gridTrack(value)})),
    gridTemplateRows: createArbitraryProperty((value: GridTrack, property) => ({[property]: gridTrack(value)})),
    gridTemplateAreas: createArbitraryProperty((value: readonly string[], property) => ({[property]: value.map(v => `"${v}"`).join('')})),
    float: ['inline-start', 'inline-end', 'right', 'left', 'none'] as const,
    clear: ['inline-start', 'inline-end', 'left', 'right', 'both', 'none'] as const,
    contain: ['none', 'strict', 'content', 'size', 'inline-size', 'layout', 'style', 'paint'] as const,
    boxSizing: ['border-box', 'content-box'] as const,
    tableLayout: ['auto', 'fixed'] as const,
    captionSide: ['top', 'bottom'] as const,
    borderCollapse: ['collapse', 'separate'] as const,
    columns: {
      auto: 'auto',
      1: '1',
      2: '2',
      3: '3',
      4: '4',
      5: '5',
      6: '6',
      7: '7',
      8: '8',
      9: '9',
      10: '10',
      11: '11',
      12: '12',
      // TODO: what should these sizes be?
      '3xs': '16rem',
      '2xs': '18rem',
      xs: '20rem',
      sm: '24rem',
      md: '28rem',
      lg: '32rem',
      xl: '36rem',
      '2xl': '42rem',
      '3xl': '48rem',
      '4xl': '56rem',
      '5xl': '64rem',
      '6xl': '72rem',
      '7xl': '80rem'
    },
    breakBefore: ['auto', 'avoid', 'all', 'avoid-page', 'page', 'left', 'right', 'column'] as const,
    breakInside: ['auto', 'avoid', 'avoid-page', 'avoid-column'] as const,
    breakAfter: ['auto', 'avoid', 'all', 'avoid-page', 'page', 'left', 'right', 'column'] as const,
    overflowX: ['auto', 'hidden', 'clip', 'visible', 'scroll'] as const,
    overflowY: ['auto', 'hidden', 'clip', 'visible', 'scroll'] as const,
    overscrollBehaviorX: ['auto', 'contain', 'none'] as const,
    overscrollBehaviorY: ['auto', 'contain', 'none'] as const,
    scrollBehavior: ['auto', 'smooth'] as const,
    order: createArbitraryProperty<number>(),

    pointerEvents: ['none', 'auto'] as const,
    touchAction: ['auto', 'none', 'pan-x', 'pan-y', 'manipulation', 'pinch-zoom'] as const,
    userSelect: ['none', 'text', 'all', 'auto'] as const,
    visibility: ['visible', 'hidden', 'collapse'] as const,
    isolation: ['isolate', 'auto'] as const,
    transformOrigin: ['center', 'top', 'top right', 'right', 'bottom right', 'bottom', 'bottom left', 'left', 'top right'] as const,
    cursor: ['auto', 'default', 'pointer', 'wait', 'text', 'move', 'help', 'not-allowed', 'none', 'context-menu', 'progress', 'cell', 'crosshair', 'vertical-text', 'alias', 'copy', 'no-drop', 'grab', 'grabbing', 'all-scroll', 'col-resize', 'row-resize', 'n-resize', 'e-resize', 's-resize', 'w-resize', 'ne-resize', 'nw-resize', 'se-resize', 'ew-resize', 'ns-resize', 'nesw-resize', 'nwse-resize', 'zoom-in', 'zoom-out'] as const,
    resize: ['none', 'vertical', 'horizontal', 'both'] as const,
    scrollSnapType: ['x', 'y', 'both', 'x mandatory', 'y mandatory', 'both mandatory'] as const,
    scrollSnapAlign: ['start', 'end', 'center', 'none'] as const,
    scrollSnapStop: ['normal', 'always'] as const,
    appearance: ['none', 'auto'] as const,
    objectFit: ['contain', 'cover', 'fill', 'none', 'scale-down'] as const,
    objectPosition: ['bottom', 'center', 'left', 'left bottom', 'left top', 'right', 'right bottom', 'right top', 'top'] as const,
    willChange: ['auto', 'scroll-position', 'contents', 'transform'] as const,
    zIndex: createArbitraryProperty<number>(),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    disableTapHighlight: createArbitraryProperty((_value: true) => ({
      '-webkit-tap-highlight-color': 'rgba(0,0,0,0)'
    }))
  },
  shorthands: {
    padding: ['paddingTop', 'paddingBottom', 'paddingStart', 'paddingEnd'] as const,
    paddingX: ['paddingStart', 'paddingEnd'] as const,
    paddingY: ['paddingTop', 'paddingBottom'] as const,
    margin: ['marginTop', 'marginBottom', 'marginStart', 'marginEnd'] as const,
    marginX: ['marginStart', 'marginEnd'] as const,
    marginY: ['marginTop', 'marginBottom'] as const,
    scrollPadding: ['scrollPaddingTop', 'scrollPaddingBottom', 'scrollPaddingStart', 'scrollPaddingEnd'] as const,
    scrollPaddingX: ['scrollPaddingStart', 'scrollPaddingEnd'] as const,
    scrollPaddingY: ['scrollPaddingTop', 'scrollPaddingBottom'] as const,
    scrollMargin: ['scrollMarginTop', 'scrollMarginBottom', 'scrollMarginStart', 'scrollMarginEnd'] as const,
    scrollMarginX: ['scrollMarginStart', 'scrollMarginEnd'] as const,
    scrollMarginY: ['scrollMarginTop', 'scrollMarginBottom'] as const,
    borderWidth: ['borderTopWidth', 'borderBottomWidth', 'borderStartWidth', 'borderEndWidth'] as const,
    borderXWidth: ['borderStartWidth', 'borderEndWidth'] as const,
    borderYWidth: ['borderTopWidth', 'borderBottomWidth'] as const,
    borderRadius: ['borderTopStartRadius', 'borderTopEndRadius', 'borderBottomStartRadius', 'borderBottomEndRadius'] as const,
    borderTopRadius: ['borderTopStartRadius', 'borderTopEndRadius'] as const,
    borderBottomRadius: ['borderBottomStartRadius', 'borderBottomEndRadius'] as const,
    borderStartRadius: ['borderTopStartRadius', 'borderBottomStartRadius'] as const,
    borderEndRadius: ['borderTopEndRadius', 'borderBottomEndRadius'] as const,
    translate: ['translateX', 'translateY'] as const,
    inset: ['top', 'bottom', 'insetStart', 'insetEnd'] as const,
    insetX: ['insetStart', 'insetEnd'] as const,
    insetY: ['top', 'bottom'] as const,
    placeItems: ['alignItems', 'justifyItems'] as const,
    placeContent: ['alignContent', 'justifyContent'] as const,
    placeSelf: ['alignSelf', 'justifySelf'] as const,
    gap: ['rowGap', 'columnGap'] as const,
    size: ['width', 'height'] as const,
    minSize: ['minWidth', 'minHeight'] as const,
    maxSize: ['maxWidth', 'maxHeight'] as const,
    overflow: ['overflowX', 'overflowY'] as const,
    overscrollBehavior: ['overscrollBehaviorX', 'overscrollBehaviorY'] as const,
    gridArea: ['gridColumnStart', 'gridColumnEnd', 'gridRowStart', 'gridRowEnd'] as const,
    transition: (value: keyof typeof transitionProperty) => ({
      transition: value,
      transitionDuration: 150,
      transitionTimingFunction: 'default'
    }),
    animation: (value: string) => ({
      animation: value,
      animationDuration: 150,
      animationTimingFunction: 'default'
    }),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    truncate: (_value: true) => ({
      overflowX: 'hidden',
      overflowY: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    })
  },
  conditions: {
    forcedColors: '@media (forced-colors: active)',
    // This detects touch primary devices as best as we can.
    // Ideally we'd use (pointer: course) but browser/device support is inconsistent.
    // Samsung Android devices claim to be mice at the hardware/OS level: (any-pointer: fine), (any-hover: hover), (hover: hover), and nothing for pointer.
    // More details: https://www.ctrl.blog/entry/css-media-hover-samsung.html
    // iPhone matches (any-hover: none), (hover: none), and nothing for any-pointer or pointer.
    // If a trackpad or Apple Pencil is connected to iPad, it matches (any-pointer: fine), (any-hover: hover), (hover: none).
    // Windows tablet matches the same as iPhone. No difference when a mouse is connected.
    // Windows touch laptop matches same as macOS: (any-pointer: fine), (pointer: fine), (any-hover: hover), (hover: hover).
    touch: '@media not ((hover: hover) and (pointer: fine))',
    // TODO
    sm: '@media (min-width: 640px)',
    md: '@media (min-width: 768px)',
    lg: '@media (min-width: 1024px)',
    xl: '@media (min-width: 1280px)',
    '2xl': '@media (min-width: 1536px)'
  }
});
