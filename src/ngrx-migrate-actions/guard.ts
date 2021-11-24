import { Util } from "./utils";

export function process(content: string): string | null {
  content = updateDispatch(content);
  return content;
}

function updateDispatch(content: string) {
  var res = [
    { replace: /\.dispatch\([\s]*new[\s]*/g, with: '\.dispatch(' },
    { replace: /import.*web-storage.*/gm, with: '' },
    { replace: /,[\s]*[private]*\s*storage[\s]*:[\s]*WebStorageService/gm, with: '' },
    { replace: /this\.[\w]*[\s]*\.findById[\s]*\([\s]*StorageScope.Session[\s]*,/g, with: 'sessionStorage.getItem(' }
  ];
  content = Util.replaceRegEx(res, content);
  return content;
}
