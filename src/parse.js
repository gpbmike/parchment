/*global Parchment:false */

/*

  Modeled after https://github.com/xing/wysihtml5/

  handles the following
  - converts &nbsp; to ' '
  - converts multiple spaces to single spaces
  - converts unknown (no rule) nodes with children to SPAN
  - removes unknown (no rule) nodes with NO children
  - converts one tag to another (with rule)
    ex rules: { b: "strong"}, { b: { rename_tag: "strong" } }

  TODO
  - inline element should not wrap block elements
    ex: <b><h2>yo</h2></b> => <h2><b>yo</b></h2>
  - maintain multiple spaces inside PRE tags


  Rules Formats
  We take a white-list approach. If the element is not in the rules, it is converted to span
  {
    tags: {
      // convert one tag into another
      'b': 'strong',
      'i': {
        rename_tag: 'em'
      }
    }
  }

*/

(function(Parchment){

  "use strict";

  var NODE_TYPE_MAPPING = {},
      DEFAULT_NODE_NAME = "span",
      parser_rules;

  function _convert(dirtyNode) {

    var dirtyChildren = dirtyNode.childNodes,
        dirtyNodeType = dirtyNode.nodeType,
        method        = NODE_TYPE_MAPPING[dirtyNodeType],
        i,
        cleanNode,
        cleanChild;

    cleanNode = method && method(dirtyNode);

    for (i = 0; i < dirtyChildren.length; i++) {
      cleanChild = _convert(dirtyChildren[i]);
      if (cleanNode) {
        cleanNode.appendChild(cleanChild);
      }
    }

    return cleanNode;
  }

  function _handleAttributes(dirtyNode, cleanNode, rule) {

    var nodeName = dirtyNode.nodeName.toLowerCase(),
        style = dirtyNode.style;

    if (nodeName === 'span') {
      if (style.fontStyle === 'italic') {
        cleanNode = document.createElement('em');
      }
      if (style.fontWeight === 'bold') {
        cleanNode = document.createElement('strong');
      }
      if (style.textDecoration === 'line-through') {
        cleanNode = document.createElement('strike');
      }
      if (style.textDecoration === 'underline') {
        cleanNode = document.createElement('u');
      }
    } else if (nodeName === 'b' && style.fontWeight === 'normal') {
      cleanNode = document.createElement('span');
    }

    return cleanNode;

  }

  function _handleElement(dirtyNode) {

    var cleanNode,
        nodeName = dirtyNode.nodeName.toLowerCase(),
        rule = parser_rules.tags[nodeName];

    if (rule) {
      rule = typeof(rule) === "string" ? { rename_tag: rule } : rule;
    }

    // explicitly remove
    else if (rule === false) {
      return null;
    }

    // rename unknown elements with children
    else if (dirtyNode.firstChild) {
      rule = { rename_tag: DEFAULT_NODE_NAME };
    }

    // implicitly remove empty unknown elements
    else {
      return null;
    }

    cleanNode = document.createElement(rule.rename_tag || nodeName);
    cleanNode = _handleAttributes(dirtyNode, cleanNode, rule);

    return cleanNode;
  }

  function _handleText(dirtyNode) {

    var nextSibling = dirtyNode.nextSibling;
    if (nextSibling && nextSibling.nodeType === Parchment.TEXT_NODE) {
      // Concatenate text nodes
      nextSibling.data = dirtyNode.data + nextSibling.data;
    } else {

      var data = dirtyNode.data,
          node = dirtyNode,
          inPre = false;

      // check to see if we are in a PRE node before fixing whitespace
      // this logic should take place outside of hererererere
      while (node.parentNode) {
        if (node.parentNode.nodeName.toLowerCase() === 'pre') {
          inPre = true;
          break;
        }
        node = node.parentNode;
      }

      if (!inPre) {
        // replace non-breaking spaces with normal space
        data = data.replace(/\u00a0/g, ' ');

        // replaces tabs with single space
        data = data.replace(/\t/g, ' ');

        // replace line breaks with single space
        data = data.replace(/\n/g, ' ');

        // replace 2+ spaces with single space
        data = data.replace(/\s{2,}/g, ' ');
      }

      return document.createTextNode(data);
    }

  }

  // We only handle ELEMENT_NODEs and TEXT_NODEs
  NODE_TYPE_MAPPING[Parchment.ELEMENT_NODE] = _handleElement;
  NODE_TYPE_MAPPING[Parchment.TEXT_NODE]    = _handleText;

  Parchment.parse = function(elementOrHtml, rules) {

    parser_rules = rules || {};

    var fragment = document.createDocumentFragment(),
        isString = typeof(elementOrHtml) === "string",
        element,
        newNode,
        firstChild;

    if (isString) {
      element = document.createElement('div');
      element.innerHTML = elementOrHtml;
    } else {
      element = elementOrHtml;
    }

    while (element.firstChild) {
      firstChild = element.firstChild;
      newNode = _convert(firstChild);
      element.removeChild(firstChild);
      if (newNode) {
        fragment.appendChild(newNode);
      }
    }

    // Clear element contents
    element.innerHTML = "";

    // Insert new DOM tree
    element.appendChild(fragment);

    return isString ? element.innerHTML : element;

  };

})(Parchment);



// Parchment.prototype.clean = function (options) {

//   // default for no options
//   options = options || {};

//   // let everyone know we're about to clean
//   $(this.editor).trigger('beforeclean', this);

//   // method to loop through attributes whitelist to check for matches

//   function matchAnyExpression(value, expressions) {
//     if (!expressions) {
//       return false;
//     }
//     if (!(expressions instanceof Array)) {
//       expressions = [expressions];
//     }
//     for (var i = 0; i < expressions.length; i++) {
//       if ((expressions[i]).test(value)) {
//         return true;
//       }
//     }
//     return false;
//   }

//   var html = this.editor.innerHTML,
//     fragment = document.createElement('div'),
//     dirty = true,
//     precleaned_html,
//     add_padding_paragraphs = !! options.add_paragraphs;

//   fragment.innerHTML = html;

//   while (dirty) {

//     precleaned_html = html = fragment.innerHTML;

//     // remove HTML comments
//     html = html.replace(/<!--[\s\S]*?-->/g, '');

//     // remove unwanted self-closing tags
//     html = html.replace(/<\/*(font|meta|link)([^>]*)>/gi, '');

//     // we shouldn't ever need non-breaking line spaces
//     html = html.replace(/&nbsp;/gi, ' ');

//     // remove all uneccessary whitespace
//     html = html.replace(/\s{2,}/g, ' ');

//     // move extra space inside a node, outside of it
//     while ((/<([^\/][^>]*)>(\s+)/g).test(html)) {
//       html = html.replace(/<([^\/][^>]*)>(\s+)/g, ' <$1>');
//     }
//     while ((/(\s+)<\/([^>]*)>/g).test(html)) {
//       html = html.replace(/(\s+)<\/([^>]*)>/g, '<\/$2> ');
//     }

//     // remove spaces before and after block elements
//     html = html.replace(/\s*<(\/*(ADDRESS|BLOCKQUOTE|BR|DIV|DL|FIELDSET|FORM|H1|H2|H3|H4|H5|H6|HR|NOSCRIPT|OL|P|PRE|TABLE|UL|DD|DT|LI|TBODY|TD|TFOOT|TH|THEAD|TR)[^>]*)>\s*/gi, '<$1>');

//     // this.editor.innerHTML = html;
//     fragment.innerHTML = html;

//     this.fixInlineWrappers(fragment);

//     // clean up attributes, remove empty nodes
//     var nodes = fragment.getElementsByTagName('*'),
//       i, node;
//     for (i = nodes.length - 1; i >= 0; i--) {

//       node = nodes[i];

//       var tagName = node.tagName.toLowerCase();

//       // remove style tags
//       if (tagName === 'style') {
//         node.parentNode.removeChild(node);
//         continue;
//       }

//       // br should never be the first or last node
//       if (tagName === 'br' && (!node.nextSibling || !node.previousSibling)) {
//         node.parentNode.removeChild(node);
//         continue;
//       }

//       // remove empty nodes unless they pass the empty node test
//       if (node.childNodes.length === 0) {
//         var keep_node = false;
//         if (this.empty_node_whitelist[tagName]) {
//           if (this.empty_node_whitelist[tagName] instanceof Array) {
//             for (var f = 0; f < this.empty_node_whitelist[tagName].length; f++) {
//               keep_node = this.empty_node_whitelist[tagName][f](node);
//               if (keep_node) {
//                 break;
//               }
//             }
//           } else {
//             keep_node = this.empty_node_whitelist[tagName](node);
//           }
//         }
//         if (!keep_node) {
//           node.parentNode.removeChild(node);
//           continue;
//         }
//       }




//       // clear out all unwanted attributes
//       for (var k = node.attributes.length - 1; k >= 0; k--) {

//         // look for tag and attribute, then test against whitelist
//         if (!this.attributes_whitelist[tagName] || !this.attributes_whitelist[tagName][node.attributes[k].nodeName] ||
//           node.attributes[k].nodeName === 'class' || !matchAnyExpression(node.attributes[k].nodeValue, this.attributes_whitelist[tagName][node.attributes[k].nodeName])) {

//           // classes can be split up
//           if (this.attributes_whitelist[tagName] && node.attributes[k].nodeName === 'class') {

//             var class_array = node.attributes[k].nodeValue.split(' '),
//               clean_class_array = [];

//             for (var c = 0; c < class_array.length; c++) {
//               // look for whitelisted classes
//               if (matchAnyExpression(class_array[c], this.attributes_whitelist[tagName][node.attributes[k].nodeName])) {
//                 clean_class_array.push(class_array[c]);
//               }
//             }

//             // replace classes with clean ones
//             if (clean_class_array.length > 0) {
//               node.setAttribute(node.attributes[k].nodeName, clean_class_array.join(' '));
//             } else {
//               node.removeAttribute(node.attributes[k].nodeName);
//             }

//           }

//           // anything else that gets here can just be removed
//           else {
//             node.removeAttribute(node.attributes[k].nodeName);
//           }

//         }

//       }

//     }

//     // strip top level divs/spans that don't have attributes
//     node = fragment.lastChild;
//     while (node) {
//       if (node.nodeType === window.Node.ELEMENT_NODE && (/div|span/i).test(node.nodeName) && node.attributes.length === 0) {
//         while (node.firstChild) {
//           node.parentNode.insertBefore(node.firstChild, node);
//         }
//       }
//       node = node.previousSibling;
//     }

//     // handle top level nodes
//     this.addParagraphs(fragment);

//     // clean paragraphs
//     for (i = 0; i < fragment.getElementsByTagName('p').length; i++) {
//       var paragraph_to_clean = fragment.getElementsByTagName('p')[i],
//         j;

//       // strip spans in paragraphs that don't have attributes
//       for (j = 0; j < paragraph_to_clean.getElementsByTagName('span').length; j++) {
//         var span = paragraph_to_clean.getElementsByTagName('span')[j];
//         if (span.attributes.length === 0) {
//           while (span.firstChild) {
//             span.parentNode.insertBefore(span.firstChild, span);
//           }
//           span.parentNode.removeChild(span);
//         }
//       }

//       // strip anchor tags without attributes
//       for (j = 0; j < paragraph_to_clean.getElementsByTagName('a').length; j++) {
//         var a = fragment.getElementsByTagName('a')[j];
//         if (a.attributes.length === 0) {
//           while (a.firstChild) {
//             a.parentNode.insertBefore(a.firstChild, a);
//           }
//           a.parentNode.removeChild(a);
//         }
//       }
//     }

//     // stop cleaning if we didn't change anything this time around
//     if (precleaned_html === fragment.innerHTML) {
//       dirty = false;
//     }

//   }

//   // Add P's to the beginning and end so users can type before and after cages/tables/etc.
//   if (add_padding_paragraphs) {
//     var padding_paragraph = document.createElement('p');
//     padding_paragraph.innerHTML = "<br>";
//     if (!fragment.firstChild) {
//       fragment.appendChild(padding_paragraph.cloneNode(true));
//     } else if (!(/(p|h\d)/i).test(fragment.firstChild.nodeName)) {
//       fragment.insertBefore(padding_paragraph.cloneNode(true), fragment.firstChild);
//     } else if (!fragment.firstChild.firstChild) {
//       fragment.firstChild.innerHTML = "<br>";
//     }

//     if (!(/(p|h\d)/i).test(fragment.lastChild.nodeName)) {
//       fragment.appendChild(padding_paragraph.cloneNode(true));
//     } else if (!fragment.lastChild.firstChild) {
//       fragment.lastChild.innerHTML = '<br>';
//     }
//   }

//   // replace editor html with cleaned html
//   this.textarea.value = this.editor.innerHTML = fragment.innerHTML;

//   // // on the first clean we don't care about undo and we don't want to bring the focus to the editor
//   // if (options.first_clean) {
//   //     this.editor.innerHTML = fragment.innerHTML;
//   // }

//   // else {
//   //     // select and delete content twice because sometimes H2s and empty As are left over after one time.
//   //     // without focus gecko will complain, but causes the viewport to jump in webkit
//   //     // IE will delete the whole page without this
//   //     if (this.browser.mozilla || this.browser.msie) {
//   //         this.editor.focus();
//   //     }
//   //     document.execCommand('selectAll', null, null);
//   //     document.execCommand('delete', null, null);
//   //     document.execCommand('selectAll', null, null);
//   //     document.execCommand('delete', null, null);

//   //     // insert cleaned html over previous contents
//   //     this.insertHTML(fragment.innerHTML);
//   // }

//   // reset buttons
//   this.buildNodeTree();

//   // let everyone know we're clean
//   $(this.editor).trigger('clean', this);
// };

    // TODO: fix inline elements wrapping block elements. eg: <b><h2>huh?</h2></b>

    // HOLY MOLEY thats a long comment! I guess I needed to thoroughly convince myself that
    // this thing works.

    // PATCH NOTES: Heres my attempt to implement this feature, the goal of this implementation is
    // to go with the "intent" of the original tag placement. That is, if you wrap a block element
    // with an inline element the intent was probably for every element in the block element to be wrapped
    // in the inline element. So if you wrap a block with a bold element then everything in the block was
    // probably meant to bold.
    //
    // I think this implementation is reasonably fast for the number of nodes that the editor should be handling,
    // but I could be wrong. It has to do a bunch of tree traversal, so it might be slow with large elment bases.
    // On the other hand, if there are no wrongly wrapped elements then it should be fast, and the speed is proportional
    // to how many messed up elements there are (and number of children)
    // Also im not sure how it handles non-inline non-block elements (or hybrids...)
    //
    // Cases that I tested out:
    //  INTPUT: <h2><b>Huh?</b></h2>
    //  OUTPUT: <h2><b>Huh?</b></h2> (Control Case)

    //  INTPUT: <b><h2>Huh?</h2></b>
    //  OUTPUT: <h2><b>Huh?</b></h2> (More or less what you would expect)

    //  INTPUT: <b>Test <h2>Huh?</h2></b>
    //  OUTPUT: <p><b>Test</b></p><h2><b>Huh?</b></h2> (The extra <p> around Test is from clean I believe)

    //  INTPUT: <b><b><h2>Huh?</h2></b></b>
    //  OUTPUT: <h2><b><b>Huh?</b></b></h2>

    //  INTPUT: <h2><b><b><h2>Huh?</h2></b></b></h2>
    //  OUTPUT: <h2><b><b>Huh?</b></b></h2> (The Extra H2 Gets compressed by later code if I understand correctly)

    //  INTPUT: <b><h2><b><b><h2>Huh?</h2></b></b></h2></b>
    //  OUTPUT: <h2><b><b><b>Huh?</b></b></b></h2>

    //  This is the most extreme test case I did, but the code seems to handle it well
    /*  INTPUT:
      <b>Test
          <div>
              <b>Test2</b>
              <h2>Huh?</h2>
              <h3>OMG</h3>
              <b>
              <i>Thingy</i>
              </b>
          </div>
      </b>

      OUTPUTS AS:
      <b>Test</b>
      <div>
          <b>Test2</b>
          <h2><b>Huh?</b></h2>
          <h3><b>OMG</b></h3>
          <b><i>Thingy</i></b>
      </div>

      EVENTUALLY FORMATTED AS: // For some reason the DIV goes away? I think thats because of other clean effects?
      <p><b>Test</b><b>Test2</b></p>

      <h2><b>Huh?</b></h2>

      <h3><b>OMG</b></h3>
      <p><b><i>Thingy</i></b></p>
  */

    // Parchment.prototype.fixInlineWrappers = function (container) {

    //   var nodes = container.getElementsByTagName('*'),
    //       nodesThatWrap = [],
    //       i, node;

    //   // First grab every node that needs to be fixed
    //   for (i = 0; i < nodes.length; i++) {
    //     node = nodes[i];
    //     if (!this.isBlockElement(node) && !(this.style && this.style.display && this.style.display === 'block') && this.hasBlockChildren(node)) {
    //       nodesThatWrap.push(node);
    //     }
    //   }

    //   // Now fix every one of them
    //   for (i = 0; i < nodesThatWrap.length; i++) {
    //     node = nodesThatWrap[i];

    //     var blockNodes = node.getElementsByTagName('*'),
    //       j, blockNode, childNode, dup, dupChild;

    //     // replace all text nodes with wrapped versions of this node
    //     for (j = 0; j < node.childNodes.length; j++) {
    //       childNode = node.childNodes[j];
    //       // Text Node
    //       if (childNode.nodeType === 3) {
    //         dup = node.cloneNode(false);
    //         dupChild = childNode.cloneNode(false);
    //         dup.appendChild(dupChild);

    //         node.replaceChild(dup, childNode);
    //       }
    //     }

    //     // For every node that actually is a block node fix it.
    //     for (j = 0; j < blockNodes.length; j++) {
    //       blockNode = blockNodes[j];

    //       if (!this.isBlockElement(blockNode)) {
    //         continue;
    //       }

    //       // This block node has children block node, so only replace
    //       // the text elements of the block element not the children.
    //       if (this.hasBlockChildren(blockNode)) {
    //         var k;
    //         for (k = 0; k < blockNode.childNodes.length; k++) {
    //           childNode = blockNode.childNodes[k];
    //           // Text Node
    //           if (childNode.nodeType === 3) {
    //             dup = node.cloneNode(false);
    //             dupChild = childNode.cloneNode(false);

    //             dup.appendChild(dupChild);
    //             blockNode.replaceChild(dup, childNode);
    //           }
    //         }
    //       }
    //       // There are no block children of this child, so just wrap all children in the element
    //       else {
    //         dup = node.cloneNode(false);
    //         while (blockNode.firstChild) {
    //           dup.appendChild(blockNode.firstChild);
    //         }
    //         blockNode.appendChild(dup);
    //       }
    //     }

    //     // Move every child element out of the inline node and destroy it
    //     while (node.firstChild) {
    //       node.parentNode.insertBefore(node.firstChild, node);
    //     }
    //     node.parentNode.removeChild(node);
    //   }
    // };
