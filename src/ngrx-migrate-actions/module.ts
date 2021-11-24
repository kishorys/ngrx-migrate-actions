import { Util } from "./utils";

export function process(content: string): string | null {
  content = updateDispatch(content);
  return content;
}

function updateDispatch(content: string) {
  var res = [
    { replace: /NgbModule.forRoot\(\)/g, with: 'NgbModule' },
    { replace: /import.*lendingcoreapp.*/g, with: '' },
    { replace: /RestClientModule[,]*/, with: '' },
    { replace: /WebStorageModule[,]*/, with: '' },
    { replace: /RestClientService,/, with: '' },
    { replace: /WebStorageService[,]*/, with: '' },
    { replace: /\s*TreeTableModule,/g, with: '' },
    { replace: /\s*DataTableModule,/g, with: '' }
  ];
  content = Util.replaceRegEx(res, content);
  content = fixImports(content);
  return content;
}

function fixImports(content: string) {
  const importMap: any = {
    'MatTabsModule': 'import { MatTabsModule } from \'@angular/material/tabs\';',
    'MatTooltipModule': 'import { MatTooltipModule } from \'@angular/material/tooltip\';',
    'MatSelectModule': 'import { MatSelectModule } from \'@angular/material/select\';',
    'MatCheckboxModule': 'import { MatCheckboxModule } from \'@angular/material/checkbox\';',
    'MatRadioModule': 'import { MatRadioModule } from \'@angular/material/radio\';',
    'MatInputModule': 'import { MatInputModule } from \'@angular/material/input\';',
    'MatButtonModule': 'import { MatButtonModule } from \'@angular/material/button\';',
    'MatDatepickerModule': 'import { MatDatepickerModule } from \'@angular/material/datepicker\';',
    'MatButtonToggleModule': 'import { MatButtonToggleModule } from \'@angular/material/button-toggle\';',
    'MatSlideToggleModule': 'import { MatSlideToggleModule } from \'@angular/material/slide-toggle\';',
    'MatAutocompleteModule': 'import { MatAutocompleteModule } from \'@angular/material/autocomplete\';',
    'TooltipPosition': 'import { TooltipPosition } from \'@angular/material/tooltip\';',

    'TreeModule': 'import { TreeModule } from \'primeng/tree\';',
    'TableModule': 'import { TableModule } from \'primeng/table\';',
    'FileUploadModule': 'import { FileUploadModule } from \'primeng/fileupload\';',
    'AccordionModule': 'import { AccordionModule } from \'primeng/accordion\';',
  }


  const importList: string[]= [];
  Object.keys(importMap).forEach(k => {
    const regex = new RegExp('import.*' + k + '.*');
    if (regex.exec(content)) {
      importList.push(k.trim());
    }
  });
  if (importList.length > 0) {
    let strImport: string = '\n';
    for (let i = 0; i < importList.length; i++) {
      const regex = new RegExp('import.*' + importList[i] + '.*');
      content = content.replace(regex, '');
      strImport += importMap[importList[i]] + '\n';
    }
    strImport += '\n';
    const re = /\s*(?=@NgModule)/;
    content = content.replace(re, strImport);
  }
  return content;
}
