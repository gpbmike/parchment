ParchmentHeader = function (tag) {
    return {
        'type': 'button',
        'attributes_whitelist': {
            'h2': {
                'data-section-id': /\d+/
            },
            'h3': {
                'data-section-id': /\d+/
            },
            'h4': {
                'data-section-id': /\d+/
            }
        },
        'init': function () {
            document.addEvent('parchmentready', function () {
                this.parchment.toolbar.getElement('.dropdown .paragraph').addClass('on');
            }.bind(this));

            var _this = this;
            this.parchment.editor.addEvents({

                // PATCH NOTES: This function makes it so when you change from a header to a non header while typing
                // (Like for instance right after you hit enter after a header) the paragraph drop down correctly changes.
                // Before it would just stay whatever it was until you actually moved the cursor without typing.
                'keyup': function (event) {

                    var userSelection = _this.parchment.getSelectionObject(),
                    node = userSelection.anchorNode,
                    button = false;

                    while (node && node != _this.editor) {
                        if (node.className && node.className.test(/p/i)) {
                            button = _this.parchment.toolbar.getElement('.paragraph');
                        }
                        if (node.nodeName && node.nodeName.test(/h2/i)) {
                            button = _this.parchment.toolbar.getElement('.header-2');
                            break;
                        }
                        if (node.nodeName && node.nodeName.test(/h3/i)) {
                            button = _this.parchment.toolbar.getElement('.header-3');
                            break;
                        }
                        if (node.nodeName && node.nodeName.test(/h4/i)) {
                            button = _this.parchment.toolbar.getElement('.header-4');
                            break;
                        }

                        if(button)
                        {
                            button.addClass('on');
                            _this.parchment.toolbar.getElement('.dropdown > button').set('text', button.get('text'));
                        }

                        node = node.parentNode;
                    }

                },
                'nodetreechange': function (tag_tree, node_tree) {
                    var button = false;

                    switch (tag) {
                    case 'p':
                        button = this.parchment.toolbar.getElement('.paragraph');
                        break;
                    case 'h2':
                        button = this.parchment.toolbar.getElement('.header-2');
                        break;
                    case 'h3':
                        button = this.parchment.toolbar.getElement('.header-3');
                        break;
                    case 'h4':
                        button = this.parchment.toolbar.getElement('.header-4');
                        break;
                    default:
                        break;
                    }

                    if (tag_tree.contains(tag.toUpperCase())) {
                        button.addClass('on');
                        this.parchment.toolbar.getElement('.dropdown > button').set('text', button.get('text'));
                    } else {
                        button.removeClass('on');
                    }

                }.bind(this)
            });
        },
        'callback': function () {
            document.execCommand('formatblock', null, '<' + tag.toUpperCase() + '>');
            this.parchment.buildNodeTree();
        }
    };
};

Parchment.Plugins['Paragraph'] = ParchmentHeader('p');
Parchment.Plugins['Header 2'] = ParchmentHeader('h2');
Parchment.Plugins['Header 3'] = ParchmentHeader('h3');
Parchment.Plugins['Header 4'] = ParchmentHeader('h4');
