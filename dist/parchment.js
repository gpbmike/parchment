/*! Parchment - v0.1.0 - 2013-04-24
* https://github.com/gpbmike/parchment
* Copyright (c) 2013 gpbmike; Licensed MIT */
(function ($) {

  "use strict";

  var Parchment = (function () {

    var KEY_MAP = {
      UP       : 38,
      DOWN     : 40,
      LEFT     : 37,
      RIGHT    : 39,
      ESC      : 27,
      SPACE    : 32,
      BACKSPACE: 8,
      TAB      : 9,
      DELETE   : 46,
      ENTER    : 13,
      PAGE_UP  : 33,
      PAGE_DOWN: 34
    };

    function Parchment(target, options) {

      this.options = options || {};

      // Returns true if it is a DOM element

      function isElement(object) {
        return (
          typeof HTMLElement === "object" ? object instanceof HTMLElement : //DOM2
        object && typeof object === "object" && object.nodeType === 1 && typeof object.nodeName === "string");
      }

      // If target isn't an element, maybe it's an id
      if (!isElement(target) && typeof target === 'string') {
        target = document.getElementById(target);
      }

      // Couldn't find a target, abort.
      if (!target) {
        return;
      }

      this.parchment = document.createElement('div');
      this.parchment.setAttribute('id', 'parchment');
      this.parchment.setAttribute('class', 'parchment');

      target.parentNode.insertBefore(this.parchment, target);

      // we need both a textarea and an editor (contenteditable=true)
      if (/textarea/i.test(target.tagName)) {
        this.textarea = target;
        this.editor = document.createElement('div');
        this.editor.innerHTML = target.value;
      } else {
        this.editor = target;
        this.textarea = document.createElement('textarea');
        this.textarea.value = target.innerHTML;
      }

      this.textarea.style.display = 'none';

      this.parchment.appendChild(this.editor);
      this.parchment.appendChild(this.textarea);

      this.editor.setAttribute('class', 'parchment-editor');
      this.editor.setAttribute('contenteditable', 'true');

      // COMMANDS
      for (var command in Parchment.commands) {
        $.extend(true, this.options.parser_rules, Parchment.commands[command].parser_rules || {});
      }

      // // we strip out any attribute that's not in this list.
      // // key = tagName
      // // value = regular expression
      // this.attributes_whitelist = {};

      // // we strip out any empty node that's not in this list.
      // // key = tagName
      // // value = function returns true if you keep it
      // this.empty_node_whitelist = {
      //   'br': function () {
      //     return true;
      //   }
      // };

      // tag tree and node tree to see what you're nested in
      // this.node_tree = [];
      // this.tag_tree  = [];

      // this.observeEvents();
      // this.loadPlugins();
      // this.buildToolbar();

      // this.clean({
      //   add_paragraphs: true,
      //   first_clean: true
      // });

      // ping the document so other things know we're ready
      // $(document).trigger('parchmentready', this);

      // use semantic markup for commands
      // this comes last beause it stops the function for some reason
      // if (this.browser.mozilla || this.browser.webkit) {
      //   document.execCommand("styleWithCSS", false, false);
      //   document.execCommand("enableObjectResizing", false, false);
      // }
    }

    var createToolbarButton = function (plugin_name, plugin) {
      var button = document.createElement('button');
      button.setAttribute('type', 'button');
      button.setAttribute('class', 'btn btn-mini ' + plugin_name.replace(' ', '-').toLowerCase());
      button.setAttribute('title', plugin_name);
      button.appendChild(document.createTextNode(plugin_name));

      this.plugins[plugin_name].button = button;

      $(button).on('click', $.proxy(function (event) {
        event.preventDefault();
        plugin.callback(arguments);
      }, plugin));

      return button;
    };

    Parchment.prototype.buildToolbar = function () {
      this.toolbar = document.createElement('div');
      this.toolbar.setAttribute('class', 'toolbar');
      this.editor.parentNode.appendChild(this.toolbar);

      this.options.plugins_display = this.options.plugins_display || $.map(this.plugins, function (value, key) {
        return (value.type && value.type === 'button') ? key : null;
      });

      var showMore = function (event) {
        event.preventDefault();
        $(this.more_toolbar).toggleClass('open');
        $(this.more_toggle).toggleClass('open');

        if ($(this.more_toggle).hasClass('open')) {
          localStorage.setItem('parchmentmoreoptions', true);
        } else {
          localStorage.removeItem('parchmentmoreoptions');
        }

        // var padding_top = this.toolbar.offsetHeight;
        // if (this.more_toolbar) {
        //     padding_top += this.more_toolbar.offsetHeight;
        // }
        // this.parchment.style.paddingTop = padding_top + 'px';
      };

      for (var p = 0; p < this.options.plugins_display.length; p++) {

        var plugin_name = this.options.plugins_display[p],
          group = document.createElement('span');

        group.className = 'btn-group';

        // arrays are also objects, so check for Array first
        if (plugin_name instanceof Array) {

          for (var i = 0; i < plugin_name.length; i++) {
            group.appendChild(createToolbarButton.call(this, plugin_name[i], this.plugins[plugin_name[i]]));
          }

          this.toolbar.appendChild(group);
        } else if (plugin_name instanceof Object) {

          switch (plugin_name.type) {

          case 'dropdown':
            group.setAttribute('class', 'dropdown');
            var selection = document.createElement('button');
            selection.setAttribute('type', 'button');
            selection.appendChild(document.createTextNode('Paragraph'));
            group.appendChild(selection);
            var ul = document.createElement('ul');
            for (var b = 0; b < plugin_name.buttons.length; b++) {
              var li = document.createElement('li');
              li.appendChild(createToolbarButton.call(this, plugin_name.buttons[b], this.plugins[plugin_name.buttons[b]]));
              ul.appendChild(li);
            }
            group.appendChild(ul);
            this.toolbar.appendChild(group);
            break;

          case 'more':
            if (!this.more_toggle) {
              this.more_toggle = document.createElement('button');
              this.more_toggle.setAttribute('class', 'more');
              if (localStorage.getItem('parchmentmoreoptions')) {
                $(this.more_toggle).addClass('open');
              }
              this.more_toggle.setAttribute('type', 'button');
              if (this.toolbar.firstChild) {
                this.toolbar.insertBefore(this.more_toggle, this.toolbar.firstChild);
              } else {
                this.toolbar.appendChild(this.more_toggle);
              }
              this.more_toolbar = document.createElement('div');
              this.more_toolbar.setAttribute('class', 'toolbar more');
              if (localStorage.getItem('parchmentmoreoptions')) {
                $(this.more_toolbar).addClass('open');
              }
              this.editor.parentNode.appendChild(this.more_toolbar);

              $(this.more_toggle).on('click', $.proxy(showMore, this));
            }
            for (var b2 = 0; b2 < plugin_name.buttons.length; b2++) {
              group.appendChild(createToolbarButton.call(this, plugin_name.buttons[b2], this.plugins[plugin_name.buttons[b2]]));
            }
            this.more_toolbar.appendChild(group);
            break;

          default:
            break;
          }

        } else {
          this.toolbar.appendChild(createToolbarButton.call(this, plugin_name, this.plugins[plugin_name]));
        }

        // var padding_top = this.toolbar.offsetHeight;
        // if (this.more_toolbar) {
        //     this.more_toolbar.style.top = padding_top + 'px';
        //     padding_top += this.more_toolbar.offsetHeight;
        // }
        // this.parchment.style.paddingTop = padding_top + 'px';

      }
    };

    // Parchment.prototype.loadPlugins = function () {

    //   // create a new instance of each plugin we use
    //   this.plugins = {};
    //   for (var plugin in this.options.plugins) {
    //     this.plugins[plugin] = new this.options.plugins[plugin]();
    //   }

    //   for (var plugin_name in this.plugins) {

    //     var plugin = this.plugins[plugin_name],
    //       tag;

    //     plugin.parchment = this;

    //     if (plugin.init) {
    //       plugin.init();
    //     }

    //     // add to attribute whitelist
    //     if (plugin.attributes_whitelist) {

    //       // loop through tags
    //       for (tag in plugin.attributes_whitelist) {
    //         if (this.attributes_whitelist[tag]) {
    //           // loop through attributes
    //           for (var attribute in plugin.attributes_whitelist[tag]) {
    //             if (this.attributes_whitelist[tag][attribute]) {

    //               // see if we already have an array
    //               if (this.attributes_whitelist[tag][attribute] instanceof Array) {
    //                 this.attributes_whitelist[tag][attribute].push(plugin.attributes_whitelist[tag][attribute]);
    //               }

    //               // not an array of expressions
    //               else {
    //                 this.attributes_whitelist[tag][attribute] = [
    //                     this.attributes_whitelist[tag][attribute],
    //                     plugin.attributes_whitelist[tag][attribute]
    //                 ];
    //               }
    //             }

    //             // new attribute
    //             else {
    //               this.attributes_whitelist[tag][attribute] = plugin.attributes_whitelist[tag][attribute];
    //             }
    //           }
    //         }

    //         // new tag
    //         else {
    //           this.attributes_whitelist[tag] = plugin.attributes_whitelist[tag];
    //         }
    //       }
    //     }

    //     // add to empty node whitelist
    //     if (plugin.empty_node_whitelist) {

    //       // loop through tags
    //       for (tag in plugin.empty_node_whitelist) {
    //         if (this.empty_node_whitelist[tag]) {

    //           // see if we already have an array
    //           if (this.empty_node_whitelist[tag] instanceof Array) {
    //             this.empty_node_whitelist[tag].push(plugin.empty_node_whitelist[tag]);
    //           }

    //           // not an array of functions
    //           else {
    //             this.empty_node_whitelist[tag] = [
    //                 this.empty_node_whitelist[tag],
    //                 plugin.empty_node_whitelist[tag]
    //             ];
    //           }
    //         }

    //         // new tag
    //         else {
    //           this.empty_node_whitelist[tag] = plugin.empty_node_whitelist[tag];
    //         }
    //       }
    //     }
    //   }
    // };

    // fix the toolbar so it follows you down the page
    Parchment.prototype.fixToolbar = function () {

      var scroll         = $(window).scrollTop(),
          p_offset       = $(this.parchment).offset(),
          p_dimensions   = {
            'height': $(this.parchment).outerHeight(),
            'width' : $(this.parchment).outerWidth()
          },
          toolbar_height = this.toolbar.offsetHeight;

      if (this.more_toolbar) {
        toolbar_height += this.more_toolbar.offsetHeight;
      }

      // fix the toolbar(s) when you're below the top of the editor and above the bottom of the editor
      if (scroll > p_offset.top && scroll + toolbar_height < p_offset.top + p_dimensions.height) {
        $(this.toolbar).addClass('fixed');
        $(this.toolbar).css('width', p_dimensions.width - 2); // minus 2 for border... fix later
        if (this.more_toolbar) {
          $(this.more_toolbar).addClass('fixed');
          $(this.more_toolbar).css('width', p_dimensions.width - 2); // minus 2 for border... fix later
        }
      }

      // unfix the header when you're above the header
      else {
        $(this.toolbar).removeClass('fixed');
        this.toolbar.style.width = '100%';
        if (this.more_toolbar) {
          $(this.more_toolbar).removeClass('fixed');
          this.more_toolbar.style.width = '100%';
        }
      }
    };

    var handlePaste = function () {

      // we only care if you're pasting into the editor
      if (document.activeElement !== this.editor) {
        return;
      }

      var _this = this;

      // grab current content

      setTimeout(function () {

        // grab content after paste

        // compare new to old

        // figure out the new chunk

        // send new chunk to plugins

        // loop through the plugins to see if they care
        for (var index in _this.plugins) {
          var plugin = this.plugins[index];

          if (typeof plugin.handlePaste !== 'undefined') {
            plugin.handlePaste.apply(this);
          }
        }
        _this.clean({
          'add_paragraphs': true
        });

      }, 1);
    };

    // the keypress event is extended by jQuery
    var handleKeyPress = function (event) {

      var userSelection = this.getSelectionObject(),
        range = this.getRangeObject(userSelection),
        in_header = false,
        node = userSelection.anchorNode;

      // we want line breaks to be consistent across browsers
      if (event.which === KEY_MAP.ENTER) {

        // check if anchor node is in header
        while (node !== this.editor) {
          if ((/h\d/i).test(node.parentNode.tagName)) {
            in_header = true;
            break;
          }
          node = node.parentNode;
        }

        // check if focus node is in header
        if (!in_header) {
          node = userSelection.focusNode;

          while (node !== this.editor) {
            if ((/h\d/i).test(node.parentNode.tagName)) {
              in_header = true;
              break;
            }
            node = node.parentNode;
          }
        }

        // header tags are special, insert P before or after
        if (in_header) {

          // if user is highlighting something, kill it.
          if (!userSelection.isCollapsed) {
            document.execCommand('delete', false, false);
            userSelection = window.getSelection();
          }

          var header_node = node.parentNode,
            tmp = document.createElement('p');

          // at the beginning? add break before node
          if (userSelection.anchorOffset === 0) {
            this.editor.insertBefore(tmp, header_node);
          }

          // anywhere else, add after the node
          else {
            if (header_node.nextSibling) {
              this.editor.insertBefore(tmp, header_node.nextSibling);
            } else {
              this.editor.appendChild(tmp);
            }
          }

          // if you don't put something in the node, you won't be in it when selected
          tmp.innerHTML = '&nbsp;';

          range.setStartBefore(tmp);
          range.setEndBefore(tmp);
          userSelection.removeAllRanges();
          userSelection.addRange(range);

          // we manually added a break already, so stop here
          event.preventDefault();
          return;
        }

        // default behavior for lists works great.
        else if ((/^(li|ol|ul|blockquote)$/i).test(this.getParentBlockElement(userSelection.anchorNode).tagName)) {
          return;
        }

        // do a line break if you're not in a P tag.
        else if (!(/^p$/i).test(this.getParentBlockElement(userSelection.anchorNode).tagName)) {
          // webkit throws a <div> around the new line if it's at the end of the contentEditable node
          if (this.browser.webkit) {
            event.preventDefault();
            document.execCommand('insertLineBreak', false, false);
          }

          // IE uses <p>'s'
          else if (this.browser.msie) {
            event.preventDefault();
            document.selection.createRange().pasteHTML('<br>');
          }
          return;
        }

      }
    };

    // the keyup event is extended by jQuery
    var handleKeyUp = function (event) {

      // if you're moving around the editor, build the node tree so we know what buttons to turn on
      if ([KEY_MAP.BACKSPACE, KEY_MAP.DELETE, KEY_MAP.LEFT, KEY_MAP.UP, KEY_MAP.RIGHT, KEY_MAP.DOWN].indexOf(event.which) > -1) {
        this.buildNodeTree();
      }

      var userSelection = this.getSelectionObject(),
          range         = this.getRangeObject(userSelection),
          node          = userSelection.anchorNode,
          inCage        = false,
          inHeader      = false;

      if (!userSelection.anchorNode) {
        return;
      }

      // don't back into a cage or header
      if ([KEY_MAP.BACKSPACE, KEY_MAP.DELETE].indexOf(event.which) > -1) {
        while (node && node !== this.editor) {
          if (node.className && (/js-item-cage/i).test(node.className)) {
            inCage = node;
          }
          if (node.nodeName && (/h\d/i).test(node.nodeName)) {
            inHeader = node;
          }
          node = node.parentNode;
        }

        // PATCH NOTES: Out of curiosity, why do these two if conditions exist?
        // It causes weird behavior (if you delete text into a header it just
        // undo's it, which is weird). Does it fix a bug? Seems to work without em.

        // we jumped into a cage, undo and move before the cage
        if (!this.inCage && inCage) {
          document.execCommand('undo', false, false);
          if (inCage.previousSibling) {
            range.selectNodeContents(inCage.previousSibling);
            range.collapse(true);
            userSelection.removeAllRanges();
            userSelection.addRange(range);
          }
        }
        // we jumped into a header, undo and move to end of header
        if (!this.inHeader && inHeader) {
          document.execCommand('undo', false, false);
          range.collapse(true);
          userSelection.removeAllRanges();
          userSelection.addRange(range);
        }
      }

      // see if we should surround your text with a paragraph
      if (userSelection.anchorNode.nodeType === window.Node.TEXT_NODE && (userSelection.anchorNode.parentNode === this.editor)) {
        document.execCommand('formatblock', false, '<P>');
        range.setStartAfter(userSelection.anchorNode);
        range.setEndAfter(userSelection.anchorNode);
        userSelection.removeAllRanges();
        userSelection.addRange(range);
      }

      this.saveSelection();
    };

    // the keydown event is extended by jQuery
    var handleKeyDown = function (event) {

      // stop user from tabbing out of parchment
      if (event.which === KEY_MAP.TAB) {
        event.preventDefault();
      }

      // control/command + left/right in FF goes forward/back in browser
      else if (this.browser.mozilla && (event.metaKey || event.ctrlKey) && [KEY_MAP.LEFT, KEY_MAP.RIGHT].indexOf(event.which) > -1) {
        event.preventDefault();
      }

      // undo/redo
      else if ((event.metaKey || event.ctrlKey) && String.fromCharCode(event.which) === 'Z') {
        event.preventDefault();
        if (event.shiftKey) {
          //MSDN Claims IE doesn't support REDO, but comments seem to suggest it has from 5.5
          // Can't get it to work right on IE, just seems to move the cursor without working. Not sure if there is a fix
          document.execCommand('redo', null, null);
        } else {
          document.execCommand('undo', null, null);
        }
      }

      // we don't want to back into a cage
      else if ([KEY_MAP.BACKSPACE, KEY_MAP.DELETE].indexOf(event.which) > -1) {
        this.inCage   = false;
        this.inHeader = false;
        var userSelection = this.getSelectionObject(),
            node          = userSelection.anchorNode;

        while (node && node !== this.editor) {
          if (node.className && (/js-item-cage/i).test(node.className)) {
            this.inCage = true;
          }
          if (node.nodeName && (/h\d/i).test(node.nodeName)) {
            this.inHeader = true;
          }
          node = node.parentNode;
        }

      }
    };

    var handleMouseUp = function () {
      this.buildNodeTree();
      this.saveSelection();
    };

    // simulate scrolling
    function simulateScroll(event) {

      window.console.log(event);

      // If the key wasn't pressed on the document itself, then dont bother
      if (event.originalTarget !== document.documentElement) {
        return;
      }

      var keyCode = event.keyCode || event.charCode,
        isShift = event.shiftKey === true,
        isCtrl = event.ctrlKey === true,
        isAlt = event.altKey === true,
        isMeta = event.metaKey === true,
        isModified = isShift || isCtrl || isAlt || isMeta;

      function doScroll(delta) {
        event.preventDefault();
        event.stopPropagation();
        window.scrollBy(0, delta);
        window.console.log(delta);
      }

      // This is how much it moves on a space/pageDown or opposite, almost whole page.
      var nearScreenHeight = Math.round(0.9 * window.innerHeight);
      // This is the distance in pixels it moves up and down
      var arrow_delta = 50;

      // Up is pressed with no modifiers
      if (keyCode === KEY_MAP.UP && !isModified) {
        doScroll(event, -arrow_delta);
        return;
      }

      // Down is pressed with no modifiers
      if (keyCode === KEY_MAP.DOWN && !isModified) {
        doScroll(event, arrow_delta);
        return;
      }

      // pageUp is pressed with no modifiers
      if (keyCode === KEY_MAP.PAGE_UP && !isModified) {
        doScroll(event, -nearScreenHeight);
        return;
      }

      // pageDown is pressed with no modifiers
      if (keyCode === KEY_MAP.PAGE_DOWN && !isModified) {
        doScroll(event, nearScreenHeight);
        return;
      }

      // space is pressed with shift pressed
      if (keyCode === KEY_MAP.SPACE && isShift && !isCtrl && !isAlt && !isMeta) {
        doScroll(event, -nearScreenHeight);
        return;
      }

      // space is pressed with shift pressed
      if (keyCode === KEY_MAP.SPACE && !isModified) {
        doScroll(event, nearScreenHeight);
        return;
      }
    }

    // watch the editor for events
    Parchment.prototype.observeEvents = function () {

      // What happens in parchment stays in parchment.
      var stopPopagation = function (event) {
        $(this).trigger('parchment.' + event.type, event);
        event.stopPropagation();
      };

      $(this.parchment).on({
        keypress: stopPopagation,
        keydown : stopPopagation,
        keyup   : stopPopagation
      });

      $(this.editor).on({
        keypress: $.proxy(handleKeyPress, this),
        keyup   : $.proxy(handleKeyUp, this),
        keydown : $.proxy(handleKeyDown, this),
        mouseup : $.proxy(handleMouseUp, this)
      });

      $(document).on({
        scroll: $.proxy(this.fixToolbar, this),
        paste : $.proxy(handlePaste, this)
      });

      // This check is borrowed from the internet, Im not sure if this browser check is incorrect
      // Since I never have to do that, but if its glaringly incorrect to you... replace it
      if (this.browser.mozilla) {
        $(document).on("keypress", $.proxy(simulateScroll, this));
      }

      // An outside function can fire an event called 'submit' on the form this rte lives in.
      $(this.textarea.form).on('submit', $.proxy(function () {
        this.editor.focus();
        this.clean();
        this.editor.blur();
      }, this));
    };

    // wrap childNodes in paragraphs
    Parchment.prototype.addParagraphs = function (container) {

      var node = container.firstChild,
        p = false;

      while (node) {
        if (this.isBlockElement(node)) {
          p = false;
          if (node.nodeName.toLowerCase() === 'br') {
            var br = node;
            node = node.nextSibling;
            br.parentNode.removeChild(br);
            continue;
          }

          // if there's a BR in the paragraph, move everything out of the paragraph and clean it properly
          if (node.nodeName.toLowerCase() === 'p' && node.getElementsByTagName('br').length > 0) {

            // add a br after the p to separate it from next content
            if (node.nextSibling) {
              node.parentNode.insertBefore(document.createElement('br'), node.nextSibling);
            } else {
              node.parentNode.appendChild(document.createElement('br'));
            }

            // move all of the children out of the paragraph
            while (node.lastChild) {
              if (node.nextSibling) {
                node.parentNode.insertBefore(node.lastChild, node.nextSibling);
              } else {
                node.parentNode.appendChild(node.lastChild);
              }
            }
            continue;

          }

        } else {
          if (!p) {
            p = document.createElement('p');
            node.parentNode.insertBefore(p, node);
          }
          p.appendChild(node);
        }
        node = p ? p.nextSibling : node.nextSibling;
      }
    };


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

    Parchment.prototype.fixInlineWrappers = function (container) {

      var nodes = container.getElementsByTagName('*'),
          nodesThatWrap = [],
          i, node;

      // First grab every node that needs to be fixed
      for (i = 0; i < nodes.length; i++) {
        node = nodes[i];
        if (!this.isBlockElement(node) && !(this.style && this.style.display && this.style.display === 'block') && this.hasBlockChildren(node)) {
          nodesThatWrap.push(node);
        }
      }

      // Now fix every one of them
      for (i = 0; i < nodesThatWrap.length; i++) {
        node = nodesThatWrap[i];

        var blockNodes = node.getElementsByTagName('*'),
          j, blockNode, childNode, dup, dupChild;

        // replace all text nodes with wrapped versions of this node
        for (j = 0; j < node.childNodes.length; j++) {
          childNode = node.childNodes[j];
          // Text Node
          if (childNode.nodeType === 3) {
            dup = node.cloneNode(false);
            dupChild = childNode.cloneNode(false);
            dup.appendChild(dupChild);

            node.replaceChild(dup, childNode);
          }
        }

        // For every node that actually is a block node fix it.
        for (j = 0; j < blockNodes.length; j++) {
          blockNode = blockNodes[j];

          if (!this.isBlockElement(blockNode)) {
            continue;
          }

          // This block node has children block node, so only replace
          // the text elements of the block element not the children.
          if (this.hasBlockChildren(blockNode)) {
            var k;
            for (k = 0; k < blockNode.childNodes.length; k++) {
              childNode = blockNode.childNodes[k];
              // Text Node
              if (childNode.nodeType === 3) {
                dup = node.cloneNode(false);
                dupChild = childNode.cloneNode(false);

                dup.appendChild(dupChild);
                blockNode.replaceChild(dup, childNode);
              }
            }
          }
          // There are no block children of this child, so just wrap all children in the element
          else {
            dup = node.cloneNode(false);
            while (blockNode.firstChild) {
              dup.appendChild(blockNode.firstChild);
            }
            blockNode.appendChild(dup);
          }
        }

        // Move every child element out of the inline node and destroy it
        while (node.firstChild) {
          node.parentNode.insertBefore(node.firstChild, node);
        }
        node.parentNode.removeChild(node);
      }
    };

    Parchment.prototype.hasBlockChildren = function (node) {

      var nodes = node.getElementsByTagName('*'),
          hasBlockChildren = false,
          i;

      for (i = 0; i < nodes.length; i++) {
        node = nodes[i];
        if (this.isBlockElement(node) || (this.style && this.style.display && this.style.display === 'block')) {
          hasBlockChildren = true;
          break;
        }
      }

      return hasBlockChildren;
    };

    // walks down the tree to find the deepest block element
    Parchment.prototype.getInlineParent = function (node) {

      while (node !== null && this.isBlockElement(node)) {
        node = node.parentNode;
      }

      return node;
    };

    Parchment.prototype.isBlockElement = function (node) {
      return (/^(ADDRESS|BLOCKQUOTE|BR|DIV|DL|FIELDSET|FORM|H1|H2|H3|H4|H5|H6|HR|OL|P|PRE|TABLE|UL|DD|DT|LI|TBODY|TD|TFOOT|TH|THEAD|TR|OBJECT|EMBED)$/i).test(node.nodeName);
    };

    // walk up the tree and return the first parentNode that's a natural block element
    Parchment.prototype.getParentBlockElement = function (node) {

      while (!this.isBlockElement(node)) {
        node = node.parentNode;
      }

      return node;
    };

    // selects the entire block that you're in
    Parchment.prototype.selectBlock = function () {

      // get current selection and range
      var selection = this.getSelectionObject(),
        range = this.getRangeObject(selection);

      range.setStart(range.startContainer, 0);

      // move range up to highest inline element
      while (!this.isBlockElement(range.startContainer.parentNode)) {
        range.setStart(range.startContainer.parentNode, 0);
      }

      // walk back until you get to a br or parent
      while (range.startContainer.previousSibling && !this.isBlockElement(range.startContainer.previousSibling)) {
        range.setStart(range.startContainer.previousSibling, 0);
      }

      // if you triple click, the end container will be the editor so the walking won't work
      // doesn't matter because you will have selected the block anyway, so skip this

      if (range.endContainer !== this.editor) {
        range.setEnd(range.endContainer, range.endContainer.length);
        while (!this.isBlockElement(range.endContainer.parentNode)) {
          range.setEnd(range.endContainer.parentNode, range.endContainer.parentNode.length);
        }
        // walk forward until you get to a br or parent
        while (range.endContainer.nextSibling && !this.isBlockElement(range.endContainer.nextSibling)) {
          range.setEnd(range.endContainer.nextSibling, range.endContainer.nextSibling.length);
        }
      }

      // set selection to new range
      selection.removeAllRanges();
      selection.addRange(range);
    };

    // Cross browser insertHTML
    // restore focus and selection to the editor so you insert in the correct spot automatically
    Parchment.prototype.insertHTML = function (html) {

      if (!html) {
        return;
      }

      // FF needs the editor to be in focus before it will insert anything
      this.editor.focus();

      // bring carot back to where the user left off
      this.restoreSelection();

      // Internet Explorer
      if (this.browser.msie) {
        document.selection.createRange().pasteHTML(html);
      }

      // everything else
      else {
        document.execCommand('insertHTML', false, html);
      }

      this.saveSelection();
    };

    // Method to wrap embed in uniform syntax
    Parchment.prototype.wrapEmbed = function (html, type, className) {

      var embed_class = 'embed-cage';

      if (type) {
        embed_class += ' embed-type-' + type;
      }

      if (className) {
        embed_class += ' ' + className;
      }

      // add wrapper
      html = '<div class="' + embed_class + '">' + html + '</div>';

      return html;
    };

    // Method to insert a cage. Insert at top level of editor or TD/LI
    Parchment.prototype.insertCage = function (html) {

      this.restoreSelection();

      var userSelection = this.getSelectionObject(),
        range = this.getRangeObject(userSelection),
        // without a shiv cages will be in paragraphs
        shiv = document.createElement('br');

      range.collapse(true);

      var node = range.startContainer,
        testnode = node;

      // make sure we're in the editor
      while (testnode.parentNode) {
        if (testnode === this.editor) {
          break;
        } else if (testnode === document.body) {
          node = this.editor;
          break;
        }
        testnode = testnode.parentNode;
      }

      // move up to the top level (editor, TD, or LI)
      while (node !== this.editor && !(/^td|li$/i).test(node.nodeName) && node.parentNode !== this.editor && !(/^td|li$/i).test(node.parentNode.nodeName)) {
        node = node.parentNode;
      }

      // move to before any inline elements
      while (!this.isBlockElement(node) && node.previousSibling && !this.isBlockElement(node.previousSibling)) {
        node = node.previousSibling;
      }

      // insert before P, after everything else
      if (node.nodeType === window.Node.TEXT_NODE || (/p/i).test(node.tagName)) {
        node.parentNode.insertBefore(shiv, node);
        range.setStartBefore(shiv);
        range.setEndBefore(shiv);
      } else if (node === this.editor) {
        node.appendChild(shiv);
        range.setStart(node, 0);
        range.setEnd(node, 0);
      } else {
        if (node.nextSibling) {
          node.parentNode.insertBefore(shiv, node.nextSibling);
        } else {
          node.parentNode.appendChild(shiv);
        }
        range.setStartAfter(shiv);
        range.setEndAfter(shiv);
      }

      // move below headers
      while (node.nodeType === window.Node.ELEMENT_NODE && (/^h\d$/i).test(node.tagName)) {
        range.setStartAfter(node);
        range.setEndAfter(node);
        node = node.getNext();
        if (!node) {
          break;
        }
      }

      userSelection.removeAllRanges();
      userSelection.addRange(range);

      this.saveSelection();

      // Need to surround cage with paragraphs or you can't type above/below
      if (node.parentNode === this.editor) {
        if (!node.previousSibling || !(/p/i).test(node.previousSibling.tagName)) {
          html = '<p>&nbsp;</p>' + html;
        }
        if (!node.nextSibling || !(/p/i).test(node.nextSibling.tagName)) {
          html = html + '<p>&nbsp;</p>';
        }
        // the two paragraphs following an insert will collapse into each other without this
        else if ((/p/i).test(node.nextSibling.tagName)) {
          html = html + '<p></p>';
        }
      }

      this.insertHTML(html);

      // remove the shiv if it's still around
      try {
        shiv.parentNode.removeChild(shiv);
      } catch (error) {
        // shiv not around?
      }
    };

    Parchment.prototype.buildNodeTree = function () {

      var userSelection = this.getSelectionObject(),
          node          = userSelection.anchorNode;

      if (!node) {
        return;
      }

      this.node_tree = [];
      this.tag_tree = [];

      while (node !== this.editor) {
        this.node_tree.push(node);
        this.tag_tree.push(node.nodeName);
        node = node.parentNode;
        if (node === document) {
          this.node_tree = [];
          this.tag_tree = [];
          break;
        }
      }

      $(this.editor).trigger('nodetreechange', [this.tag_tree, this.node_tree]);
    };

    return Parchment;

  })();

  // Global API
  window.Parchment = Parchment;

  // IE doesn't support Node
  if (!window['Node']) {
    window.Node                             = {};
    window.Node.ELEMENT_NODE                = 1;
    window.Node.ATTRIBUTE_NODE              = 2;
    window.Node.TEXT_NODE                   = 3;
    window.Node.CDATA_SECTION_NODE          = 4;
    window.Node.ENTITY_REFERENCE_NODE       = 5;
    window.Node.ENTITY_NODE                 = 6;
    window.Node.PROCESSING_INSTRUCTION_NODE = 7;
    window.Node.COMMENT_NODE                = 8;
    window.Node.DOCUMENT_NODE               = 9;
    window.Node.DOCUMENT_TYPE_NODE          = 10;
    window.Node.DOCUMENT_FRAGMENT_NODE      = 11;
    window.Node.NOTATION_NODE               = 12;
  }

  // IE doesn't support console
  if (!window['console']) {
    window.console = {
      log: function () {}
    };
  }




  /* PARCHMENT PLUGIN DEFINITION
   * =========================== */

  $.fn.parchment = function (option) {
    return this.each(function () {
      var $this = $(this),
        data = $this.data('parchment');
      if (!data) {
        $this.data('parchment', (data = new Parchment(this, $.extend({}, $.fn.parchment.defaults, option))));
      }
      if (typeof option === 'string') {
        data[option].call($this);
      }
    });
  };

  $.fn.parchment.Constructor = Parchment;

  $.fn.parchment.defaults = {
    plugins: Parchment.Plugins,
    plugins_display: [
      ['Bold', 'Italic', 'Underline', 'Strikethrough'],
      ['Unordered List', 'Ordered List'],
      ['Remove Format', 'Clean']
    ],
    parser_rules: {
      tags: {
        br: {}
      }
    }
  };


  /* PARCHMENT DATA-API
   * ================== */

  $("[data-rte='parchment']").each(function () {
    $(this).parchment($(this).data());
  });


}(jQuery));

(function(Parchment) {

  "use strict";

  var commands = {},
      docExec = function (commandName, showDefaultUI, value) {
        document.execCommand(commandName, showDefaultUI || null, value || null);
      };

  // <strong>
  // <b> => <strong>
  commands.bold = {
    exec: function () {
      docExec('bold');
    },
    state: function () {

    },
    parser_rules: {
      tags: {
        strong: {},
        b: {
          rename_tag: "strong"
        }
      }
    }
  };

  // <em>
  // <i> => <em>
  commands.italic = {
    exec: function () {
      docExec('italic');
    },
    state: function () {

    },
    parser_rules: {
      tags: {
        em: {},
        i: {
          rename_tag: "em"
        }
      }
    }
  };

  // <u>
  commands.underline = {
    exec: function () {
      docExec('underline');
    },
    state: function () {

    },
    parser_rules: {
      tags: {
        u: {}
      }
    }
  };

  // <strike>
  commands.strikethrough = {
    exec: function () {
      docExec('striketrhough');
    },
    state: function () {

    },
    parser_rules: {
      tags: {
        strike: {}
      }
    }
  };

  // Global API
  Parchment.commands = commands;

})(Parchment);

/*
// these are built in commands that we can use
Parchment.Plugins = {
  'Bold': function () {

    window.console.log(this);

    function Bold () {
      var _this = this;
      $(this.parchment.editor).on({
        'keydown': function (event) {
          if ((event.metaKey || event.ctrlKey) && String.fromCharCode(event.which) === 'B') {
            event.preventDefault();
            docExec('bold');
            $(_this.button).toggleClass('on');
          }
        },
        'nodetreechange': function (event, tag_tree) {
          if (tag_tree.indexOf('B') > -1 || tag_tree.indexOf('STRONG') > -1) {
            $(_this.button).addClass('on');
          } else {
            $(_this.button).removeClass('on');
          }
        }
      });
    }

    Bold.parser_rules = {
    };

    return Bold;

    // return {
    //   'type': 'button',
    //   'init': function () {

    //   },
    //   'callback': function () {
    //     docExec('bold');
    //     $(this.button).toggleClass('on');
    //   },
    // };
  },
    'Italic': function () {
        return {
            'type': 'button',
            'init': function () {
                var _this = this;
                $(this.parchment.editor).on({
                    'keydown': function (event) {
                        if ((event.metaKey || event.ctrlKey) && String.fromCharCode(event.which) === 'I') {
                            event.preventDefault();
                            docExec('italic');
                            $(_this.button).toggleClass('on');
                        }
                    },
                    'nodetreechange': function (event, tag_tree) {
                        if (tag_tree.indexOf('I') > -1 || tag_tree.indexOf('EM') > -1) {
                            $(_this.button).addClass('on');
                        } else {
                            $(_this.button).removeClass('on');
                        }
                    }
                });
            },
            'callback': function () {
                docExec('italic');
                $(this.button).toggleClass('on');
            },
            parser_rules: {
              tags: {
                em: {},
                i: {
                  rename_tag: "em"
                }
              }
            }
        };
    },
    'Underline': function () {
        return {
            'type': 'button',
            'init': function () {
                // PATCH NOTES: Same as above, the button does not toggle when you press CTRL-U
                var _this = this;
                $(this.parchment.editor).on({
                    'keydown': function (event) {
                        if ((event.metaKey || event.ctrlKey) && String.fromCharCode(event.which) === 'U') {
                            event.preventDefault();
                            docExec('underline');
                            $(_this.button).toggleClass('on');
                        }
                    },
                    'nodetreechange': function (event, tag_tree) {
                        if (tag_tree.indexOf('U') > -1) {
                            $(_this.button).addClass('on');
                        } else {
                            $(_this.button).removeClass('on');
                        }
                    }
                });
            },
            'callback': function () {
                docExec('underline');
                $(this.button).toggleClass('on');
            },
            parser_rules: {
              tags: {
                u: {}
              }
            }
        };
    },
    'Strikethrough': function () {
        return {
            'type': 'button',
            'init': function () {
                var _this = this;
                $(this.parchment.editor).on({
                    'nodetreechange': function (event, tag_tree) {
                        if (tag_tree.indexOf('STRIKE') > -1) {
                            $(_this.button).addClass('on');
                        } else {
                            $(_this.button).removeClass('on');
                        }
                    }
                });
            },
            'callback': function () {
                docExec('strikethrough');
                $(this.button).toggleClass('on');
            },
            parser_rules: {
              tags: {
                strike: {}
              }
            }
        };
    },
    'Ordered List': function () {
        return {
            'type': 'button',
            'init': function () {
                var _this = this;
                $(this.parchment.editor).on({
                    'nodetreechange': function (event, tag_tree) {
                        if (tag_tree.indexOf('OL') > -1) {
                            $(_this.button).addClass('on');
                        } else {
                            $(_this.button).removeClass('on');
                        }
                    }
                });
            },
            'callback': function () {
                docExec('insertOrderedList');
                this.parchment.buildNodeTree();
            },
            parser_rules: {
              tags: {
                ol: {},
                li: {}
              }
            }
        };
    },
    'Unordered List': function () {
        return {
            'type': 'button',
            'init': function () {
                var _this = this;
                $(this.parchment.editor).on({
                    'nodetreechange': function (event, tag_tree) {
                        if (tag_tree.indexOf('UL') > -1) {
                            $(_this.button).addClass('on');
                        } else {
                            $(_this.button).removeClass('on');
                        }
                    }
                });
            },
            'callback': function () {
                docExec('insertUnorderedList');
                this.parchment.buildNodeTree();
            },
            parser_rules: {
              tags: {
                ul: {},
                li: {}
              }
            }
        };
    },
    'Remove Format': function () {
        return {
            'type': 'button',
            'callback': function () {
                docExec('removeFormat');
                this.parchment.buildNodeTree();
            }
        };
    },
    'Clean': function () {
        return {
            'type': 'button',
            'callback': function () {
                this.parchment.clean({'add_paragraphs': true});
            }
        };
    }
};
*/

(function(Parchment){

  "use strict";

  var parser_rules;

  Parchment.parser = (function() {

    function parser(parchment) {

      window.console.log(parchment);

    }

    return parser;

  })();

  function _convert(dirtyNode) {

    window.console.log(parser_rules);

    return dirtyNode;
  }

  Parchment.parse = function(elementOrHtml, rules) {

    parser_rules = rules || {};

    var fragment      = document.createDocumentFragment(),
        isString      = typeof(elementOrHtml) === "string",
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

//       // google docs puts styles on SPAN/B tags
//       // translate some of those into elements
//       if (node.getAttribute('style')) {
//         var g_element = null;
//         if (tagName === 'span') {
//           if (node.style.fontStyle === 'italic') {
//             g_element = document.createElement('i');
//             node.parentNode.insertBefore(g_element, node);
//             g_element.appendChild(node);
//           }
//           if (node.style.fontWeight === 'bold') {
//             g_element = document.createElement('b');
//             node.parentNode.insertBefore(g_element, node);
//             g_element.appendChild(node);
//           }
//           if (node.style.textDecoration === 'line-through') {
//             g_element = document.createElement('strike');
//             node.parentNode.insertBefore(g_element, node);
//             g_element.appendChild(node);
//           }
//           if (node.style.textDecoration === 'underline') {
//             g_element = document.createElement('u');
//             node.parentNode.insertBefore(g_element, node);
//             g_element.appendChild(node);
//           }
//         } else if (tagName === 'b' && node.style.fontWeight === 'normal') {
//           var new_node = document.createElement('span');
//           new_node.innerHTML = node.innerHTML;
//           node.parentNode.insertBefore(new_node, node);
//           node.parentNode.removeChild(node);
//           node = new_node;
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

(function(Parchment) {
  "use strict";

  /**
   * Detect browser support for specific features
   */
  Parchment.browser = (function() {
    var userAgent   = navigator.userAgent,
        testElement = document.createElement("div"),
        // Browser sniffing is unfortunately needed since some behaviors are impossible to feature detect
        isIE        = userAgent.indexOf("MSIE")         !== -1 && userAgent.indexOf("Opera") === -1,
        isGecko     = userAgent.indexOf("Gecko")        !== -1 && userAgent.indexOf("KHTML") === -1,
        isWebKit    = userAgent.indexOf("AppleWebKit/") !== -1,
        isChrome    = userAgent.indexOf("Chrome/")      !== -1,
        isOpera     = userAgent.indexOf("Opera/")       !== -1;

    function iosVersion(userAgent) {
      return +((/ipad|iphone|ipod/.test(userAgent) && userAgent.match(/ os (\d+).+? like mac os x/)) || [null, 0])[1];
    }

    function androidVersion(userAgent) {
      return +(userAgent.match(/android (\d+)/) || [null, 0])[1];
    }

    return {
      // Static variable needed, publicly accessible, to be able override it in unit tests
      USER_AGENT: userAgent,

      /**
       * Exclude browsers that are not capable of displaying and handling
       * contentEditable as desired:
       *    - iPhone, iPad (tested iOS 4.2.2) and Android (tested 2.2) refuse to make contentEditables focusable
       *    - IE < 8 create invalid markup and crash randomly from time to time
       *
       * @return {Boolean}
       */
      supported: function() {
        var userAgent                   = this.USER_AGENT.toLowerCase(),
            // Essential for making html elements editable
            hasContentEditableSupport   = "contentEditable" in testElement,
            // Following methods are needed in order to interact with the contentEditable area
            hasEditingApiSupport        = document.execCommand && document.queryCommandSupported && document.queryCommandState,
            // document selector apis are only supported by IE 8+, Safari 4+, Chrome and Firefox 3.5+
            hasQuerySelectorSupport     = document.querySelector && document.querySelectorAll,
            // contentEditable is unusable in mobile browsers (tested iOS 4.2.2, Android 2.2, Opera Mobile, WebOS 3.05)
            isIncompatibleMobileBrowser = (this.isIos() && iosVersion(userAgent) < 5) || (this.isAndroid() && androidVersion(userAgent) < 4) || userAgent.indexOf("opera mobi") !== -1 || userAgent.indexOf("hpwos/") !== -1;
        return hasContentEditableSupport && hasEditingApiSupport && hasQuerySelectorSupport && !isIncompatibleMobileBrowser;
      },

      isTouchDevice: function() {
        return this.supportsEvent("touchmove");
      },

      isIos: function() {
        return (/ipad|iphone|ipod/i).test(this.USER_AGENT);
      },

      isAndroid: function() {
        return this.USER_AGENT.indexOf("Android") !== -1;
      },

      /**
       * Whether the browser supports sandboxed iframes
       * Currently only IE 6+ offers such feature <iframe security="restricted">
       *
       * http://msdn.microsoft.com/en-us/library/ms534622(v=vs.85).aspx
       * http://blogs.msdn.com/b/ie/archive/2008/01/18/using-frames-more-securely.aspx
       *
       * HTML5 sandboxed iframes are still buggy and their DOM is not reachable from the outside (except when using postMessage)
       */
      supportsSandboxedIframes: function() {
        return isIE;
      },

      /**
       * IE6+7 throw a mixed content warning when the src of an iframe
       * is empty/unset or about:blank
       * window.querySelector is implemented as of IE8
       */
      throwsMixedContentWarningWhenIframeSrcIsEmpty: function() {
        return !("querySelector" in document);
      },

      /**
       * Whether the caret is correctly displayed in contentEditable elements
       * Firefox sometimes shows a huge caret in the beginning after focusing
       */
      displaysCaretInEmptyContentEditableCorrectly: function() {
        return isIE;
      },

      /**
       * Opera and IE are the only browsers who offer the css value
       * in the original unit, thx to the currentStyle object
       * All other browsers provide the computed style in px via window.getComputedStyle
       */
      hasCurrentStyleProperty: function() {
        return "currentStyle" in testElement;
      },

      /**
       * Firefox on OSX navigates through history when hitting CMD + Arrow right/left
       */
      hasHistoryIssue: function() {
        return isGecko && navigator.platform.substr(0, 3) === "Mac";
      },

      /**
       * Whether the browser inserts a <br> when pressing enter in a contentEditable element
       */
      insertsLineBreaksOnReturn: function() {
        return isGecko;
      },

      supportsPlaceholderAttributeOn: function(element) {
        return "placeholder" in element;
      },

      supportsEvent: function(eventName) {
        return "on" + eventName in testElement || (function() {
          testElement.setAttribute("on" + eventName, "return;");
          return typeof(testElement["on" + eventName]) === "function";
        })();
      },

      /**
       * Opera doesn't correctly fire focus/blur events when clicking in- and outside of iframe
       */
      supportsEventsInIframeCorrectly: function() {
        return !isOpera;
      },

      /**
       * Everything below IE9 doesn't know how to treat HTML5 tags
       *
       * @param {Object} context The document object on which to check HTML5 support
       *
       * @example
       *    wysihtml5.browser.supportsHTML5Tags(document);
       */
      supportsHTML5Tags: function(context) {
        var element = context.createElement("div"),
            html5   = "<article>foo</article>";
        element.innerHTML = html5;
        return element.innerHTML.toLowerCase() === html5;
      },

      /**
       * Checks whether a document supports a certain queryCommand
       * In particular, Opera needs a reference to a document that has a contentEditable in it's dom tree
       * in oder to report correct results
       *
       * @param {Object} doc Document object on which to check for a query command
       * @param {String} command The query command to check for
       * @return {Boolean}
       *
       * @example
       *    wysihtml5.browser.supportsCommand(document, "bold");
       */
      supportsCommand: (function() {
        // Following commands are supported but contain bugs in some browsers
        var buggyCommands = {
          // formatBlock fails with some tags (eg. <blockquote>)
          "formatBlock":          isIE,
           // When inserting unordered or ordered lists in Firefox, Chrome or Safari, the current selection or line gets
           // converted into a list (<ul><li>...</li></ul>, <ol><li>...</li></ol>)
           // IE and Opera act a bit different here as they convert the entire content of the current block element into a list
          "insertUnorderedList":  isIE || isWebKit,
          "insertOrderedList":    isIE || isWebKit
        };

        // Firefox throws errors for queryCommandSupported, so we have to build up our own object of supported commands
        var supported = {
          "insertHTML": isGecko
        };

        return function(doc, command) {
          var isBuggy = buggyCommands[command];
          if (!isBuggy) {
            // Firefox throws errors when invoking queryCommandSupported or queryCommandEnabled
            try {
              return doc.queryCommandSupported(command);
            } catch(e1) {}

            try {
              return doc.queryCommandEnabled(command);
            } catch(e2) {
              return !!supported[command];
            }
          }
          return false;
        };
      })(),

      /**
       * IE: URLs starting with:
       *    www., http://, https://, ftp://, gopher://, mailto:, new:, snews:, telnet:, wasis:, file://,
       *    nntp://, newsrc:, ldap://, ldaps://, outlook:, mic:// and url:
       * will automatically be auto-linked when either the user inserts them via copy&paste or presses the
       * space bar when the caret is directly after such an url.
       * This behavior cannot easily be avoided in IE < 9 since the logic is hardcoded in the mshtml.dll
       * (related blog post on msdn
       * http://blogs.msdn.com/b/ieinternals/archive/2009/09/17/prevent-automatic-hyperlinking-in-contenteditable-html.aspx).
       */
      doesAutoLinkingInContentEditable: function() {
        return isIE;
      },

      /**
       * As stated above, IE auto links urls typed into contentEditable elements
       * Since IE9 it's possible to prevent this behavior
       */
      canDisableAutoLinking: function() {
        return this.supportsCommand(document, "AutoUrlDetect");
      },

      /**
       * IE leaves an empty paragraph in the contentEditable element after clearing it
       * Chrome/Safari sometimes an empty <div>
       */
      clearsContentEditableCorrectly: function() {
        return isGecko || isOpera || isWebKit;
      },

      /**
       * IE gives wrong results for getAttribute
       */
      supportsGetAttributeCorrectly: function() {
        var td = document.createElement("td");
        return td.getAttribute("rowspan") !== "1";
      },

      /**
       * When clicking on images in IE, Opera and Firefox, they are selected, which makes it easy to interact with them.
       * Chrome and Safari both don't support this
       */
      canSelectImagesInContentEditable: function() {
        return isGecko || isIE || isOpera;
      },

      /**
       * All browsers except Safari and Chrome automatically scroll the range/caret position into view
       */
      autoScrollsToCaret: function() {
        return !isWebKit;
      },

      /**
       * Check whether the browser automatically closes tags that don't need to be opened
       */
      autoClosesUnclosedTags: function() {
        var clonedTestElement = testElement.cloneNode(false),
            returnValue,
            innerHTML;

        clonedTestElement.innerHTML = "<p><div></div>";
        innerHTML                   = clonedTestElement.innerHTML.toLowerCase();
        returnValue                 = innerHTML === "<p></p><div></div>" || innerHTML === "<p><div></div></p>";

        // Cache result by overwriting current function
        this.autoClosesUnclosedTags = function() { return returnValue; };

        return returnValue;
      },

      /**
       * Whether the browser supports the native document.getElementsByClassName which returns live NodeLists
       */
      supportsNativeGetElementsByClassName: function() {
        return String(document.getElementsByClassName).indexOf("[native code]") !== -1;
      },

      /**
       * As of now (19.04.2011) only supported by Firefox 4 and Chrome
       * See https://developer.mozilla.org/en/DOM/Selection/modify
       */
      supportsSelectionModify: function() {
        return "getSelection" in window && "modify" in window.getSelection();
      },

      /**
       * Opera needs a white space after a <br> in order to position the caret correctly
       */
      needsSpaceAfterLineBreak: function() {
        return isOpera;
      },

      /**
       * Whether the browser supports the speech api on the given element
       * See http://mikepultz.com/2011/03/accessing-google-speech-api-chrome-11/
       *
       * @example
       *    var input = document.createElement("input");
       *    if (wysihtml5.browser.supportsSpeechApiOn(input)) {
       *      // ...
       *    }
       */
      supportsSpeechApiOn: function(input) {
        var chromeVersion = userAgent.match(/Chrome\/(\d+)/) || [null, 0];
        return chromeVersion[1] >= 11 && ("onwebkitspeechchange" in input || "speech" in input);
      },

      /**
       * IE9 crashes when setting a getter via Object.defineProperty on XMLHttpRequest or XDomainRequest
       * See https://connect.microsoft.com/ie/feedback/details/650112
       * or try the POC http://tifftiff.de/ie9_crash/
       */
      crashesWhenDefineProperty: function(property) {
        return isIE && (property === "XMLHttpRequest" || property === "XDomainRequest");
      },

      /**
       * IE is the only browser who fires the "focus" event not immediately when .focus() is called on an element
       */
      doesAsyncFocus: function() {
        return isIE;
      },

      /**
       * In IE it's impssible for the user and for the selection library to set the caret after an <img> when it's the lastChild in the document
       */
      hasProblemsSettingCaretAfterImg: function() {
        return isIE;
      },

      hasUndoInContextMenu: function() {
        return isGecko || isChrome || isOpera;
      },

      /**
       * Opera sometimes doesn't insert the node at the right position when range.insertNode(someNode)
       * is used (regardless if rangy or native)
       * This especially happens when the caret is positioned right after a <br> because then
       * insertNode() will insert the node right before the <br>
       */
      hasInsertNodeIssue: function() {
        return isOpera;
      },

      /**
       * IE 8+9 don't fire the focus event of the <body> when the iframe gets focused (even though the caret gets set into the <body>)
       */
      hasIframeFocusIssue: function() {
        return isIE;
      },

      /**
       * Chrome + Safari create invalid nested markup after paste
       *
       *  <p>
       *    foo
       *    <p>bar</p> <!-- BOO! -->
       *  </p>
       */
      createsNestedInvalidMarkupAfterPaste: function() {
        return isWebKit;
      }
    };
  })();

})(Parchment);

(function(Parchment) {

  "use strict";

  Parchment.quirks = {

  };

})(Parchment);
