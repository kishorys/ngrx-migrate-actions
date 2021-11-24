import { Util } from "./utils";

export function process(content: string): string | null {
  content = updateDispatch(content);
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
    { replace: /,[\s]*[private]*\s*storage[\s]*:[\s]*WebStorageService/gm, with: '' },
    { replace: /import.*web-storage.*/gm, with: '' },
    { replace: /DeviceFingerPrint\(\w*\.\w*\)/g, with: 'DeviceFingerPrint()' },
    { replace: /constructor\(private webStorageService: WebStorageService\)/, with: 'constructor()'}
  ];
  content = Util.replaceRegEx(res, content);
  return content;
}
