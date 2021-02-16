import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { Util } from './utils';


// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function migrateActions(_options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const { filePath } = _options;
    if (!filePath) {
      throw new SchematicsException(`filePath option is required.`);
    }
    tree.getDir(filePath)
      .visit(fileName => {
        if (!fileName.endsWith('.ts')) {
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
          console.log('Updated Content:', updatedContent);
          tree.overwrite(fileName, updatedContent);
        }
      });
    return tree;
  };
}

function process(content: string): string | null {
  const re = /(export(\ )+class)/gi;
  const actionList = [];
  let match: RegExpExecArray | null;
  let output = Util.removeMultilineComment(content);
  output = Util.removeInlineComment(content);
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
      const template: string = `
            export const ${action} = createAction(
                '[${action}]',
                (${attributes}) => ({ ${attributes.split(',').map(s => s.split(':')[0].replace(/\?/g, '')).join(',')} }),
            );`;
      output = output.substr(0, initPos) + template + output.substr(initPos + endPos);
    } else {
      console.error('couldn\'t parse');
    }
  }
  if (actionList.length > 0) {
    output += `
      const allActions = union({ actionList.join(', ') });
      export type Action = typeof allActions;
    `;
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

function getActionName(str: string) {
  var src = str.matchAll(/export[\ ]+class[\ ]+([A-Za-z]*?)[\ ]/g);
  var matches = Array.from(src, x => x[1]);
  if (matches.length > 0) {
    return matches[0];
  }
  return null;
}


function getAttributes(str: string): string {
  var src = str.matchAll(/(?<=constructor[\s\S]*\()([\s\S]*?)(?=\))/gm);
  var matches = Array.from(src, x => x[1]);
  if (matches.length > 0) {
    return matches[0].replace(/public /g, '');
  }
  return '';
}

