// Did have a complete parse here but it got too out of hand quicky:
// const tagRE = /<!--[\S\s]*?-->|<[/]?([a-z\-][a-z0-9\-_]*)\s*([a-z\-][a-z0-9\-_]*(=["']([^"']*?)["'])?\s*)*[/]?>|[^<]+/gim;
const tagRE = /<!--[\S\s]*?-->|<[/]?.*?[/]?>|[^<]+/gm;
const attrRE = /([\w-%]+)(=(['"])(.*?)\3)?/g;
// create optimized lookup object for
// void elements as listed here:
// https://html.spec.whatwg.org/#void-elements
const voidElements = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]);

class Parser {
  constructor(options) {
    this.options = options || {};
  }

  parse(html) {
    const result = [];
    const stack = []; 

    function placeEl(el) {
      let stackSize = stack.length;
      if (stackSize > 0) {
        stack[stackSize - 1].children.push(el);
      } else {
        result.push(el);
      }
    }

    html.replace(tagRE, (content, index, ...args) => {
      const isOpen = content.charAt(1) !== '/';
      let type = "text";
      // Is comment
      if (content.indexOf('<!--') === 0) {
        type = "comment";
      } else {
        if (content.indexOf("<") === 0) {
          type = "tag";
        }
      }

      switch (type) {
        case "tag":
          const tag = parseTag(content);
          if (isOpen && !tag.voidElement) {
            stack.push(tag);
          } else {
            let orphan;
            if (tag.voidElement) {
              orphan = tag;
            } else {
              orphan = stack.pop();
            }
            placeEl(orphan);
          }
          break;
        case "text":
        case "comment":
            placeEl({type, content});
          break;
      }
    });

    return result;
  }
}

function parseTag(tag) {
  const res = {
    type: 'tag',
    name: null,
    voidElement: false,
    attrs: {},
    children: []
  };

  tag.replace(attrRE, (...args) => {
    const key = args[1];
    const value = args[4];

    if (res.name === null) {
      if (voidElements.has(key)
          || tag.charAt(tag.length - 2) === '/') {
        res.voidElement = true;
      }
      res.name = key;
      return;
    }
    res.attrs[key] = value || true;
  });

  return res;
}
