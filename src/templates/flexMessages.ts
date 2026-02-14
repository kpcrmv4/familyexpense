import { ThemeColors } from '../types';
import { DEFAULT_THEME } from '../utils/themeColors';

// Use plain objects to avoid LINE SDK type conflicts between legacy and messaging-api types.
// The JSON structure is identical - only TS types differ.

export function createFlexMessage(altText: string, contents: any): any {
  return { type: 'flex', altText, contents };
}

export function createBubble(params: {
  header?: any;
  hero?: any;
  body: any;
  footer?: any;
  theme?: ThemeColors;
}): any {
  const t = params.theme || DEFAULT_THEME;
  return {
    type: 'bubble',
    size: 'mega',
    styles: {
      header: { backgroundColor: t.primary },
      body: { backgroundColor: '#FFFFFF' },
      footer: { backgroundColor: '#FFFFFF' },
    },
    ...(params.header && { header: params.header }),
    ...(params.hero && { hero: params.hero }),
    body: params.body,
    ...(params.footer && { footer: params.footer }),
  };
}

export function createHeader(title: string, subtitle?: string, emoji?: string): any {
  const contents: any[] = [];

  if (emoji) {
    contents.push({
      type: 'text',
      text: emoji,
      size: 'xxl',
      align: 'center',
    });
  }

  contents.push({
    type: 'text',
    text: title,
    weight: 'bold',
    size: 'lg',
    color: '#FFFFFF',
    align: 'center',
  });

  if (subtitle) {
    contents.push({
      type: 'text',
      text: subtitle,
      size: 'xs',
      color: '#FFFFFFCC',
      align: 'center',
    });
  }

  return {
    type: 'box',
    layout: 'vertical',
    contents,
    paddingAll: 'lg',
    spacing: 'sm',
  };
}

export function createButton(
  label: string,
  data: string,
  style: 'primary' | 'secondary' | 'link' = 'primary',
  color?: string
): any {
  return {
    type: 'button',
    action: {
      type: 'postback',
      label,
      data,
      displayText: label,
    },
    style,
    color: style === 'primary' ? (color || '#9BA4D6') : undefined,
    height: 'sm',
    margin: 'sm',
  };
}

export function createTextRow(label: string, value: string, valueColor?: string): any {
  return {
    type: 'box',
    layout: 'horizontal',
    contents: [
      {
        type: 'text',
        text: label,
        size: 'sm',
        color: '#718096',
        flex: 0,
      },
      {
        type: 'text',
        text: value,
        size: 'sm',
        color: valueColor || '#2D3748',
        align: 'end',
        weight: 'bold',
      },
    ],
  };
}

export function createSeparator(): any {
  return { type: 'separator', margin: 'lg', color: '#E8ECF0' };
}

export function createSpacer(size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md'): any {
  return { type: 'box', layout: 'vertical', contents: [], height: size === 'xs' ? '4px' : size === 'sm' ? '8px' : size === 'md' ? '12px' : size === 'lg' ? '16px' : '24px' };
}
