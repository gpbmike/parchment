/*
 * Parchment Rich Text Editor
 * https://github.com/gpbmike/parchment
 *
 * Copyright (c) 2013 gpbmike
 * Licensed under the MIT license.
 */

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

  Parchment.ELEMENT_NODE = 1;
  Parchment.TEXT_NODE    = 3;
  Parchment.COMMENT_NODE = 8;

  // Global API
  window.Parchment = Parchment;


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
        br: true,
        script: false
      }
    }
  };


  /* PARCHMENT DATA-API
   * ================== */

  $("[data-rte='parchment']").each(function () {
    $(this).parchment($(this).data());
  });


}(jQuery));
