import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as ACTION from './action';
import * as REDUCER from './reducer';
import * as EFFECT from './effect';
import * as COMPONENT from './component';
import * as SERVICE from './service';
import * as TYPEDEF from './typedef';
import * as GUARD from './guard';
import * as MODULE from './module';
import { readFileSync, existsSync } from 'fs';


// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function update(_options: any): Rule {
  const fse = require('fs-extra');

  const srcDir = `C:/Users/kys/Downloads/app`;
  const destDir = `C:/Users/kys/workspace/frontend/ngrx-migrate-actions/src/app`;
  fse.copySync(srcDir, destDir, { overwrite: true }, function (err: any) {
    if (err) {
      console.error(err);
    } else {
      console.log("success!");
    }
  });
  return (tree: Tree, _context: SchematicContext) => {
    const { filePath } = _options;
    tree = processDir(tree, filePath, '', 0);
    tree = processDir(tree, filePath, '', 1);
    return tree;
  };
}

const missingActionMapping: any = {
  '/src/app/core/store/reducers/rate-sheets.reducer.ts': './src/app/core/store/actions/rate-sheet.actions.ts',
  '/src/app/core/store/effects/loan-pipeline-cols.effects.ts': './src/app/core/store/actions/search-loan-pipeline.actions.ts',
  '/src/app/core/store/effects/estimation-announcement.effects.ts': './src/app/core/store/actions/timeestimate-announcement.action.ts',
  '/src/app/core/store/effects/pie-chart-effects.ts': './src/app/core/store/actions/pie-chart.actions.ts',
  '/src/app/core/store/reducers/pie-chart.reducer.ts': './src/app/core/store/actions/pie-chart.actions.ts'
};

function processDir(tree: Tree, filePath: string, dir: string, step: number) {
  dir = filePath + dir + '\\';
  tree.getDir(dir)
    .visit(fileName => {
      const content: Buffer | null = tree.read(fileName);
      if (!content) {
        return;
      }
      let strContent: string = '';
      if (content) strContent = content.toString();
      let updatedContent: string | null = null;
      if (fileName.endsWith('action.ts') || fileName.endsWith('actions.ts')) {
        if (step === 1) {
          updatedContent = ACTION.process(strContent);
        } else {
          // will be processed later after effect is migrated
        }
      } else if (fileName.endsWith('reducer.ts')) {
        if (step === 0) {
          updatedContent = REDUCER.process(strContent, getActionContent(fileName, /reducer[s]*/g));
        }
      } else if (fileName.endsWith('effects.ts')) {
        if (step === 0) {
          updatedContent = EFFECT.process(strContent, getActionContent(fileName, /effects/g));
        }
      } else if (fileName.endsWith('component.ts')) {
        if (step === 0) {
          updatedContent = COMPONENT.process(strContent);
        }
      } else if (fileName.endsWith('service.ts')) {
        if (step === 0) {
          updatedContent = SERVICE.process(strContent);
        }
      } else if (fileName.endsWith('typedef.ts') || fileName.endsWith('util.ts')) {
        if (step === 0) {
          updatedContent = TYPEDEF.process(strContent);
        }
      } else if (fileName.endsWith('guard.ts') || fileName.endsWith('interceptor.ts')) {
        if (step === 0) {
          updatedContent = GUARD.process(strContent);
        }
      } else if (fileName.endsWith('module.ts')) {
        if (step === 0) {
          updatedContent = MODULE.process(strContent);
        }
      } else {
        tree.delete(fileName);
      }
      if (updatedContent) {
        // console.log('Updated Content:', updatedContent);
        // if (fileName.includes('user-admin.module.ts')) {
        //   console.log('Updated Content:', updatedContent);
        // }
        tree.overwrite(fileName, updatedContent);
      }
    });
  return tree;
}

function getActionContent(fileName: string, regex: RegExp): string {
  let actionFileName = '.' + fileName.replace(regex, 'actions');
  try {
    if (!existsSync(actionFileName)) {
      actionFileName = actionFileName.replace('actions.ts', 'action.ts');
    }
  } catch (err) {
    console.error('ERR->', err)
  }
  let strActionContent: string = '';
  if (existsSync(actionFileName)) {
    strActionContent = readFileSync(actionFileName, 'utf-8');
  } else if (existsSync(missingActionMapping[fileName])) {
    strActionContent = readFileSync(missingActionMapping[fileName], 'utf-8');
  } else {
    console.log('could not find matching action', actionFileName, 'for ', fileName);
  }
  strActionContent = strActionContent.replace(/export const\s*[a-zA-Z]*\s*=\s*{[\s\S]*?;/g, '')
  return strActionContent;
}
