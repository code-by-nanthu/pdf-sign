import{N as r}from"./index-DzfSP-mB.js";import{S as o}from"./sample-template-DWoUf0RA.js";import{T as i}from"./theme-presets-BdkLTc_y.js";import"./index-CfeY6cwv.js";import"./iframe-C_0_Bbgo.js";import"./vue.esm-bundler-CYLJ5xUf.js";const T={title:"Vue / PdfSigner / Prepare mode",component:r,tags:["autodocs"],parameters:{layout:"fullscreen",docs:{description:{component:"Prepare mode: the preparer drags field types from the palette onto the document, assigns them to signers, and saves a JSON template that can be used later in sign mode."}}},argTypes:{snapGrid:{control:{type:"range",min:0,max:40,step:5}},includeAuditPage:{control:"boolean"},theme:{control:"select",options:Object.keys(i),mapping:i}}},t={name:"Default (indigo)",args:{pdf:o,mode:"prepare",snapGrid:0,includeAuditPage:!0},render:e=>({components:{PdfSigner:r},setup:()=>({args:e}),template:`
      <div style="height: 100vh; display: flex; flex-direction: column;">
        <PdfSigner
          v-bind="args"
          @template-ready="(t) => console.log('template-ready', t)"
          @fields-changed="(f) => console.log('fields-changed', f.length, 'fields')"
          @error="(e) => console.error('error', e)"
        />
      </div>
    `})},a={name:"Snap-to-grid (10px)",args:{pdf:o,mode:"prepare",snapGrid:10},render:e=>({components:{PdfSigner:r},setup:()=>({args:e}),template:`
      <div style="height: 100vh; display: flex; flex-direction: column;">
        <PdfSigner v-bind="args" />
      </div>
    `})},s={name:"Multiple signers",args:{pdf:o,mode:"prepare",signers:[{id:"alice",name:"Alice Johnson",order:1,color:"#6366f1"},{id:"bob",name:"Bob Smith",order:2,color:"#0ea5e9"},{id:"carol",name:"Carol White",order:3,color:"#10b981"}]},render:e=>({components:{PdfSigner:r},setup:()=>({args:e}),template:`
      <div style="height: 100vh; display: flex; flex-direction: column;">
        <PdfSigner v-bind="args" />
      </div>
    `})},d={name:"Custom theme (red brand)",args:{pdf:o,mode:"prepare",theme:i.Red},render:e=>({components:{PdfSigner:r},setup:()=>({args:e}),template:`
      <div style="height: 100vh; display: flex; flex-direction: column;">
        <PdfSigner v-bind="args" />
      </div>
    `})},n={name:"Extra toolbar slot",args:{pdf:o,mode:"prepare"},render:e=>({components:{PdfSigner:r},setup:()=>({args:e}),template:`
      <div style="height: 100vh; display: flex; flex-direction: column;">
        <PdfSigner v-bind="args">
          <template #toolbar-extra>
            <button
              style="
                font-size: 11px;
                padding: 2px 10px;
                border-radius: 4px;
                border: 1px solid var(--psign-border);
                background: var(--psign-surface);
                color: var(--psign-text);
                cursor: pointer;
              "
            >
              My action
            </button>
          </template>
        </PdfSigner>
      </div>
    `})};var p,l,m;t.parameters={...t.parameters,docs:{...(p=t.parameters)==null?void 0:p.docs,source:{originalSource:`{
  name: 'Default (indigo)',
  args: {
    pdf: SAMPLE_PDF_URL,
    mode: 'prepare',
    snapGrid: 0,
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
          @template-ready="(t) => console.log('template-ready', t)"
          @fields-changed="(f) => console.log('fields-changed', f.length, 'fields')"
          @error="(e) => console.error('error', e)"
        />
      </div>
    \`
  })
}`,...(m=(l=t.parameters)==null?void 0:l.docs)==null?void 0:m.source}}};var c,g,f;a.parameters={...a.parameters,docs:{...(c=a.parameters)==null?void 0:c.docs,source:{originalSource:`{
  name: 'Snap-to-grid (10px)',
  args: {
    pdf: SAMPLE_PDF_URL,
    mode: 'prepare',
    snapGrid: 10
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
}`,...(f=(g=a.parameters)==null?void 0:g.docs)==null?void 0:f.source}}};var u,h,S;s.parameters={...s.parameters,docs:{...(u=s.parameters)==null?void 0:u.docs,source:{originalSource:`{
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
    }, {
      id: 'carol',
      name: 'Carol White',
      order: 3,
      color: '#10b981'
    }]
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
}`,...(S=(h=s.parameters)==null?void 0:h.docs)==null?void 0:S.source}}};var v,x,P;d.parameters={...d.parameters,docs:{...(v=d.parameters)==null?void 0:v.docs,source:{originalSource:`{
  name: 'Custom theme (red brand)',
  args: {
    pdf: SAMPLE_PDF_URL,
    mode: 'prepare',
    theme: THEME_PRESETS.Red
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
}`,...(P=(x=d.parameters)==null?void 0:x.docs)==null?void 0:P.source}}};var b,y,E;n.parameters={...n.parameters,docs:{...(b=n.parameters)==null?void 0:b.docs,source:{originalSource:`{
  name: 'Extra toolbar slot',
  args: {
    pdf: SAMPLE_PDF_URL,
    mode: 'prepare'
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
        <PdfSigner v-bind="args">
          <template #toolbar-extra>
            <button
              style="
                font-size: 11px;
                padding: 2px 10px;
                border-radius: 4px;
                border: 1px solid var(--psign-border);
                background: var(--psign-surface);
                color: var(--psign-text);
                cursor: pointer;
              "
            >
              My action
            </button>
          </template>
        </PdfSigner>
      </div>
    \`
  })
}`,...(E=(y=n.parameters)==null?void 0:y.docs)==null?void 0:E.source}}};const G=["Default","WithSnapGrid","MultipleSigners","CustomTheme","ExtraToolbarSlot"];export{d as CustomTheme,t as Default,n as ExtraToolbarSlot,s as MultipleSigners,a as WithSnapGrid,G as __namedExportsOrder,T as default};
