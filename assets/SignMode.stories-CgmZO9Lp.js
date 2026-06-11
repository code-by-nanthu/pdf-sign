import{j as a}from"./jsx-runtime-vEe4j92i.js";import{P as s}from"./index-B6-UWXeJ.js";import{a as c,S as g}from"./sample-template-DWoUf0RA.js";import{T as p}from"./theme-presets-BdkLTc_y.js";import"./_commonjsHelpers-Cpj98o6Y.js";import"./index-CfeY6cwv.js";import"./iframe-C_0_Bbgo.js";const D={title:"React / PdfSigner / Sign mode",component:s,tags:["autodocs"],parameters:{layout:"fullscreen"}},n={name:"Signer Alice",args:{pdf:g,mode:"sign",template:{...c,pdfHash:"a".repeat(64)},signerId:"signer-alice",onSigningComplete:e=>console.log("signing-complete",e.finalPdfHash),onDeclined:e=>console.log("declined",e)},render:e=>a.jsx("div",{style:{height:"100vh",display:"flex",flexDirection:"column"},children:a.jsx(s,{...e})})},r={name:"Dark theme",parameters:{backgrounds:{default:"dark"}},args:{pdf:g,mode:"sign",template:{...c,pdfHash:"a".repeat(64)},signerId:"signer-alice",theme:p.Dark},render:e=>a.jsx("div",{style:{height:"100vh",display:"flex",flexDirection:"column"},children:a.jsx(s,{...e})})};var i,o,t;n.parameters={...n.parameters,docs:{...(i=n.parameters)==null?void 0:i.docs,source:{originalSource:`{
  name: 'Signer Alice',
  args: {
    pdf: SAMPLE_PDF_URL,
    mode: 'sign',
    template: {
      ...SAMPLE_TEMPLATE,
      pdfHash: 'a'.repeat(64)
    },
    signerId: 'signer-alice',
    onSigningComplete: r => console.log('signing-complete', r.finalPdfHash),
    onDeclined: p => console.log('declined', p)
  },
  render: args => <div style={{
    height: '100vh',
    display: 'flex',
    flexDirection: 'column'
  }}>
      <PdfSigner {...args} />
    </div>
}`,...(t=(o=n.parameters)==null?void 0:o.docs)==null?void 0:t.source}}};var d,l,m;r.parameters={...r.parameters,docs:{...(d=r.parameters)==null?void 0:d.docs,source:{originalSource:`{
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
  render: args => <div style={{
    height: '100vh',
    display: 'flex',
    flexDirection: 'column'
  }}>
      <PdfSigner {...args} />
    </div>
}`,...(m=(l=r.parameters)==null?void 0:l.docs)==null?void 0:m.source}}};const A=["SignerAlice","DarkTheme"];export{r as DarkTheme,n as SignerAlice,A as __namedExportsOrder,D as default};
