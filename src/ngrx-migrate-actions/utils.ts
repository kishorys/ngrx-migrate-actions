export class Util {
  static removeInlineComment(content: string) {
    var re = /[\ \t]*\/\/.*/g;
    return content.replace(re, '');
  }

  static removeMultilineComment(content: string) {
    const regex = /\/\*([\s\S]*?)\*\//g;
    content = content.replace(regex, '');
    return content;
  }
  
  // PriceShoppingActions.FLOAT_PRODUCT_RATE_ERROR -> PriceShoppingActions.FloatProductRateError
  static capsToCamel(actionText: string) {
    var tokens = actionText.split('.');
    var text = tokens[1];
    return tokens[0] + '.' + text.split('_').map(x => { x = x[0].toUpperCase() + x.slice(1).toLowerCase(); return x; }).join('');
  }
  
  static replaceRegEx(regExArr: { replace: RegExp, with: string}[], content: string) {
    regExArr.forEach(re => {
        var importMmatch = content.match(re.replace);
        if (importMmatch) {
          content = content.replace(re.replace, re.with)
        }
      });
      return content;
  }
  
  static updateActionNames(reFind: RegExp, targetContent: string, actionContent: string): string {
    const matches = targetContent.matchAll(reFind);
    const reFetchAction = /(?<=export[\s]+class[\s]+)\w*/;
    for (const keyMatch of matches) {
      const reActionNameMatch = `export[\\s]*class[\\s]*(.*)\\s*readonly type(.*)[\\s]+${keyMatch[0]}[\\s]*;`;
      var actionMatch = actionContent.match(reActionNameMatch);
      if (actionMatch) {
        var str = '';
        for (let i = 0; i < actionMatch.length; i++) {
          str += actionMatch[i];
        }
        const actionName = str.match(reFetchAction);
        if (actionName) {
          targetContent = targetContent.replace(keyMatch[0], actionName[0]);
        }
      }
    }
    return targetContent;
  }

}
