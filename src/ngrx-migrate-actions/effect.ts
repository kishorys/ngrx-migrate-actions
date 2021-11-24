import { Util } from './utils';

export function process(content: string, actionContent: string): string | null {
  content = Util.removeInlineComment(content);
  content = Util.removeMultilineComment(content);
  content = Util.updateActionNames(/(?<=ofType\(.*\.)(.*)(?=\)\.pipe)/g, content, actionContent);
  content = addEffectCloseBraces(content);
  content = replaceEffectWithCreateEffectImport(content);
  content = updateEffect(content);
  content = addPipeToEffect(content);
  content = removeNewFromActions(content);
  var res = [
    { replace: /(?<=switchMap\s*\(\s*)\(\s*pay[lL]oad\s*:\s*\w*\.\w*\)/g, with: 'payload'},
    { replace: /(?<=switchMap\s*\(\s*)\(\s*action\s*:\s*\w*\.\w*\)/g, with: 'action'},
    { replace: /(?<=map\s*\(\s*)\(\s*action\s*:\s*\w*\.\w*\)/g, with: 'action' },
    { replace: /ActionTypes.LOGIN/g, with: 'AuthActions.LoginAction' },
    { replace: /ActionTypes.LOGOUT/g, with: 'AuthActions.LogoutAction' },
    { replace: /ActionTypes.ACCESS_TOKEN/g, with: 'AuthActions.AccessTokenAction' },
    { replace: /ActionTypes.REFRESH_TOKEN/g, with: 'AuthActions.RefreshTokenAction' },
    { replace: /ActionTypes.FORGOT_PASSWORD/g, with: 'AuthActions.ForgotPasswordAction' },
    { replace: /ActionTypes.CHANGE_PASSWORD/g, with: 'AuthActions.ChangePasswordAction' },
    { replace: /ActionTypes.TAB_REFRESHED/g, with: 'AuthActions.TabRefreshedAction' },
    { replace: /return.*EMPTY/g, with: 'return of(null)'},
    { replace: /(?<=import.*)EMPTY/g, with: 'of'},
    { replace: /import { of, of } from 'rxjs';/g, with: 'import { of } from \'rxjs\';' },
    { replace: /payLoad/g, with: 'payload' },
  ];
  content = Util.replaceRegEx(res, content);
  content = addMissingClosingParanthesis(content);
  content = replaceMultipleOfType(content);
  return content;
}

function replaceEffectWithCreateEffectImport(content: string) {
  var re = /import.*Effect/g;
  var importMmatch = content.match(re);
  if (importMmatch) {
    content = content.replace(re, importMmatch[0].replace('Effect', 'createEffect, ofType'))
  }
  return content;
}

function updateEffect(content: string) {
  var reFind = /@Effect\(.*\)\s*.*=/;
  var reRepl = /(?<=@Effect\(.*\)\s*)(.*)(?=\s\=)/;
  var effectDefnMatch = reFind.exec(content);
  while (effectDefnMatch) {
    var matchContent: string = effectDefnMatch[0]
    var matchContentLength = matchContent.length;
    var matchPos = effectDefnMatch.index;
    content = content.slice(0, matchPos) + (matchContent.match(reRepl) || [])[0].trim() + ' = createEffect(() =>' + content.slice(matchPos + matchContentLength);
    effectDefnMatch = reFind.exec(content);
  }
  return content;
}

function addEffectCloseBraces(content: string) {
  const reFind = new RegExp(/;[\s]*.*(?<=@Effect)/g);
  const matches = content.matchAll(reFind);
  var posShift = 0;

  for (const effectDefnMatch of matches) {
    var matchContent = effectDefnMatch[0];
    var replaceContent = matchContent.replace(';', ');');
    var matchContentLength = matchContent.length;
    var matchPos = (effectDefnMatch.index || 0) + posShift;
    content = content.slice(0, matchPos) + replaceContent + content.slice(matchPos + matchContentLength);
    posShift++;
  }
  return content;
}

function addPipeToEffect(content: string) {
  var reFind = /(?<=this\.[_]*action[s]*\$)([\s\S.]*?)(?=ofType)/g;
  var replStr = '.pipe(';
  content = content.replace(reFind, replStr);
  // content = content.replace('}));', '})));');
  
  // replace .pipe( at the end for offType with ','
  var reFindPipe = /ofType.*\)[\s]*\.[\s]*pipe\(/g;
  var match = reFindPipe.exec(content);
  while (match) {
    var matchContent = match[0];
    var replaceContent = matchContent.replace(/\.[\s]*pipe\(/, ',');
    var matchPos = (match.index || 0);
    var matchContentLength = matchContent.length;
    content = content.slice(0, matchPos) + replaceContent + content.slice(matchPos + matchContentLength);
    match = reFindPipe.exec(content);
  }
  return content;
}

function addMissingClosingParanthesis(effectContent: string) {
  var reFind = new RegExp(/(createEffect)[\s\S]*(catchError|map|tap)[\w\(:\S\W]*?;/g);
  let lastIndex = null;
  while (reFind.exec(effectContent) !== null) {
    lastIndex = reFind.lastIndex;
  }
  if (lastIndex) {
    effectContent = effectContent.slice(0, lastIndex - 1) + ")" + effectContent.slice(lastIndex - 1);
  }
  return effectContent;
}

function removeNewFromActions(effectContent: string): string {
  var reFind = /new[\s]*\w*[\s]*\.\w*/g;
  var reRepl = /(?<=new[\s]*)\w*[\s]*\.\w*/g;
  var m;
  var r;
  do {
    m = reFind.exec(effectContent);
    r = reRepl.exec(effectContent);
    if (m && r) {
      effectContent = effectContent.replace(m[0], r[0]);
    }
  } while (m || r);
  return effectContent;
}

function replaceMultipleOfType(content: string): string {
  var re = /import.*ofType.*ofType/g;
  if (content.match(re)) {
    content = content.replace(/(?<=import.*)ofType,/g, '');
  }
  return content;
}
