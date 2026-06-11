import{j as r}from"./jsx-runtime-vEe4j92i.js";import{P as n}from"./index-B6-UWXeJ.js";import{S as d}from"./sample-template-DWoUf0RA.js";import{T as t}from"./theme-presets-BdkLTc_y.js";import"./_commonjsHelpers-Cpj98o6Y.js";import"./index-CfeY6cwv.js";import"./iframe-C_0_Bbgo.js";const A={title:"React / PdfSigner / Prepare mode",component:n,tags:["autodocs"],parameters:{layout:"fullscreen",docs:{description:{component:"React adapter — prepare mode. Feature parity with the Vue adapter."}}},argTypes:{snapGrid:{control:{type:"range",min:0,max:40,step:5}},includeAuditPage:{control:"boolean"},theme:{control:"select",options:Object.keys(t),mapping:t}}},o={name:"Default (indigo)",args:{pdf:d,mode:"prepare",snapGrid:0,includeAuditPage:!0,onTemplateReady:e=>console.log("template-ready",e),onFieldsChanged:e=>console.log("fields-changed",e.length),onError:e=>console.error("error",e)},render:e=>r.jsx("div",{style:{height:"100vh",display:"flex",flexDirection:"column"},children:r.jsx(n,{...e})})},a={name:"Snap-to-grid (10px)",args:{pdf:d,mode:"prepare",snapGrid:10},render:e=>r.jsx("div",{style:{height:"100vh",display:"flex",flexDirection:"column"},children:r.jsx(n,{...e})})},s={name:"Multiple signers",args:{pdf:d,mode:"prepare",signers:[{id:"alice",name:"Alice Johnson",order:1,color:"#6366f1"},{id:"bob",name:"Bob Smith",order:2,color:"#0ea5e9"}]},render:e=>r.jsx("div",{style:{height:"100vh",display:"flex",flexDirection:"column"},children:r.jsx(n,{...e})})},i={name:"Red theme",args:{pdf:d,mode:"prepare",theme:t.Red},render:e=>r.jsx("div",{style:{height:"100vh",display:"flex",flexDirection:"column"},children:r.jsx(n,{...e})})};var l,p,c;o.parameters={...o.parameters,docs:{...(l=o.parameters)==null?void 0:l.docs,source:{originalSource:`{
  name: 'Default (indigo)',
  args: {
    pdf: SAMPLE_PDF_URL,
    mode: 'prepare',
    snapGrid: 0,
    includeAuditPage: true,
    onTemplateReady: t => console.log('template-ready', t),
    onFieldsChanged: f => console.log('fields-changed', f.length),
    onError: e => console.error('error', e)
  },
  render: args => <div style={{
    height: '100vh',
    display: 'flex',
    flexDirection: 'column'
  }}>
      <PdfSigner {...args} />
    </div>
}`,...(c=(p=o.parameters)==null?void 0:p.docs)==null?void 0:c.source}}};var m,g,h;a.parameters={...a.parameters,docs:{...(m=a.parameters)==null?void 0:m.docs,source:{originalSource:`{
  name: 'Snap-to-grid (10px)',
  args: {
    pdf: SAMPLE_PDF_URL,
    mode: 'prepare',
    snapGrid: 10
  },
  render: args => <div style={{
    height: '100vh',
    display: 'flex',
    flexDirection: 'column'
  }}>
      <PdfSigner {...args} />
    </div>
}`,...(h=(g=a.parameters)==null?void 0:g.docs)==null?void 0:h.source}}};var f,u,x;s.parameters={...s.parameters,docs:{...(f=s.parameters)==null?void 0:f.docs,source:{originalSource:`{
  name: 'Multiple signers',
  args: {
    pdf: SAMPLE_PDF_URL,
    mode: 'prepare',
    signers: [{
      id: 'alice',
      name: 'Alice Johnson',
      order: 1,
      color: '#6366f1'
    }, {
      id: 'bob',
      name: 'Bob Smith',
      order: 2,
      color: '#0ea5e9'
    }]
  },
  render: args => <div style={{
    height: '100vh',
    display: 'flex',
    flexDirection: 'column'
  }}>
      <PdfSigner {...args} />
    </div>
}`,...(x=(u=s.parameters)==null?void 0:u.docs)==null?void 0:x.source}}};var S,y,P;i.parameters={...i.parameters,docs:{...(S=i.parameters)==null?void 0:S.docs,source:{originalSource:`{
  name: 'Red theme',
  args: {
    pdf: SAMPLE_PDF_URL,
    mode: 'prepare',
    theme: THEME_PRESETS.Red
  },
  render: args => <div style={{
    height: '100vh',
    display: 'flex',
    flexDirection: 'column'
  }}>
      <PdfSigner {...args} />
    </div>
}`,...(P=(y=i.parameters)==null?void 0:y.docs)==null?void 0:P.source}}};const L=["Default","WithSnapGrid","MultipleSigners","RedTheme"];export{o as Default,s as MultipleSigners,i as RedTheme,a as WithSnapGrid,L as __namedExportsOrder,A as default};
