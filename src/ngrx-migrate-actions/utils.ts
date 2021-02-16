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
}
