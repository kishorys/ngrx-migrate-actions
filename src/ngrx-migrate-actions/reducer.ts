import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { Util } from './utils';

// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function migrateReducers(_options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const { filePath } = _options;
    if (!filePath) {
      throw new SchematicsException(`filePath option is required.`);
    }
    tree.getDir(filePath)
      .visit(fileName => {
        if (!fileName.endsWith('reducer.ts')) {
          return;
        }
        const content: Buffer | null = tree.read(fileName);
        if (!content) {
          return;
        }
        let strContent: string = '';
        if (content) strContent = content.toString();
        const updatedContent: string | null = process(strContent);
        if (updatedContent) {
          console.log('Updated Reducer Content:', updatedContent);
          tree.overwrite(fileName, updatedContent);
        }
      });
    return tree;
  };
}

function process(content: string): string | null {
  let output: string | null = Util.removeInlineComment(content);
  output = Util.removeMultilineComment(content);
  const allCases = getCases(content);
  const allCaseReturns = getCaseReturnValues(content);
  output = createReducer(content, allCases, allCaseReturns);
  return output;
}

function getCases(content: string): string[] {
  const regex = /.(?<=case )(.*)(?=:)/g;
  const list: string[] = content.match(regex) || [];
  return list.map(x => x.trim());
}

function getCaseReturnValues(content: string): string[] {
  const regex = /(?<=return *{)([\s\S.]*?)(?=})/gm;
  const list: string[] = content.match(regex) || [];
  return list.map(x => x.trim());
}

function createReducer(content: string, allCases: string[], allCaseReturns: string[]): string | null {
  let match: RegExpExecArray | null;
  const re = /(export(\ )+function)/gi;
  const reAction = /action([^ |,|}]+)/g;
  let output = Util.removeMultilineComment(content);
  output = Util.removeInlineComment(content);
  if ((match = re.exec(output)) != null) {
    const initPos = match.index - 1;
    const endPos = findClassEndPos(output, initPos);
    if (endPos === 0) {
      console.error('failed to parse');
      return null;
    }

    let template = `
export const myReducer = createReducer(
  initialState,
`;
    const listOn: string[] = [];
    allCases.forEach((acase, i) => {
      let caseBlock = allCaseReturns[i];
      const match = caseBlock.match(reAction);
      let key = 'payload';
      if (match) {
        key = match[0].split('.')[1];
        caseBlock = caseBlock.replace(reAction, key);
      }

      listOn.push(`
  on(${acase}, (state, { ${key} }) => ({ ${caseBlock} }))`);
    });
    template += listOn.join(',');
    template += `
);

export function reducer(state: State | undefined, action: Action) {
  return myReducer(state, action);
}
`;
    output = output.substr(0, initPos) + template + output.substr(initPos + endPos);
    output = `
import { createReducer, on, Action } from '@ngrx/store';

    ` + output;
  }

  return output;

}

function findClassEndPos(str: string, pos: number): number {
  var content = str.substring(pos);
  var re = /[{}]/g;
  var counter = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) != null) {
    if (content[match.index] == '{') {
      counter++;
    } else {
      counter--;
    }
    if (counter < 0) {
      console.error('found incorrect paranthesis');
      break;
    } else if (counter == 0) {
      return match.index + 1;
    }
  }
  return 0;
}