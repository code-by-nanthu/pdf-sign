# @pdf-sign/angular

Angular 17+ PDF e-signature standalone components.

## Install

```bash
pnpm add @pdf-sign/angular @pdf-sign/tailwind-plugin pdfjs-dist pdf-lib
```

## Usage

```ts
// app.component.ts
import { PdfSignerComponent } from '@pdf-sign/angular'

@Component({
  standalone: true,
  imports: [PdfSignerComponent],
  template: `
    <pdf-signer
      [pdf]="myFile"
      mode="prepare"
      (templateReady)="onTemplate($event)"
      (error)="onError($event)"
    />
  `,
})
export class AppComponent { }
```

## Sign mode

```html
<pdf-signer
  [pdf]="myFile"
  mode="sign"
  [template]="savedTemplate"
  signerId="alice"
  (signingComplete)="onComplete($event)"
/>
```

## Theming

```html
<pdf-signer [theme]="{ primary: '#dc2626', primaryFg: '#fff' }" />
```

## Headless (PdfSignService)

```ts
import { PdfSignService } from '@pdf-sign/angular'

@Component({
  providers: [PdfSignService],
})
export class MyComponent implements OnInit {
  svc = inject(PdfSignService)

  ngOnInit() {
    this.svc.initialise({ mode: 'prepare', pdf: this.myFile })
    void this.svc.load()
  }
}
```
