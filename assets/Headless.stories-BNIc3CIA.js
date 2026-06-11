import{d as b,r as h}from"./vue.esm-bundler-CYLJ5xUf.js";import{i as y}from"./index-DzfSP-mB.js";import{S as v}from"./sample-template-DWoUf0RA.js";import"./index-CfeY6cwv.js";import"./iframe-C_0_Bbgo.js";const w=b({name:"HeadlessDemo",setup(){const{state:n,fields:s,pageCount:r,isLoading:l,isReady:p,load:f,addField:u,buildTemplate:c}=y({mode:"prepare",pdf:v}),t=h([]);async function m(){await f(1),t.value.unshift(`Loaded — ${r.value} page(s)`)}function g(){u({type:"text",rect:{x:50,y:700,width:200,height:30,page:0},signerId:null,label:`Field ${s.value.length+1}`,required:!1}),t.value.unshift(`Added field — total: ${s.value.length}`)}function x(){try{const e=c();t.value.unshift(`Template built — ${e.fields.length} field(s), hash: ${e.pdfHash.slice(0,8)}…`)}catch(e){t.value.unshift(`Error: ${e instanceof Error?e.message:String(e)}`)}}return{state:n,fields:s,isLoading:l,isReady:p,log:t,handleLoad:m,handleAddField:g,handleBuildTemplate:x}},template:`
    <div style="padding: 24px; font-family: system-ui, sans-serif; max-width: 600px;">
      <h2 style="margin-bottom: 16px; font-size: 16px; font-weight: 600;">
        usePdfSign — headless composable demo
      </h2>
      <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
        <button @click="handleLoad" :disabled="isLoading" style="padding: 6px 14px; border-radius: 6px; border: 1px solid #e2e8f0; cursor: pointer; font-size: 13px;">
          {{ isLoading ? 'Loading…' : 'Load PDF' }}
        </button>
        <button @click="handleAddField" :disabled="!isReady" style="padding: 6px 14px; border-radius: 6px; border: 1px solid #e2e8f0; cursor: pointer; font-size: 13px;">
          Add text field
        </button>
        <button @click="handleBuildTemplate" :disabled="!isReady" style="padding: 6px 14px; border-radius: 6px; background: #6366f1; color: white; border: none; cursor: pointer; font-size: 13px;">
          Build template
        </button>
      </div>
      <div style="margin-bottom: 12px; padding: 10px 14px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
        <span style="font-size: 12px; color: #64748b;">State: </span>
        <strong style="font-size: 12px;">{{ state }}</strong>
        <span style="font-size: 12px; color: #64748b; margin-left: 16px;">Fields: </span>
        <strong style="font-size: 12px;">{{ fields.length }}</strong>
      </div>
      <div style="font-size: 12px; color: #64748b; padding: 10px 14px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; max-height: 200px; overflow-y: auto;">
        <div v-if="log.length === 0" style="color: #94a3b8;">Events will appear here…</div>
        <div v-for="(entry, i) in log" :key="i" style="margin-bottom: 2px;">{{ entry }}</div>
      </div>
    </div>
  `}),F={title:"Vue / Headless / usePdfSign",component:w,tags:["autodocs"],parameters:{layout:"padded",docs:{description:{component:"The usePdfSign composable provides full access to the pdf-sign state machine without any UI opinions. Consumers wire it to their own components."}}}},o={name:"usePdfSign composable"};var d,i,a;o.parameters={...o.parameters,docs:{...(d=o.parameters)==null?void 0:d.docs,source:{originalSource:`{
  name: 'usePdfSign composable'
}`,...(a=(i=o.parameters)==null?void 0:i.docs)==null?void 0:a.source}}};const D=["Default"];export{o as Default,D as __namedExportsOrder,F as default};
