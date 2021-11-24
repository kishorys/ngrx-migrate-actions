import { Util } from "./utils";

export function process(content: string): string | null {
  content = updateDispatch(content);
  content = addMissingBrackets(content);
  content = fixUserAdminImport(content);
  content = fixImports(content);
  return content;
}

function updateDispatch(content: string) {
  var res = [
    { replace: /\/\/ tslint:disable-next-line:max-line-length/g, with: '' },
    { replace: /\.dispatch\([\s]*new[\s]*/g, with: '\.dispatch(' },
    { replace: /this\.[\w]*[\s]*\.findById[\s]*\([\s]*StorageScope.Permanent[\s]*,/g, with: 'localStorage.getItem(' },
    { replace: /this\.[\w]*[\s]*\.findById[\s]*\([\s]*StorageScope.Session[\s]*,/g, with: 'sessionStorage.getItem(' },
    { replace: /this\.[\w]*[\s]*\.remove[\s]*\([\s]*StorageScope.Permanent[\s]*,/g, with: 'localStorage.removeItem(' },
    { replace: /this\.[\w]*[\s]*\.remove[\s]*\([\s]*StorageScope.Session[\s]*,/g, with: 'sessionStorage.removeItem(' },
    { replace: /this\.[\w]*[\s]*\.save[\s]*\([\s]*StorageScope.Permanent[\s]*,/g, with: 'localStorage.saveItem(' },
    { replace: /this\.[\w]*[\s]*\.save[\s]*\([\s]*StorageScope.Session[\s]*,/g, with: 'sessionStorage.saveItem(' },
    { replace: /,[\s]*.*storage[\s]*:[\s]*WebStorageService/gm, with: '' },
    { replace: /import.*web-storage.*/gm, with: '' },
    { replace: /DeviceFingerPrint\(\w*\.\w*\)/g, with: 'DeviceFingerPrint()' },
    { replace: /.*StoreReplicaAction.*/g, with: '' },
    { replace: /.*LogOutAction.*/g, with: '' },
    { replace: /.*storage,.*/g, with: '' },
    { replace: /.*_storage.*storage.*/, with: ''},
    { replace: /.*_storage.*WebStorageService.*/, with: ''}
  ];
  content = Util.replaceRegEx(res, content);
  content = updateHttpCallType(content);
  content = fixVerificationComponent(content);
  return content;
}

function addMissingBrackets(content: string) {
  const re = /(?<=dispatch\().*(?=\))/g;
  const matches = content.matchAll(re);
  var posShift = 0;

  for (const match of matches) {
    var matchContent = match[0];
    if (!matchContent.includes('(') && !matchContent.includes(')')) {
      var replaceContent = matchContent + '()';
      var matchContentLength = matchContent.length;
      var matchPos = (match.index || 0) + posShift;
      content = content.slice(0, matchPos) + replaceContent + content.slice(matchPos + matchContentLength);
      posShift += 2;

    }
  }
  return content;
}

function fixUserAdminImport(content: string) {
  const regex = /(?<=.*')([\.|/]*)core/;
  const replRegex = /(?<=import.*)app\/core/;
  const match = content.match(regex);
  if (match && content.match(replRegex)) {
    content = content.replace(replRegex, match[0]);
  }
  return content;
}

function fixImports(content: string) {
  const importMap: any = {
    'FileUpload': 'import { MatTabsModule } from \'primeng/fileupload\';',
    'MatButtonToggle': 'import { MatButtonToggle } from \'@angular/material/button-toggle\';',
    'MatSelectChange': 'import { MatSelectChange } from \'@angular/material/select\';',
  }


  const importList: string[] = [];
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
    const re = /\s*(?=@Component)/;
    content = content.replace(re, strImport);
  }
  return content;
}

function updateHttpCallType(content: string) {
  var rePost = /(\.post[\s\S]*?subscribe\(\(.*:[\s*]).*(\))/;
  var reType = /(?<=\.post[\s\S]*?subscribe\(\(.*:[\s*]).*(?=\))/;
  const matchResList = content.matchAll(rePost);

  for (const matchRes of matchResList) {
    var typeMatch = (matchRes[0]).match(reType);
    if (typeMatch) {
      var updatedStr = (matchRes[0]).replace('\.post', '\.post<' + typeMatch[0] + '>');
      content = content.replace(rePost, updatedStr);
    }
  }
  
  var reGet = /(\.get\([\w\.]*?\)\.subscribe\(\(.*:[\s*]).*(\))/;
  var reGetType = /(?<=\.get\([\w\.]*?\)\.subscribe\(\(.*:[\s*]).*(?=\))/;
  const matchGetResList = content.matchAll(reGet);

  for (const matchRes of matchGetResList) {
    var typeMatch = (matchRes[0]).match(reGetType);
    if (typeMatch) {
      var updatedStr = (matchRes[0]).replace('\.get', '\.get<' + typeMatch[0] + '>');
      content = content.replace(reGet, updatedStr);
    }
  }
  return content;
}

function fixVerificationComponent(content: string) {
  if (content.includes('extends AuthComponent')) {
    var re = /(?<=constructor\([\S\s.]*?\{)\s*/;
    content = content.replace(re, '\n super(store, authService);\n');
  }
  return content;
}
