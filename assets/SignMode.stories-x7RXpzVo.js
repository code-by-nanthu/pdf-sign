import{N as i}from"./index-DzfSP-mB.js";import{a,S as t}from"./sample-template-DWoUf0RA.js";import{T as u}from"./theme-presets-BdkLTc_y.js";import"./index-CfeY6cwv.js";import"./iframe-C_0_Bbgo.js";import"./vue.esm-bundler-CYLJ5xUf.js";const L={title:"Vue / PdfSigner / Sign mode",component:i,tags:["autodocs"],parameters:{layout:"fullscreen",docs:{description:{component:"Sign mode: the signer is presented with a read-only document showing only their assigned fields. The component guides them through completion and emits a signing-complete event with the flattened PDF."}}}},r={name:"Signer Alice (first signer)",args:{pdf:t,mode:"sign",template:{...a,pdfHash:"a".repeat(64)},signerId:"signer-alice",includeAuditPage:!0},render:e=>({components:{PdfSigner:i},setup:()=>({args:e}),template:`
      <div style="height: 100vh; display: flex; flex-direction: column;">
        <PdfSigner
          v-bind="args"
          @signing-complete="(r) => console.log('signing-complete', r.finalPdfHash)"
          @declined="(p) => console.log('declined', p)"
          @error="(e) => console.error('error', e)"
        />
      </div>
    `})},n={name:"Signer Bob (second signer)",args:{pdf:t,mode:"sign",template:{...a,pdfHash:"a".repeat(64)},signerId:"signer-bob"},render:e=>({components:{PdfSigner:i},setup:()=>({args:e}),template:`
      <div style="height: 100vh; display: flex; flex-direction: column;">
        <PdfSigner v-bind="args" />
      </div>
    `})},s={name:"Dark theme",parameters:{backgrounds:{default:"dark"}},args:{pdf:t,mode:"sign",template:{...a,pdfHash:"a".repeat(64)},signerId:"signer-alice",theme:u.Dark},render:e=>({components:{PdfSigner:i},setup:()=>({args:e}),template:`
      <div style="height: 100vh; display: flex; flex-direction: column;">
        <PdfSigner v-bind="args" />
      </div>
    `})};var o,d,g;r.parameters={...r.parameters,docs:{...(o=r.parameters)==null?void 0:o.docs,source:{originalSource:`{
  name: 'Signer Alice (first signer)',
  args: {
    pdf: SAMPLE_PDF_URL,
    mode: 'sign',
    template: {
      ...SAMPLE_TEMPLATE,
      pdfHash: 'a'.repeat(64)
    },
    signerId: 'signer-alice',
    includeAuditPage: true
  },
  render: args => ({
    components: {
      PdfSigner
    },
    setup: () => ({
      args
    }),
    template: \`
      <div style="height: 100vh; display: flex; flex-direction: column;">
        <PdfSigner
          v-bind="args"
          @signing-complete="(r) => console.log('signing-complete', r.finalPdfHash)"
          @declined="(p) => console.log('declined', p)"
          @error="(e) => console.error('error', e)"
        />
      </div>
    \`
  })
}`,...(g=(d=r.parameters)==null?void 0:d.docs)==null?void 0:g.source}}};var l,p,m;n.parameters={...n.parameters,docs:{...(l=n.parameters)==null?void 0:l.docs,source:{originalSource:`{
  name: 'Signer Bob (second signer)',
  args: {
    pdf: SAMPLE_PDF_URL,
    mode: 'sign',
    template: {
      ...SAMPLE_TEMPLATE,
      pdfHash: 'a'.repeat(64)
    },
    signerId: 'signer-bob'
  },
  render: args => ({
    components: {
      PdfSigner
    },
    setup: () => ({
      args
    }),
    template: \`
      <div style="height: 100vh; display: flex; flex-direction: column;">
        <PdfSigner v-bind="args" />
      </div>
    \`
  })
}`,...(m=(p=n.parameters)==null?void 0:p.docs)==null?void 0:m.source}}};var c,f,h;s.parameters={...s.parameters,docs:{...(c=s.parameters)==null?void 0:c.docs,source:{originalSource:`{
  name: 'Dark theme',
  parameters: {
    backgrounds: {
      default: 'dark'
    }
  },
  args: {
    pdf: SAMPLE_PDF_URL,
    mode: 'sign',
    template: {
      ...SAMPLE_TEMPLATE,
      pdfHash: 'a'.repeat(64)
    },
    signerId: 'signer-alice',
    theme: THEME_PRESETS.Dark
  },
  render: args => ({
    components: {
      PdfSigner
    },
    setup: () => ({
      args
    }),
    template: \`
      <div style="height: 100vh; display: flex; flex-direction: column;">
        <PdfSigner v-bind="args" />
      </div>
    \`
  })
}`,...(h=(f=s.parameters)==null?void 0:f.docs)==null?void 0:h.source}}};const T=["SignerAlice","SignerBob","DarkTheme"];export{s as DarkTheme,r as SignerAlice,n as SignerBob,T as __namedExportsOrder,L as default};
