import { Util } from './utils';

export function process(content: string, actionContent: string): string | null {
  let output: string | null = Util.removeInlineComment(content);
  output = Util.removeMultilineComment(output);
  output = output.replace('return state = undefined;', 'return { ...state, pdfObjectUrl: undefined };');
  const allCases = getCases(output);
  const allCaseReturns = getCaseReturnValues(output);
  output = createReducer(output, allCases, allCaseReturns, actionContent);
  output = (output || '').replace(/InitialState/gi, 'initialState');
  output = Util.updateActionNames(/(?<=on\([\s]*\w*\.)\w*(?=,)/g, output, actionContent);
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

function createReducer(content: string, allCases: string[], allCaseReturns: string[], actionContent: string): string | null {
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
      if (caseBlock) {
        const match = caseBlock.match(reAction);
        let key = '';
        if (match) {
          key = match[0].split('.')[1];
          caseBlock = caseBlock.replace(reAction, key);
        }
        
        const action = acase.split('.')[1];
        var actionConstructorWithNoArg = isActionConstructorHaveArguments(action, actionContent);
        if (actionConstructorWithNoArg) {
          key = ''; // when no arguments set key to empty string
        }

        listOn.push(`
  on(${acase}, (state, { ${key} }) => ({ ${caseBlock} }))`);
      }
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

function isActionConstructorHaveArguments(action: string, actionContent: string) {
  const regex = `(?<=readonly[\\s\\S]*${action}[\\s\\S]*constructor\\().*(?=\\))`;
  var match = actionContent.match(regex);
  if (match && match[0].trim() == '') {
    return true;
  }
  return false;
}
