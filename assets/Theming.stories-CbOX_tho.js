import{d as m}from"./vue.esm-bundler-CYLJ5xUf.js";import{N as p}from"./index-DzfSP-mB.js";import{T as a}from"./theme-presets-BdkLTc_y.js";import"./index-CfeY6cwv.js";import"./iframe-C_0_Bbgo.js";const l=m({name:"ThemingDemo",components:{PdfSigner:p},setup(){return{THEME_PRESETS:a}},template:`
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 16px; height: 100vh; box-sizing: border-box;">
      <div v-for="(theme, name) in THEME_PRESETS" :key="name" style="display: flex; flex-direction: column; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="padding: 8px 12px; background: #f8fafc; font-size: 11px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">
          Theme: {{ name }}
        </div>
        <div style="flex: 1; min-height: 0;">
          <PdfSigner
            mode="prepare"
            :pdf="null"
            :theme="theme"
            style="height: 100%"
          />
        </div>
      </div>
    </div>
  `}),y={title:"Vue / Theming / All presets",component:l,tags:["autodocs"],parameters:{layout:"fullscreen",docs:{description:{component:"All four built-in theme presets shown side by side. Override any token via the theme prop or by setting CSS custom properties on .pdf-sign-root."}}}},e={name:"All theme presets"},r={name:"CSS var override (global)",render:()=>({components:{PdfSigner:p},template:`
      <div style="height: 100vh; display: flex; flex-direction: column;">
        <style>
          .my-custom-theme {
            --psign-primary: #7c3aed;
            --psign-primary-fg: #ffffff;
            --psign-primary-hover: #6d28d9;
            --psign-radius: 2px;
            --psign-radius-sm: 1px;
            --psign-radius-lg: 4px;
          }
        </style>
        <div class="my-custom-theme" style="flex: 1; display: flex; flex-direction: column;">
          <PdfSigner mode="prepare" :pdf="null" />
        </div>
      </div>
    `})};var n,i,s;e.parameters={...e.parameters,docs:{...(n=e.parameters)==null?void 0:n.docs,source:{originalSource:`{
  name: 'All theme presets'
}`,...(s=(i=e.parameters)==null?void 0:i.docs)==null?void 0:s.source}}};var t,o,d;r.parameters={...r.parameters,docs:{...(t=r.parameters)==null?void 0:t.docs,source:{originalSource:`{
  name: 'CSS var override (global)',
  render: () => ({
    components: {
      PdfSigner
    },
    template: \`
      <div style="height: 100vh; display: flex; flex-direction: column;">
        <style>
          .my-custom-theme {
            --psign-primary: #7c3aed;
            --psign-primary-fg: #ffffff;
            --psign-primary-hover: #6d28d9;
            --psign-radius: 2px;
            --psign-radius-sm: 1px;
            --psign-radius-lg: 4px;
          }
        </style>
        <div class="my-custom-theme" style="flex: 1; display: flex; flex-direction: column;">
          <PdfSigner mode="prepare" :pdf="null" />
        </div>
      </div>
    \`
  })
}`,...(d=(o=r.parameters)==null?void 0:o.docs)==null?void 0:d.source}}};const v=["AllPresets","CSSVarOverride"];export{e as AllPresets,r as CSSVarOverride,v as __namedExportsOrder,y as default};
