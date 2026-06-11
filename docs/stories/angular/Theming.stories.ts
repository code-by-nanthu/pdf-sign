import type { Meta, StoryObj } from '@storybook/angular'
import { moduleMetadata } from '@storybook/angular'
import { Component } from '@angular/core'
import { NgFor, CommonModule } from '@angular/common'
import { PdfSignerComponent } from '@pdf-sign/angular'
import { THEME_PRESETS } from '../shared/theme-presets.js'

@Component({
  selector: 'theming-demo',
  standalone: true,
  imports: [PdfSignerComponent, NgFor, CommonModule],
  template: `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 16px; height: 100vh; box-sizing: border-box;">
      <div *ngFor="let preset of presets" style="display: flex; flex-direction: column; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="padding: 8px 12px; background: #f8fafc; font-size: 11px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">
          Theme: {{ preset.name }}
        </div>
        <div style="flex: 1; min-height: 0;">
          <pdf-signer mode="prepare" [pdf]="null" [theme]="preset.theme" />
        </div>
      </div>
    </div>
  `,
})
class ThemingDemoComponent {
  presets = Object.entries(THEME_PRESETS).map(([name, theme]) => ({ name, theme }))
}

const meta: Meta<ThemingDemoComponent> = {
  title: 'Angular / Theming / All presets',
  component: ThemingDemoComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({ imports: [ThemingDemoComponent] }),
  ],
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<ThemingDemoComponent>

export const AllPresets: Story = { name: 'All theme presets' }
