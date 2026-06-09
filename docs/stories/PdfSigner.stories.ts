import type { Meta, StoryObj } from '@storybook/vue3'
import { PdfSigner } from '@pdf-sign/vue'

const meta = {
  title: 'pdf-sign/PdfSigner',
  component: PdfSigner,
  tags: ['autodocs'],
  argTypes: {
    mode: { control: 'select', options: ['prepare', 'sign', 'readonly'] },
  },
} satisfies Meta<typeof PdfSigner>

export default meta
type Story = StoryObj<typeof meta>

export const PrepareModeEmpty: Story = {
  args: {
    mode: 'prepare',
    pdf: null,
  },
}
