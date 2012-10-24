Parchment.Plugins['Blockquote'] = {
    'attributes_whitelist': {
        'blockquote': {
            'class': /news|left|right|large|medium/
        }
    },
    'type': 'button',
    'init': function () {

        document.addEvent('parchmentready', function () {
            if (this.parchment.options.toolbar == 'news') {
                this.parchment.editor.getElements('blockquote').addClass('news');
            }
        }.bind(this));

        this.parchment.editor.addEvents({
            'nodetreechange': function (tag_tree, node_tree) {
                if (tag_tree.contains('BLOCKQUOTE')) {
                    this.parchment.toolbar.getElement('.blockquote').addClass('on');
                } else {
                    this.parchment.toolbar.getElement('.blockquote').removeClass('on');
                }
            }.bind(this)
        });

        this.buildToolbar();

    },

    'callback': function (event) {

        var selection = this.parchment.getSelectionObject(),
            range = this.parchment.getRangeObject(selection),
            node = range.commonAncestorContainer,
            html = node.innerHTML,
            index = this.parchment.tag_tree.indexOf('BLOCKQUOTE');

        // undo blockquote if you're in it
        if (index >= 0) {
            
            // Save selection before hand
            var oldRange = range.cloneRange();
        
            selection.removeAllRanges();

            // find and remove citations
            var cite = this.parchment.node_tree[index].getElementsByTagName('cite');
            for (var i = cite.length - 1; i >= 0; i--) {
                range.selectNode(cite[i]);
                selection.addRange(range);
            }
            
            if(selection.rangeCount > 0)
                document.execCommand('delete', false, false);

           /* range.selectNode(this.parchment.node_tree[index]);
            selection.addRange(range);*/
            
            // Restore old selection
            selection.addRange(oldRange);
            
            document.execCommand('formatBlock', null, '<P>');
            
        }

        else {
            // Bug in Firefox makes blockquotes not work when only one line exists in the editor,
            // this fixes that 
            // https://bugzilla.mozilla.org/show_bug.cgi?id=557412
            var p = document.createElement("p");
            this.parchment.editor.appendChild(p);
        
            document.execCommand('formatBlock', null, '<BLOCKQUOTE>');

            if (this.parchment.options.toolbar == 'news') {
                this.parchment.editor.getElements('blockquote').addClass('news');
            }
            
            // Remove kludge that fixes firefox problem
            this.parchment.editor.removeChild(p);
        }

        this.parchment.buildNodeTree();
    },


    'buildToolbar': function () {

        var display;

        if (this.parchment.options.toolbar == 'news') {
            display = {
                'size': [
                    {'text': 'S', 'command': 'small'},
                    {'text': 'M', 'command': 'medium'},
                    {'text': 'L', 'command': 'large'}
                ],
                'position': [
                    {'text': 'L', 'command': 'left'},
                    {'text': 'C', 'command': 'center'},
                    {'text': 'R', 'command': 'right'},
                    {'text': 'U', 'command': 'up'},
                    {'text': 'D', 'command': 'down'}
                ],
                'change': [
                    {'text': 'credit', 'command': 'credit'},
                    {'text': 'remove', 'command': 'remove'}
                ]
            };
        } else {
            display = {
                'position': [
                    {'text': 'U', 'command': 'up'},
                    {'text': 'D', 'command': 'down'}
                ]
            };
        }

        this.toolbar = new Parchment.Utils.Toolbar(this.parchment.editor, {
            'class': 'blockquote',
            'relay': 'blockquote',
            'display': display
        });

        this.toolbar.addEvents({
            'showtoolbar': function (cage) {
                this.setPosition(cage);
                this.setButtons(cage);
            }.bind(this),
            'command': this.quoteCommand.bind(this)
        });

    },

    'setPosition': function (cage) {

        var coords = this.parchment.editor.getCoordinates(),
            position = cage.hasClass('left') ? 'left' : cage.hasClass('right') ? 'right' : 'center',
            left = false;

        switch (position) {
        case 'left':
            left = coords.left;
            break;
        case 'right':
            left = coords.left + coords.width - this.toolbar.toolbar.getCoordinates().width;
            break;
        default:
            break;
        }

        if (left) {
            this.toolbar.toolbar.setStyle('left', left);
        }

    },

    'setButtons': function (cage) {
        var position = cage.hasClass('left') ? 'left' : cage.hasClass('right') ? 'right' : 'center',
            size = cage.hasClass('large') ? 'large' : cage.hasClass('medium') ? 'medium' : 'small';

        this.toolbar.toolbar.getElements('button').removeClass('on');
        this.toolbar.toolbar.getElements('button.' + size + ', button.' + position).addClass('on');
    },

    'quoteCommand': function (command) {

        var blockquote = this.toolbar.toolbar.retrieve('cage');

        switch (command) {
            case 'left':
                blockquote.removeClass('right').addClass('left');
                break;
            case 'right':
                blockquote.removeClass('left').addClass('right');
                break;
            case 'center':
                blockquote.removeClass('left').removeClass('right');
                break;
            case 'large':
                blockquote.removeClass('medium').addClass('large');
                break;
            case 'medium':
                blockquote.removeClass('large').addClass('medium');
                break;
            case 'small':
                blockquote.removeClass('large').removeClass('medium');
                break;
            case 'up':
                if (blockquote.getPrevious()) {
                    blockquote.inject(blockquote.getPrevious(), 'before');
                }
                break;
            case 'down':
                if (blockquote.getNext()) {
                    blockquote.inject(blockquote.getNext(), 'after');
                }
                break;
            case 'credit':
                var credit = blockquote.getElement('cite') || new Element('cite', {'text': 'Credit'}),
                    userSelection = this.parchment.getSelectionObject(),
                    range = this.parchment.getRangeObject(userSelection);

                credit.inject(blockquote);

                range.setStart(credit, 0);
                range.setEnd(credit, 0);
                userSelection.removeAllRanges();
                userSelection.addRange(range);

                break;
            case 'remove':
                blockquote.destroy();
                break;
            default:
                break;

        }

        this.setButtons(blockquote);
        this.toolbar.setPosition(blockquote);
        this.setPosition(blockquote);

    }
};
