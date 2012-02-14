Parchment.Plugins['HTML'] = {
    'type': 'button',

    'attributes_whitelist': {
        'div': {
            'class': /js-item-cage/,
            'rel': /html/
        }
    },

    'init': function () {
        this.buildToolbar();
    },

    'callback': function (event) {
        this.openCodePanel();
    },

    'openCodePanel': function (html) {

        this.edit_mode = html ? true : false;

        if (!this.pad) {

            var str = '<div class="parchment-2-insert">';
            str += '<span class="description">Paste arbitrary HTML below:</span>';
            str +=      '<textarea rows="5" cols="80" class="link"></textarea>';
            str +=      '<a class="jsOk btn">Insert</a>';
            str +=  '</div>';

            var linkPanel = new Element('div', {'html': str}).inject(document.body);

            this.inputField = linkPanel.getElement('.link');

            linkPanel.getElement('.jsOk').addEvent('click', this.save.bind(this));

            this.pad = new LaunchPad.Base({'titleTextStr': 'Embed HTML/Flash', 'destroy_on_hide': false});
            this.pad.insert(linkPanel);

            this.pad.addEvent('hideComplete', function () {
                this.inputField.value = '';
            }.bind(this));

        } else {
            this.pad.show();
        }

        this.inputField.select();

        if (html) {
            this.inputField.value = html;
        }

    },

    'save': function (event) {
        event.stop();

        // If you're editing, remove old video before inserting new one
        if (this.edit_mode) {
            this.toolbar.toolbar.retrieve('cage').destroy();
        }

        var html = this.inputField.value;

        this.pad.hide();

        // this relies on insertHTML to clean up bad syntax
        this.parchment.insertCage('<div class="js-item-cage" rel="html">' + html + '</div>');

    },

    'buildToolbar': function () {
        this.toolbar = new Parchment.Utils.Toolbar(this.parchment.editor, {
            'class': 'spoiler',
            'relay': '.js-item-cage[rel="html"]',
            'display': {
                'position': [
                    {'text': 'U', 'command': 'up'},
                    {'text': 'D', 'command': 'down'}
                ],
                'change': [
                    {'text': 'edit', 'command': 'edit'},
                    {'text': 'remove', 'command': 'remove'}
                ]
            }
        });

        this.toolbar.addEvents({
            'command': this.htmlCommand.bind(this)
        });
    },

    'htmlCommand': function (command) {

        var html = this.toolbar.toolbar.retrieve('cage');

        switch (command) {
            case 'up':
                if (html.getPrevious()) {
                    html.inject(html.getPrevious(), 'before');
                }
                break;
            case 'down':
                if (html.getNext()) {
                    html.inject(html.getNext(), 'after');
                }
                break;
            case 'remove':
                html.destroy();
                this.toolbar.toolbar.removeClass('on');
                break;
            case 'edit':
                this.openCodePanel(html.get('html'));
                break;
            default:
                break;
        }

    }

};
