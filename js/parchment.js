// USES MOOTOOLS EVENTS
var Parchment = (function() {

    function Parchment(id, options) {

        var target = document.getElementById(id);

        if (!target) {
            return;
        }

        this.parchment = document.createElement('div');
        this.parchment.setAttribute('id', 'parchment');
        this.parchment.setAttribute('class', 'parchment-2');

        // What happens in parchment stays in parchment.
        this.parchment.addEvents({
            'keypress': function (e) { e.stopPropagation(); },
            'keydown': function (e) { e.stopPropagation(); },
            'keyup': function (e) { e.stopPropagation(); }
        });

        target.parentNode.insertBefore(this.parchment, target);

        // we need both a textarea and an editor (contenteditable=true)
        if (target.tagName.test(/textarea/i)) {
            this.textarea = target;
            this.editor = document.createElement('div');
            this.editor.innerHTML = target.value;
        } else {
            this.editor = target;
            this.textarea = document.createElement('textarea');
            this.textarea.innerHTML = target.innerHTML;
        }

        this.parchment.appendChild(this.editor);
        this.parchment.appendChild(this.textarea);

        this.setBrowser();

        this.editor.setAttribute('class', 'editor wiki-content');
        this.editor.setAttribute('contenteditable', 'true');

        // we strip out any attribute that's not in this list.
        // key = tagName
        // value = regular expression
        this.attributes_whitelist = {};

        // we strip out any empty node that's not in this list.
        // key = tagName
        // value = function returns true if you keep it
        this.empty_node_whitelist = {
            'br': function () {
                return true;
            },
            'img': function () {
                return true;
            },
            'hr': function () {
                return true;
            }
        };

        // tag tree and node tree to see what you're nested in
        this.node_tree = [];
        this.tag_tree = [];

        this.options = options || {};
        this.options.toolbar = this.options.toolbar || 'full';
        this.plugins = [];

        this.observeEvents();
        this.loadPlugins();
        this.buildToolbar();

        this.clean({'add_paragraphs': true, 'first_clean': true});

        // ping the document so other things know we're ready
        document.fireEvent('parchmentready', this);

        // use semantic markup for commands
        // this comes last beause it stops the function for some reason
		// PATCH NOTES: This line had a typo in it. In the original it was "this.browser.webit"
        if (this.browser.mozilla || this.browser.webkit) {
            document.execCommand("styleWithCSS", false, false);
            document.execCommand("enableObjectResizing", false, false);
        }

        // This function is based off of the function quora apparently uses for scrolling,
        // but is not the same
        function simulateScroll(eventObj) {
            if(eventObj.originalTarget != document.documentElement) { // If the key wasn't pressed on the document itself, then dont bother
                return;
            }

            var keyCode = eventObj.keyCode || eventObj.charCode;
            var isShift = eventObj.shiftKey === true;
            var isCtrl = eventObj.ctrlKey === true;
            var isAlt = eventObj.altKey === true;
            var isMeta = eventObj.metaKey === true;

            var nearScreenHeight = Math.round(0.9 * window.innerHeight); // This is how much it moves on a space/pageDown or opposite, almost whole page.
            var arrow_delta = 50; // This is the distance in pixels it moves up and down

            var cKey = compiledKey(keyCode, isShift, isCtrl, isAlt, isMeta);

            switch (cKey) {
                case compiledKey(38, false, false, false ,false): // Up is pressed with no modifiers
                    window.scrollBy(0, -arrow_delta);
                    break;

                case compiledKey(40, false, false, false ,false): // Down is pressed with no modifiers
                    window.scrollBy(0, arrow_delta);
                    break;

                case compiledKey(33, false, false, false ,false): // pageUp is pressed with no modifiers
                case compiledKey(32, true, false, false ,false): // space is pressed with shift pressed
                    window.scrollBy(0, -nearScreenHeight);
                    break;

                case compiledKey(32, false, false, false ,false): // space is pressed with no modifiers
                case compiledKey(34, false, false, false ,false): // pageDown is pressed with no modifiers
                    window.scrollBy(0, nearScreenHeight);
                    break;

                default:
                    return;
            }

            eventObj.preventDefault();
            eventObj.stopPropagation();
        }

        // Straight up taken from quora, can't think of a better way to do this
        function compiledKey(keyCode, shift, ctrl, alt, meta) {
            return [keyCode, shift, ctrl, alt, meta].join(" ");
        }

        // This check is borrowed from the internet, Im not sure if this browser check is incorrect
        // Since I never have to do that, but if its glaringly incorrect to you... replace it
        if (this.browser.mozilla) {
            document.addEventListener("keypress", simulateScroll);
        }

    }

    // Cross browser method to get selection object
    Parchment.prototype.getSelectionObject = function () {
        var userSelection;
        if (window.getSelection) {
            userSelection = window.getSelection();
        }
        else if (document.selection) { // should come last; Opera!
            userSelection = document.selection.createRange();
        }
        return userSelection;
    };

    // Cross browser method to get range object
    Parchment.prototype.getRangeObject = function (selectionObject) {
        selectionObject = selectionObject || this.getSelectionObject();
        var range;
        // first see if we have a range
        if (selectionObject.rangeCount > 0) {
            if (selectionObject.getRangeAt) {
                return selectionObject.getRangeAt(0);
            } else { // Safari!
                range = document.createRange();
                range.setStart(selectionObject.anchorNode,selectionObject.anchorOffset);
                range.setEnd(selectionObject.focusNode,selectionObject.focusOffset);
                return range;
            }
        } else {
            range = document.createRange();
            range.setStart(this.editor, 0);
            range.setEnd(this.editor, 0);
            return range;
        }
    };

    // Save the user's selection
    // Needed so plugins know what the user is targeting.
    Parchment.prototype.saveSelection = function () {
        var selectionObject = this.getSelectionObject();
        if (selectionObject.anchorNode) {
            this.range = this.getRangeObject();
        }
    };

    // Restore the user's selection after the editor has lost focus.
    Parchment.prototype.restoreSelection = function () {
        if (!this.range) {
            this.saveSelection();
        }
        // focusing on the editor causes the viewport to jump
        // this.editor.focus();
        var selectionObject = this.getSelectionObject();
        selectionObject.removeAllRanges();
        selectionObject.addRange(this.range);
    };

    // determine if browser is webkit, opera, msie, or mozilla
    Parchment.prototype.setBrowser = function () {

        function uaMatch (ua) {
            ua = ua.toLowerCase();

            var rwebkit = /(webkit)[ \/]([\w.]+)/,
                ropera = /(opera)(?:.*version)?[ \/]([\w.]+)/,
                rmsie = /(msie) ([\w.]+)/,
                rmozilla = /(mozilla)(?:.*? rv:([\w.]+))?/;

            var match = rwebkit.exec( ua ) ||
                ropera.exec( ua ) ||
                rmsie.exec( ua ) ||
                ua.indexOf("compatible") < 0 && rmozilla.exec( ua ) ||
                [];

            return { browser: match[1] || "", version: match[2] || "0" };
        }

        var browserMatch = uaMatch( navigator.userAgent );

        if ( browserMatch.browser ) {
            this.browser = {};
            this.browser[ browserMatch.browser ] = true;
            this.browser.version = browserMatch.version;
            this.browser.ios = !!navigator.userAgent.match(/ip(?:ad|od|hone)/i);
        }

    };

    var createToolbarButton = function (plugin_name, plugin) {
        var button = document.createElement('button');
        button.setProperty('type', 'button');
        button.setProperty('class', plugin_name.replace(' ', '-').toLowerCase());
        button.setProperty('title', plugin_name);
        button.appendChild(document.createTextNode(plugin_name));
        button.addEvent('click', function (event) {
            event.stop();
            plugin.callback(arguments);
        }.bind(plugin));

        return button;
    };

    Parchment.prototype.buildToolbar = function () {
        this.toolbar = document.createElement('div');
        this.toolbar.setAttribute('class', 'toolbar');
        this.editor.parentNode.appendChild(this.toolbar);

        this.options.plugins_display = this.options.plugins_display || Object.keys(Object.filter(this.options.plugins, function (value, key) { return value.type && value.type == 'button'; }));

        for (var p = 0; p < this.options.plugins_display.length; p++) {

            var plugin_name = this.options.plugins_display[p], i, group = document.createElement('span');

            (function () {

                // arrays are also objects, so check for Array first
                if (plugin_name instanceof Array) {

                    for (var i = 0; i < plugin_name.length; i++) {
                        group.appendChild(createToolbarButton(plugin_name[i], this.options.plugins[plugin_name[i]]));
                    }

                    this.toolbar.appendChild(group);

                }

                else if (plugin_name instanceof Object) {

                    switch (plugin_name.type) {
                    case ('dropdown'):
                        group.setAttribute('class', 'dropdown');
                        var selection = document.createElement('button');
                        selection.setAttribute('type', 'button');
                        selection.appendChild(document.createTextNode('Paragraph'));
                        group.appendChild(selection);
                        var ul = document.createElement('ul');
                        for (i = 0; i < plugin_name.buttons.length; i++) {
                            var li = document.createElement('li');
                            li.appendChild(createToolbarButton(plugin_name.buttons[i], this.options.plugins[plugin_name.buttons[i]]));
                            ul.appendChild(li);
                        }
                        group.appendChild(ul);
                        this.toolbar.appendChild(group);
                        break;
                    case ('more'):
                        if (!this.more_toggle) {
                            this.more_toggle = document.createElement('button');
                            this.more_toggle.setAttribute('class', 'more');
                            if (Cookie.read('parchmentmoreoptions')) {
                                this.more_toggle.addClass('open');
                            }
                            this.more_toggle.setAttribute('type', 'button');
                            if (this.toolbar.firstChild) {
                                this.toolbar.insertBefore(this.more_toggle, this.toolbar.firstChild);
                            } else {
                                this.toolbar.appendChild(this.more_toggle);
                            }
                            this.more_toolbar = document.createElement('div');
                            this.more_toolbar.setAttribute('class', 'toolbar more');
                            if (Cookie.read('parchmentmoreoptions')) {
                                this.more_toolbar.addClass('open');
                            }
                            this.editor.parentNode.appendChild(this.more_toolbar);

                            this.more_toggle.addEvent('click', function (event) {
                                event.stop();
                                this.more_toolbar.toggleClass('open');
                                this.more_toggle.toggleClass('open');
                                if (this.more_toggle.hasClass('open')) {
                                    Cookie.write('parchmentmoreoptions', true, {'duration': 365});
                                } else {
                                    Cookie.dispose('parchmentmoreoptions');
                                }

                                var padding_top = this.toolbar.getSize().y;
                                if (this.more_toolbar) {
                                    padding_top += this.more_toolbar.getSize().y;
                                }
                                this.parchment.setStyle('padding-top', padding_top);
                            }.bind(this));
                        }
                        for (i = 0; i < plugin_name.buttons.length; i++) {
                            group.appendChild(createToolbarButton(plugin_name.buttons[i], this.options.plugins[plugin_name.buttons[i]]));
                        }
                        this.more_toolbar.appendChild(group);
                        break;
                    default:
                        break;
                    }

                }

                else {
                    this.toolbar.appendChild(createToolbarButton(plugin_name, this.options.plugins[plugin_name]));
                }

            }).apply(this);

            var padding_top = this.toolbar.getSize().y;
            if (this.more_toolbar) {
                this.more_toolbar.setStyle('top', padding_top);
                padding_top += this.more_toolbar.getSize().y;
            }
            this.parchment.setStyle('padding-top', padding_top);

        }
    };

    Parchment.prototype.loadPlugins = function () {

        for (var plugin_name in this.options.plugins) {

            (function () {

                var plugin = this.options.plugins[plugin_name],
                    tag;
                plugin.parchment = this;

                if (plugin.init) {
                    plugin.init();
                }

                // add to attribute whitelist
                if (plugin.attributes_whitelist) {

                    // loop through tags
                    for (tag in plugin.attributes_whitelist) {
                        if (this.attributes_whitelist[tag]) {
                            // loop through attributes
                            for (var attribute in plugin.attributes_whitelist[tag]) {
                                if (this.attributes_whitelist[tag][attribute]) {

                                    // see if we already have an array
                                    if (this.attributes_whitelist[tag][attribute] instanceof Array) {
                                        this.attributes_whitelist[tag][attribute].push(plugin.attributes_whitelist[tag][attribute]);
                                    }

                                    // not an array of expressions
                                    else {
                                        this.attributes_whitelist[tag][attribute] = [
                                            this.attributes_whitelist[tag][attribute],
                                            plugin.attributes_whitelist[tag][attribute]
                                        ];
                                    }
                                }

                                // new attribute
                                else {
                                    this.attributes_whitelist[tag][attribute] = plugin.attributes_whitelist[tag][attribute];
                                }
                            }
                        }

                        // new tag
                        else {
                            this.attributes_whitelist[tag] = plugin.attributes_whitelist[tag];
                        }
                    }
                }

                // add to empty node whitelist
                if (plugin.empty_node_whitelist) {
                    // loop through tags
                    for (tag in plugin.empty_node_whitelist) {
                        if (this.empty_node_whitelist[tag]) {

                            // see if we already have an array
                            if (this.empty_node_whitelist[tag] instanceof Array) {
                                this.empty_node_whitelist[tag].push(plugin.attributes_whitelist[tag][attribute]);
                            }

                            // not an array of functions
                            else {
                                this.empty_node_whitelist[tag][attribute] = [
                                    this.empty_node_whitelist[tag],
                                    plugin.empty_node_whitelist[tag]
                                ];
                            }
                        }

                        // new tag
                        else {
                            this.empty_node_whitelist[tag] = plugin.empty_node_whitelist[tag];
                        }
                    }
                }

            }).apply(this);

        }

    };

    // watch the editor for events
    Parchment.prototype.observeEvents = function () {

        this.editor.addEvents({
            'keypress': handleKeyPress.bind(this),
            'keyup': handleKeyUp.bind(this),
            'keydown': handleKeyDown.bind(this),
            'mouseup': handleMouseUp.bind(this)
        });

        document.addEvents({
            'scroll': this.fixToolbar.bind(this)
        });

        // An outside function can fire an event called 'submit' on the form this rte lives in.
        if (this.textarea.form) {
            this.textarea.form.addEvent('submit', function (e) {
                this.editor.focus();
                this.clean();
                this.editor.blur();
            }.bind(this));
        }

        if (document.addEventListener) {
            document.addEventListener('paste', handlePaste.bind(this), false);
        } else if (this.IF.contentWindow.document.attachEvent) {
            document.body.attachEvent('onpaste', handlePaste.bind(this));
        }

    };

    // fix the toolbar so it follows you down the page
    Parchment.prototype.fixToolbar = function () {

        var scroll = window.getScroll().y,
            pCoords = this.parchment.getCoordinates(),
            toolbar_height = this.toolbar.getSize().y;

        if (this.more_toolbar) {
            toolbar_height += this.more_toolbar.getSize().y;
        }

        // fix the toolbar(s) when you're below the top of the editor and above the bottom of the editor
        if (scroll > pCoords.top && scroll + toolbar_height < pCoords.top + pCoords.height) {
            this.toolbar.addClass('fixed');
            this.toolbar.setStyle('width', pCoords.width - 2); // minus 2 for border... fix later
            if (this.more_toolbar) {
                this.more_toolbar.addClass('fixed');
                this.more_toolbar.setStyle('width', pCoords.width - 2); // minus 2 for border... fix later
            }
        }

        // unfix the header when you're above the header
        else {
            this.toolbar.removeClass('fixed');
            this.toolbar.setStyle('width', '100%');
            if (this.more_toolbar) {
                this.more_toolbar.removeClass('fixed');
                this.more_toolbar.setStyle('width', '100%');
            }
        }

    };

    var handlePaste = function (event) {

        // we only care if you're pasting into the editor
        if (document.activeElement !== this.editor) {
            return;
        }

        var _this = this;

        setTimeout(function () {

            // loop through the plugins to see if they care
            for (var index in _this.options.plugins) {
                (function () {

                    var plugin = this.options.plugins[index];

                    if (typeof plugin.handlePaste !== 'undefined') {
                        plugin.handlePaste.apply(this);
                    }

                }).apply(_this);
            }
            _this.clean({'add_paragraphs': true});

        }, 1);

    };

    // use br instead of div div
    var handleKeyPress = function (event) {

        var userSelection = this.getSelectionObject(),
            range = this.getRangeObject(userSelection),
            in_header = false,
            node = userSelection.anchorNode;

        // we want line breaks to be consistent across browsers
        if (event.key == 'enter') {

            // check if anchor node is in header
            while (node != this.editor) {
                if (node.parentNode.tagName.test(/h\d/i)) {
                    in_header = true;
                    break;
                }
                node = node.parentNode;
            }

            // check if focus node is in header
            if (!in_header) {
                node = userSelection.focusNode;

                while (node != this.editor) {
                    if (node.parentNode.tagName.test(/h\d/i)) {
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
            else if (this.getParentBlockElement(userSelection.anchorNode).tagName.test(/^(li|ol|ul|blockquote)$/i)) {
                return;
            }

            // do a line break if you're not in a P tag.
            else if (!this.getParentBlockElement(userSelection.anchorNode).tagName.test(/^p$/i)) {
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

    var handleKeyUp = function (event) {

        // if you're moving around the editor, build the node tree so we know what buttons to turn on
        if (event.key.test(/backspace|delete|left|right|down|up/)) {
            this.buildNodeTree();
        }

        var userSelection = this.getSelectionObject(),
            range = this.getRangeObject(userSelection),
            node = userSelection.anchorNode,
            inCage = false,
            inHeader = false;

        if (!userSelection.anchorNode) {
            return;
        }

        // don't back into a cage or header
        if (event.key == 'backspace' || event.key == 'delete') {
            while (node && node != this.editor) {
                if (node.className && node.className.test(/js-item-cage/i)) {
                    inCage = node;
                }
                if (node.nodeName && node.nodeName.test(/h\d/i)) {
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
        if (userSelection.anchorNode.nodeType == Node.TEXT_NODE && (userSelection.anchorNode.parentNode == this.editor)) {
            document.execCommand('formatblock', false, '<P>');
            range.setStartAfter(userSelection.anchorNode);
            range.setEndAfter(userSelection.anchorNode);
            userSelection.removeAllRanges();
            userSelection.addRange(range);
        }

        this.saveSelection();
    };

    var handleKeyDown = function (event) {

        if (event.key == 'tab') {
            event.preventDefault();
        }

        // control/command + left/right in FF goes forward/back in browser
        // control/command + B/I in ff doesn't bookmark stuff
        else if (this.browser.mozilla && ['left', 'right', 'b', 'i'].inArray(event.key) >= 0 && (event.meta || event.control)) {
            event.preventDefault();
        }

		// PATCH NOTES: These lines have a logic error. The first else if captures all
		// possible truth cases of the second else if, therefore the second else if
		// can never be reached. (Easily tested in browser, trying to do CTRL-SHIFT-Z
		// simply does an UNDO and not a REDO.) Adding in the extra shift check fixes
		// this.
        // UNDO
        else if ((event.meta || event.control) && !event.shift && event.key == 'z') {
            event.stop();
            document.execCommand('undo', null, null);
        }

        // REDO
        else if ((event.meta || event.control) && event.shift && event.key == 'z') {
            event.stop();

			//MSDN Claims IE doesn't support REDO, but comments seem to suggest it has from 5.5
			// Can't get it to work right on IE, just seems to move the cursor without working. Not sure if there is a fix
            document.execCommand('redo', null, null);
        }

        // we don't want to back into a cage
        else if (event.key == 'backspace' || event.key == 'delete') {
            this.inCage = false;
            this.inHeader = false;
            var userSelection = this.getSelectionObject(),
                node = userSelection.anchorNode;

            while (node && node != this.editor) {
                if (node.className && node.className.test(/js-item-cage/i)) {
                    this.inCage = true;
                }
                if (node.nodeName && node.nodeName.test(/h\d/i)) {
                    this.inHeader = true;
                }
                node = node.parentNode;
            }

        }
    };

    var handleMouseUp = function (event) {
        this.buildNodeTree();
        this.saveSelection();
    };

    // wrap childNodes in paragraphs
    Parchment.prototype.addParagraphs = function (container) {

        var node = container.firstChild,
            p = false;

        while (node) {
            if (this.isBlockElement(node)) {
                p = false;
                if (node.nodeName.toLowerCase() == 'br') {
                    br = node;
                    node = node.nextSibling;
                    br.parentNode.removeChild(br);
                    continue;
                }

                // if there's a BR in the paragraph, move everything out of the paragraph and clean it properly
                if (node.nodeName.toLowerCase() == 'p' && node.getElementsByTagName('br').length > 0) {

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
	//	INTPUT: <h2><b>Huh?</b></h2>
	//  OUTPUT: <h2><b>Huh?</b></h2> (Control Case)

	//	INTPUT: <b><h2>Huh?</h2></b>
	//  OUTPUT: <h2><b>Huh?</b></h2> (More or less what you would expect)

	//	INTPUT: <b>Test <h2>Huh?</h2></b>
	//  OUTPUT: <p><b>Test</b></p><h2><b>Huh?</b></h2> (The extra <p> around Test is from clean I believe)

	//	INTPUT: <b><b><h2>Huh?</h2></b></b>
	//  OUTPUT: <h2><b><b>Huh?</b></b></h2>

	//	INTPUT: <h2><b><b><h2>Huh?</h2></b></b></h2>
	//  OUTPUT: <h2><b><b>Huh?</b></b></h2> (The Extra H2 Gets compressed by later code if I understand correctly)

	//	INTPUT: <b><h2><b><b><h2>Huh?</h2></b></b></h2></b>
	//  OUTPUT: <h2><b><b><b>Huh?</b></b></b></h2>

	//  This is the most extreme test case I did, but the code seems to handle it well
	/*	INTPUT:
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

            var nodes = container.getElementsByTagName('*'), i, node;

			var nodesThatWrap = [];

			// First grab every node that needs to be fixed
			for (i = 0; i < nodes.length; i++) {
				node = nodes[i];
				if(!this.isBlockElement(node) && !(this.style && this.style.display && this.style.display == 'block') && this.hasBlockChildren(node))
					nodesThatWrap.push(node);
			}

			// Now fix every one of them
			for (i = 0; i < nodesThatWrap.length; i++) {
				node = nodesThatWrap[i];

				var blockNodes = node.getElementsByTagName('*'), j, blockNode, childNode, dup, dupChild;

				// replace all text nodes with wrapped versions of this node
				for(j = 0; j < node.childNodes.length; j++)
				{
					childNode = node.childNodes[j];
					if(childNode.nodeType == 3) // Text Node
					{
						dup = node.cloneNode(false);
						dupChild = childNode.cloneNode(false);
						dup.appendChild(dupChild);

						node.replaceChild(dup, childNode);
					}
				}

				// For every node that actually is a block node fix it.
				for(j = 0; j < blockNodes.length; j++)
				{
					blockNode = blockNodes[j];

					if(!this.isBlockElement(blockNode))
						continue;

					// This block node has children block node, so only replace
					// the text elements of the block element not the children.
					if(this.hasBlockChildren(blockNode))
					{
						var k;
						for(k = 0; k < blockNode.childNodes.length; k++)
						{
							childNode = blockNode.childNodes[k];
							if(childNode.nodeType == 3) // Text Node
							{
								dup = node.cloneNode(false);
								dupChild = childNode.cloneNode(false);

								dup.appendChild(dupChild);
								blockNode.replaceChild(dup, childNode);
							}
						}
					}
					else // There are no block children of this child, so just wrap all children in the element
					{
						dup = node.cloneNode(false);
						while(blockNode.firstChild)
						{
							dup.appendChild(blockNode.firstChild);
						}
						blockNode.appendChild(dup);
					}
				}

				// Move every child element out of the inline node and destroy it
				while(node.firstChild)
				{
					node.parentNode.insertBefore(node.firstChild, node);
				}
				node.parentNode.removeChild(node);
			}
    };

	Parchment.prototype.hasBlockChildren = function(node) {

        var nodes = node.getElementsByTagName('*'), i;
		var hasBlockChildren = false;

		for (i = 0; i < nodes.length; i++) {
			node = nodes[i];
			if (this.isBlockElement(node) || (this.style && this.style.display && this.style.display == 'block')) {
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

    Parchment.prototype.clean = function (options) {

        // default for no options
        options = options || {};

        // let everyone know we're about to clean
        this.editor.fireEvent('beforeclean', this);

        // method to loop through attributes whitelist to check for matches
        function matchAnyExpression (value, expressions) {
            if (!(expressions instanceof Array)) {
                expressions = [expressions];
            }
            for (var i = 0; i < expressions.length; i++) {
                if (value.test(expressions[i])) {
                    return true;
                }
            }
            return false;
        }

        var html = this.editor.innerHTML,
            fragment = document.createElement('div'),
            dirty = true,
            precleaned_html,
            add_padding_paragraphs = !!options.add_paragraphs;

        fragment.innerHTML = html;

        while (dirty) {

            precleaned_html = html = fragment.innerHTML;

            // remove HTML comments
            html = html.replace(/<!--[\s\S]*?-->/g, '');

            // remove unwanted self-closing tags
            html = html.replace(/<\/*(font|meta|link)([^>]*)>/gi, '');

            // we shouldn't ever need non-breaking line spaces
            html = html.replace(/&nbsp;/gi, ' ');

            // remove all uneccessary whitespace
            html = html.replace(/\s{2,}/g, ' ');

            // move extra space inside a node, outside of it
            while (html.test(/<([^\/][^>]*)>(\s+)/g)) {
                html = html.replace(/<([^\/][^>]*)>(\s+)/g, ' <$1>');
            }
            while (html.test(/(\s+)<\/([^>]*)>/g)) {
                html = html.replace(/(\s+)<\/([^>]*)>/g, '<\/$2> ');
            }

            // remove spaces before and after block elements
            html = html.replace(/\s*<(\/*(ADDRESS|BLOCKQUOTE|BR|DIV|DL|FIELDSET|FORM|H1|H2|H3|H4|H5|H6|HR|NOSCRIPT|OL|P|PRE|TABLE|UL|DD|DT|LI|TBODY|TD|TFOOT|TH|THEAD|TR)[^>]*)>\s*/gi, '<$1>');

            // this.editor.innerHTML = html;
            fragment.innerHTML = html;

			this.fixInlineWrappers(fragment);

            // clean up attributes, remove empty nodes
            var nodes = fragment.getElementsByTagName('*'), i, node;
            for (i = nodes.length - 1; i >= 0; i--) {

                node = nodes[i];

                var tagName = node.tagName.toLowerCase();

                // remove style tags
                if (tagName == 'style') {
                    node.parentNode.removeChild(node);
                    continue;
                }

                // br should never be the first or last node
                if (tagName == 'br' && (!node.nextSibling || !node.previousSibling)) {
                    node.parentNode.removeChild(node);
                    continue;
                }

                // remove empty nodes unless they pass the empty node test
                if (node.childNodes.length === 0) {
                    var keep_node = false;
                    if (this.empty_node_whitelist[tagName]) {
                        if (this.empty_node_whitelist[tagName] instanceof Array) {
                            for (var f = 0; f < this.empty_node_whitelist[tagName].length; f ++) {
                                keep_node = this.empty_node_whitelist[tagName][f](node);
                                if (keep_node) {
                                    break;
                                }
                            }
                        } else {
                            keep_node = this.empty_node_whitelist[tagName](node);
                        }
                    }
                    if (!keep_node) {
                        node.parentNode.removeChild(node);
                        continue;
                    }
                }

                // google docs puts styles on SPAN/B tags
                // translate some of those into elements
                if (node.getProperty('style')) {
                    if (tagName == 'span') {
                        if (node.getStyle('font-style') == 'italic') {
                            new Element('i').inject(node, 'before').grab(node);
                        }
                        if (node.getStyle('font-weight') == 'bold') {
                            new Element('b').inject(node, 'before').grab(node);
                        }
                        if (node.getStyle('text-decoration') == 'line-through') {
                            new Element('strike').inject(node, 'before').grab(node);
                        }
                        if (node.getStyle('text-decoration') == 'underline') {
                            new Element('u').inject(node, 'before').grab(node);
                        }
                    }
                    if (tagName == 'b' && node.getStyle('font-weight') == 'normal') {
                        var new_node = new Element('span', {'html': node.get('html')}).inject(node, 'before');
                        node.destroy();
                        node = new_node;
                    }
                }


                // clear out all unwanted attributes
                for (var k = node.attributes.length - 1; k >= 0; k--) {

                    // look for tag and attribute, then test against whitelist
                    if (!this.attributes_whitelist[tagName] ||
                        !this.attributes_whitelist[tagName][node.attributes[k].nodeName] ||
                        node.attributes[k].nodeName == 'class' ||
                        !matchAnyExpression(node.attributes[k].nodeValue, this.attributes_whitelist[tagName][node.attributes[k].nodeName])) {

                        // classes can be split up
                        if (this.attributes_whitelist[tagName] && node.attributes[k].nodeName == 'class') {

                            var class_array = node.attributes[k].nodeValue.split(' '),
                                clean_class_array = [];

                            for (var c = 0; c < class_array.length; c++) {
                                // look for whitelisted classes
                                if (matchAnyExpression(class_array[c], this.attributes_whitelist[tagName][node.attributes[k].nodeName])) {
                                    clean_class_array.push(class_array[c]);
                                }
                            }

                            // replace classes with clean ones
                            if (clean_class_array.length > 0) {
                                node.setAttribute(node.attributes[k].nodeName, clean_class_array.join(' '));
                            } else {
                                node.removeAttribute(node.attributes[k].nodeName);
                            }

                        }

                        // anything else that gets here can just be removed
                        else {
                            node.removeAttribute(node.attributes[k].nodeName);
                        }

                    }
                }


            }

            // strip top level divs/spans that don't have attributes
            node = fragment.lastChild;
            while (node) {
                if (node.nodeType == Node.ELEMENT_NODE && node.nodeName.test(/div|span/i) && node.attributes.length === 0) {
                    while (node.firstChild) {
                        node.parentNode.insertBefore(node.firstChild, node);
                    }
                }
                node = node.previousSibling;
            }

            // handle top level nodes
            this.addParagraphs(fragment);

            // clean paragraphs
            for (i = 0; i < fragment.getElementsByTagName('p').length; i++) {
                var paragraph_to_clean = fragment.getElementsByTagName('p')[i], j;

                // strip spans in paragraphs that don't have attributes
                for (j = 0; j < paragraph_to_clean.getElementsByTagName('span').length; j++) {
                    var span = paragraph_to_clean.getElementsByTagName('span')[j];
                    if (span.attributes.length === 0) {
                        while (span.firstChild) {
                            span.parentNode.insertBefore(span.firstChild, span);
                        }
                        span.parentNode.removeChild(span);
                    }
                }

                // strip anchor tags without attributes
                for (j = 0; j < paragraph_to_clean.getElementsByTagName('a').length; j++) {
                    var a = fragment.getElementsByTagName('a')[j];
                    if (a.attributes.length === 0) {
                        while (a.firstChild) {
                            a.parentNode.insertBefore(a.firstChild, a);
                        }
                        a.parentNode.removeChild(a);
                    }
                }
            }

            // stop cleaning if we didn't change anything this time around
            if (precleaned_html == fragment.innerHTML) {
                dirty = false;
            }

        }

        // Add P's to the beginning and end so users can type before and after cages/tables/etc.
        if (add_padding_paragraphs) {
            var padding_paragraph = document.createElement('p');
            padding_paragraph.innerHTML = "<br>";
            if (!fragment.firstChild) {
                fragment.appendChild(padding_paragraph.cloneNode(true));
            } else if (!fragment.firstChild.nodeName.test(/(p|h\d)/i)) {
                fragment.insertBefore(padding_paragraph.cloneNode(true), fragment.firstChild);
            } else if (!fragment.firstChild.firstChild) {
                fragment.firstChild.innerHTML = "<br>";
            }

            if (!fragment.lastChild.nodeName.test(/(p|h\d)/i)) {
                fragment.appendChild(padding_paragraph.cloneNode(true));
            } else if (!fragment.lastChild.firstChild) {
                fragment.lastChild.innerHTML = '<br>';
            }
        }

        // replace editor html with cleaned html
        this.textarea.value = fragment.innerHTML;

        // on the first clean we don't care about undo and we don't want to bring the focus to the editor
        if (options.first_clean) {
            this.editor.innerHTML = fragment.innerHTML;
        }

        else {
            // select and delete content twice because sometimes H2s and empty As are left over after one time.
            // without focus gecko will complain, but causes the viewport to jump in webkit
            // IE will delete the whole page without this
            if (this.browser.mozilla || this.browser.msie) {
                this.editor.focus();
            }
            document.execCommand('selectAll', null, null);
            document.execCommand('delete', null, null);
            document.execCommand('selectAll', null, null);
            document.execCommand('delete', null, null);

            // insert cleaned html over previous contents
            this.insertHTML(fragment.innerHTML);
        }

        // reset buttons
        this.buildNodeTree();

        // let everyone know we're clean
        this.editor.fireEvent('clean', this);

    };

    Parchment.prototype.isBlockElement = function (node) {
        return node.nodeName.test(/^(ADDRESS|BLOCKQUOTE|BR|DIV|DL|FIELDSET|FORM|H1|H2|H3|H4|H5|H6|HR|OL|P|PRE|TABLE|UL|DD|DT|LI|TBODY|TD|TFOOT|TH|THEAD|TR|OBJECT|EMBED)$/i);
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

        if (range.endContainer != this.editor) {
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

        this.restoreSelection();

        if (this.browser.msie) {
            document.selection.createRange().pasteHTML(html);
        } else {
            document.execCommand('insertHTML', false, html);
        }

        this.saveSelection();

    };

    // Method to insert a cage. Insert at top level of editor or TD/LI
    Parchment.prototype.insertCage = function (html) {

        this.restoreSelection();

        var userSelection = this.getSelectionObject(),
            range = this.getRangeObject(userSelection),
            insert = 'after';

        range.collapse(true);

        var node = range.startContainer,
            testnode = node;

        // make sure we're in the editor
        while (testnode.parentNode) {
            if (testnode == this.editor) {
                break;
            } else if (testnode == document.body) {
                node = this.editor;
                break;
            }
            testnode = testnode.parentNode;
        }

        // move up to the top level (editor, TD, or LI)
        while (node != this.editor && !node.nodeName.test(/^td|li$/i) && node.parentNode != this.editor && !node.parentNode.nodeName.test(/^td|li$/i)) {
            node = node.parentNode;
        }

        // move to before any inline elements
        while (!this.isBlockElement(node) && node.previousSibling && !this.isBlockElement(node.previousSibling)) {
            node = node.previousSibling;
        }

        // insert before P, after everything else
        if (node.nodeType == Node.TEXT_NODE || node.tagName.test(/p/i)) {
            range.setStartBefore(node);
            range.setEndBefore(node);
            insert = 'before';
        } else if (node == this.editor) {
            range.setStart(node, 0);
            range.setEnd(node, 0);
        } else {
            range.setStartAfter(node);
            range.setEndAfter(node);
        }

        // move below headers
        while (node.nodeType == Node.ELEMENT_NODE && node.tagName.test(/^h\d$/i)) {
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
        if (node.parentNode == this.editor) {
            if (!node.previousSibling || !node.previousSibling.tagName.test(/p/i)) {
                html = '<p>&nbsp;</p>' + html;
            }
            if (!node.nextSibling || !node.nextSibling.tagName.test(/p/i)) {
                html = html + '<p>&nbsp;</p>';
            }
            // the two paragraphs following an insert will collapse into each other without this
            else if (node.nextSibling.tagName.test(/p/i)) {
                html = html + '<p></p>';
            }
        }

        this.insertHTML(html);

    };

    // Destroy parchment
    Parchment.prototype.destroy = function () {
        // placeholder for now
    };

    Parchment.prototype.buildNodeTree = function () {

        var userSelection = this.getSelectionObject(),
            node = userSelection.anchorNode;

        if (!node) {
            return;
        }

        this.node_tree = [];
        this.tag_tree = [];

        while (node != this.editor) {
            this.node_tree.push(node);
            this.tag_tree.push(node.nodeName);
            node = node.parentNode;
            if (node == document) {
                this.node_tree = [];
                this.tag_tree = [];
                break;
            }
        }

        this.editor.fireEvent('nodetreechange', [this.tag_tree, this.node_tree]);
    };

    return Parchment;

})();

// these are built in commands that we can use
Parchment.Plugins = {
    'Bold': {
        'type': 'button',
        'init': function () {

			// PATCH NOTES: Its really weird that the bold button toggles on nodetreechange but does
			// not toggle when you actually press CTRL-B. So I added in some code to actually toggle the
			// button off and on.
            var _this = this; // Have to bind this in order to access it from inside the keydown event
            this.parchment.editor.addEvents({
                'keydown': function (event) {
                    if ((event.meta || event.control) && event.key == 'b') {
                        event.stop();
                        document.execCommand('bold', null, null);

						// Toggles the bold button
						if(_this.parchment.toolbar.getElement('.bold').hasClass('on'))
							_this.parchment.toolbar.getElement('.bold').removeClass('on');
						else
							_this.parchment.toolbar.getElement('.bold').addClass('on');

                    }
                },
                'nodetreechange': function (tag_tree, node_tree) {
                    if (tag_tree.contains('B') || tag_tree.contains('STRONG')) {
                        this.parchment.toolbar.getElement('.bold').addClass('on');
                    } else {
                        this.parchment.toolbar.getElement('.bold').removeClass('on');
                    }
                }.bind(this)
            });
        },
        'callback': function () {
            document.execCommand('bold', null, null);
            this.parchment.buildNodeTree();
        }
    },
    'Italic': {
        'type': 'button',
        'init': function () {
			// PATCH NOTES: Same as above, the button does not toggle when you press CTRL-I
			var _this = this;
            this.parchment.editor.addEvents({
                'keydown': function (event) {
                    if ((event.meta || event.control) && event.key == 'i') {
                        event.stop();
                        document.execCommand('italic', null, null);

						if(_this.parchment.toolbar.getElement('.italic').hasClass('on'))
							_this.parchment.toolbar.getElement('.italic').removeClass('on');
						else
							_this.parchment.toolbar.getElement('.italic').addClass('on');
                    }
                },
                'nodetreechange': function (tag_tree, node_tree) {
                    if (tag_tree.contains('I') || tag_tree.contains('EM')) {
                        this.parchment.toolbar.getElement('.italic').addClass('on');
                    } else {
                        this.parchment.toolbar.getElement('.italic').removeClass('on');
                    }
                }.bind(this)
            });
        },
        'callback': function () {
            document.execCommand('italic', null, null);
            this.parchment.buildNodeTree();
        }
    },
    'Underline': {
        'type': 'button',
        'init': function () {
			// PATCH NOTES: Same as above, the button does not toggle when you press CTRL-U
			var _this = this;
            this.parchment.editor.addEvents({
                'keydown': function (event) {
                    if ((event.meta || event.control) && event.key == 'u') {
                        event.stop();
                        document.execCommand('underline', null, null);

						if(_this.parchment.toolbar.getElement('.underline').hasClass('on'))
							_this.parchment.toolbar.getElement('.underline').removeClass('on');
						else
							_this.parchment.toolbar.getElement('.underline').addClass('on');
                    }
                },
                'nodetreechange': function (tag_tree, node_tree) {
                    if (tag_tree.contains('U')) {
                        this.parchment.toolbar.getElement('.underline').addClass('on');
                    } else {
                        this.parchment.toolbar.getElement('.underline').removeClass('on');
                    }
                }.bind(this)
            });
        },
        'callback': function () {
            document.execCommand('underline', null, null);
            this.parchment.buildNodeTree();
        }
    },
    'Strikethrough': {
        'type': 'button',
        'init': function () {
            this.parchment.editor.addEvents({
                'nodetreechange': function (tag_tree, node_tree) {
                    if (tag_tree.contains('STRIKE')) {
                        this.parchment.toolbar.getElement('.strikethrough').addClass('on');
                    } else {
                        this.parchment.toolbar.getElement('.strikethrough').removeClass('on');
                    }
                }.bind(this)
            });
        },
        'callback': function () {
            document.execCommand('strikethrough', null, null);
            this.parchment.buildNodeTree();
        }
    },
    'Ordered List': {
        'type': 'button',
        'init': function () {
            this.parchment.editor.addEvents({
                'nodetreechange': function (tag_tree, node_tree) {
                    if (tag_tree.contains('OL')) {
                        this.parchment.toolbar.getElement('.ordered-list').addClass('on');
                    } else {
                        this.parchment.toolbar.getElement('.ordered-list').removeClass('on');
                    }
                }.bind(this)
            });
        },
        'callback': function () {
            document.execCommand('insertOrderedList', null, null);
            this.parchment.buildNodeTree();
        }
    },
    'Unordered List': {
        'type': 'button',
        'init': function () {
            this.parchment.editor.addEvents({
                'nodetreechange': function (tag_tree, node_tree) {
                    if (tag_tree.contains('UL')) {
                        this.parchment.toolbar.getElement('.unordered-list').addClass('on');
                    } else {
                        this.parchment.toolbar.getElement('.unordered-list').removeClass('on');
                    }
                }.bind(this)
            });
        },
        'callback': function () {
            document.execCommand('insertUnorderedList', null, null);
            this.parchment.buildNodeTree();
        }
    },
    'Remove Format': {
        'type': 'button',
        'callback': function () {
            document.execCommand('removeFormat', null, null);
            this.parchment.buildNodeTree();
        }
    },
    'Clean': {
        'type': 'button',
        'callback': function (event) {
            this.parchment.clean({'add_paragraphs': true});
        }
    }
};

function createParchment (args) {

    var plugins = Parchment.Plugins,
        plugins_display = [
            {
                'type': 'dropdown',
                'buttons': [
                    'Paragraph',
                    'Header 4',
                    'Header 3',
                    'Header 2'
                ]
            },
            [
                'Bold',
                'Italic',
                'Underline',
                'Strikethrough'
            ],
            [
                'Unordered List',
                'Ordered List'
            ],
            [
                'Blockquote'
            ],
            [
                'Table'
            ],
            [
                'HTML'
            ],
            {
                'type': 'more',
                'buttons': [
                    'Remove Format',
                    'Code',
                    'Clean'
                ]
            }
        ];

    return new Parchment(args.id, {
        'plugins': plugins,
        'plugins_display': plugins_display,
        'toolbar': args.toolbar
    });
}

// IE doesn't support Node
if (!window['Node']) {
    window.Node = {};
    Node.ELEMENT_NODE = 1;
    Node.ATTRIBUTE_NODE = 2;
    Node.TEXT_NODE = 3;
    Node.CDATA_SECTION_NODE = 4;
    Node.ENTITY_REFERENCE_NODE = 5;
    Node.ENTITY_NODE = 6;
    Node.PROCESSING_INSTRUCTION_NODE = 7;
    Node.COMMENT_NODE = 8;
    Node.DOCUMENT_NODE = 9;
    Node.DOCUMENT_TYPE_NODE = 10;
    Node.DOCUMENT_FRAGMENT_NODE = 11;
    Node.NOTATION_NODE = 12;
}

// IE doesn't support console
if (!window['console']) {
    window.console = {
        log: function () {}
    };
}

Array.prototype.inArray = function (elem) {
    if ( this.indexOf ) {
        return this.indexOf( elem );
    }

    for ( var i = 0, length = this.length; i < length; i++ ) {
        if ( this[ i ] === elem ) {
            return i;
        }
    }

    return -1;
};
