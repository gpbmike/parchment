Parchment.Utils = {};

Parchment.Utils.Cage = new Class({
    Implements: [Events, Options],

    initialize: function (options) {
        this.setOptions(options);
    }
});

Parchment.Utils.Toolbar = new Class({
    Implements: [Events, Options],

    initialize: function (editor, options) {

        if (!editor) {
            alert('editor does not exist');
            return;
        }

        this.setOptions(options);

        this.editor = editor;

        this.buildToolbar();
    },

    buildToolbar: function () {
        this.toolbar = new Element('div.parchment-2-toolbar').inject(document.body);

        // MAKE Z-INDEX OF TOOLBAR HIGHER THAN EDITOR DOM TREE
        var node = this.editor,
            zIndex = parseInt(this.toolbar.getStyle('z-index'), 10) || 0;

        while (node && node != document) {
            zIndex = Math.max(zIndex, parseInt(node.getStyle('z-index'), 10) || 0);
            node = node.parentNode;
        }

        if (!!zIndex) {
            this.toolbar.setStyle('z-index', zIndex + 1);
        }

        this.toolbar.addClass(this.options['class']);

        // BUILD INTERNALS
        Object.each(this.options.display, function (buttons, text) {
            this.addSpan(text);
            buttons.each(this.addButton.bind(this));
        }.bind(this));

        // SHOW/HIDE TOOLBAR WHEN MOUSING OVER TOOLBAR
        this.toolbar.addEvents({
            'mouseover': function  () {
                clearTimeout(this.hidetoolbar);
            }.bind(this),
            'mouseout': function () {
                this.hidetoolbar = setTimeout(function () {
                    this.toolbar.removeClass('on');
                }.bind(this), 500);
            }.bind(this)
        });

        // SHOW TOOLBAR WHEN MOUSING OVER CAGE
        this.editor.addEvent('mouseover:relay(' + this.options.relay + ')', function (event, cage) {

            clearTimeout(this.hidetoolbar);

            this.toolbar.addClass('on');

            this.setPosition(cage);

            this.toolbar.store('cage', cage);

            this.fireEvent('showtoolbar', cage);

        }.bind(this));


        // HIDE TOOLBAR WHEN MOUSING OUT OF CAGE
        this.editor.addEvent('mouseout:relay(' + this.options.relay + ')', function (event, cage) {

            this.hidetoolbar = setTimeout(function () {

                this.toolbar.removeClass('on');

                this.fireEvent('hidetoolbar');

            }.bind(this), 500);

        }.bind(this));
    },

    setPosition: function (cage) {
        var coords = cage.getCoordinates();

        this.toolbar.setStyles({
            'top': coords.top - this.toolbar.getCoordinates().height,
            'left': coords.left + (coords.width / 2) - (this.toolbar.getCoordinates().width / 2)
        });
    },

    addSpan: function (text) {
        var el = new Element('span', {'text': text}).inject(this.toolbar);
    },

    addButton: function (button) {
        var el = new Element('button', {'text': button.text, 'type': 'button', 'class': button.command.replace(' ', '-').toLowerCase()}).inject(this.toolbar);
        el.addEvent('click', this.fireEvent.pass(['command', button.command], this));
        this.toolbar.removeClass('on');
    }
});
