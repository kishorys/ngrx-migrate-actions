import { Util } from './utils';

export function process(content: string): string | null {
  const re = /(export(\ )+class)/gi;
  const actionList = [];
  let match: RegExpExecArray | null;
  let output = Util.removeMultilineComment(content);
  output = Util.removeInlineComment(content);
  output = replaceActionWithCreateActionImport(output);
  output = replaceUnusedConstants(output);
  while ((match = re.exec(output)) != null) {
    const initPos = match.index - 1;
    const endPos = findClassEndPos(output, initPos);
    if (endPos === 0) {
      continue;
    }
    const str: string = output.substring(initPos, initPos + endPos);
    const action = getActionName(str);
    let attributes = getAttributes(str);
    if (!attributes) {
      attributes = 'dummy?: boolean';
    }
    if (action && attributes) {
      actionList.push(action);
      let attributesKeyStr = '';
      let attributesValStr = '';
      if (attributes.split(',').length > 1) {
        attributesKeyStr = attributes.match(/payload[\s]*:[\s]*\{/) ? attributes : `${attributes}`;
        attributesValStr = attributes.match(/payload[\s]*:[\s]*\{/) ? 'payload' : `{ ${attributes.replace(/(:.*?,)/g, ',').replace(/:.*/g, '')
          .replace(/\?/g, '')} }`;
      } else {
        attributesKeyStr = attributes;
        attributesValStr = `{ ${attributes.split(',').map(s => s.split(':')[0].replace(/\?/g, '')).join(',')} }`;
      }
      const template: string = `
            export const ${action} = createAction(
                '[${action}]',
                (${attributesKeyStr}) => (${attributesValStr}),
            );`;
      output = output.substr(0, initPos) + template + output.substr(initPos + endPos);
    } else {
      console.error('couldn\'t parse action', action);
    }
  }
  if (actionList.length > 0) {
    output += 'export type Action =';
    var pos = 0;
    actionList.forEach(action => {
      if (pos == actionList.length - 1) {
        output += ' typeof ' + action + ';';
      } else {
        output += ' typeof ' + action + ' |';
      }
      pos = pos + 1;
    });
  }
  var res = [
    { replace: / as NgRxAction/g, with: '' },
    { replace: /(loanNumber: string, lenderId\))/g, with: 'loanNumber: string, lenderId: any)' }
  ];
  output = Util.replaceRegEx(res, output);
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

function getActionName(str: string) {
  var src = str.matchAll(/export[\ ]+class[\ ]+([A-Za-z0-9]*?)[\ ]/g);
  var matches = Array.from(src, x => x[1]);
  if (matches.length > 0) {
    return matches[0];
  }
  return null;
}


function getAttributes(str: string): string {
  var src = str.matchAll(/(?<=constructor[\s]*\()([\s\S]*?)(?=\))/gm);
  var matches = Array.from(src, x => x[1]);
  if (matches.length > 0) {
    return matches[0].replace(/public /g, '');
  }
  return '';
}

function replaceActionWithCreateActionImport(content: string) {
  var re = /import.*Action/g;
  var importMmatch = content.match(re);
  if (importMmatch) {
    content = content.replace(re, importMmatch[0].replace('Action', 'createAction'))
  }
  return content;
}

function replaceUnusedConstants(content: string) {
  var re = /export[\s]*const[\s]*[A-Z_]*[\s]*=.*;/g;
  var match = content.match(re);
  if (match) {
    content = content.replace(re, '');
  }
  var re1 = /export type Action[.\s\w\W]*?;{1}/g;
  var match1 = content.match(re1);
  if (match1) {
    content = content.replace(re1, '');
  }
  return content;
}