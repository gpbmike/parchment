// requires mootools 1.3+
Parchment.Plugins['Table'] = {
    'type': 'button',
    'attributes_whitelist': {
        'table': {
            'class': /with-out-border|with-border|t-editor|full-width|natural-width|t-user-list/
        }
    },
    'empty_node_whitelist': {
        'td': function () {
            return true;
        }
    },

    // call when the plugin loads
    'init': function () {

        // call this after parchment is ready or it kills the toolbar in firefox
        document.addEvent('load', function () {
            document.execCommand('enableInlineTableEditing', false, false);
        });

        this.parchment.editor.addEvents({
            'click': function () {
                if (this.menu) {
                    this.menu.destroy();
                }
            }.bind(this),
            'contextmenu': this.contextMenu.bind(this)
        });

        this.buildToolbar();
    },

    // called when the user clicks on the table button in the toolbar
    'callback': function (event) {

        this.parchment.editor.focus();
        this.parchment.insertCage(this.buildTableHTML(prompt("Rows?", "4"), prompt("Columns?", "3")));

    },

    'buildTableHTML': function (rows, cols) {
        cols = parseInt(cols, 10) ? parseInt(cols, 10) : 4;
        rows = parseInt(rows, 10) ? parseInt(rows, 10) : 3;

        var thead = '<thead><tr>' + Array(cols + 1).join('<th>Column Head</th>') + '</tr></thead>',
            tbody = '<tbody>' + Array(rows + 1).join('<tr>' + Array(cols + 1).join('<td>&nbsp;</td>') + '</tr>') + '</tbody>';

        return '<table class="t-editor with-border full-width">' + thead + tbody + '</table>';
    },

    'buildToolbar': function () {

        this.toolbar = new Parchment.Utils.Toolbar(this.parchment.editor, {
            'class': 'table',
            'relay': 'table',
            'display': {
                'borders': [
                    {'command': 'toggleborders', 'text': 'on'}
                ],
                'header': [
                    {'command': 'toggleheader', 'text': 'on'}
                ],
                'position': [
                    {'command': 'moveup', 'text': 'U'},
                    {'command': 'movedown', 'text': 'D'}
                ],
                'table': [
                    {'command': 'togglewidth', 'text': 'max-width'},
                    {'command': 'removetable', 'text': 'delete'},
                    {'command': 'breakout', 'text': 'magic show'}
                ]
            }
        });

        this.toolbar.addEvents({
            'showtoolbar': function (cage) {
                this.setToolbarButtons(cage);
            }.bind(this),
            'command': this.tableCommand.bind(this)
        });
    },

    'setToolbarButtons': function (cage) {
        this.toolbar.toolbar.getElements('button').removeClass('on');
        if (cage.hasClass('full-width')) {
            this.toolbar.toolbar.getElement('.togglewidth').addClass('on');
        }
        if (cage.hasClass('with-border')) {
            this.toolbar.toolbar.getElement('.toggleborders').addClass('on');
        }
        if (cage.getElement('thead')) {
            this.toolbar.toolbar.getElement('.toggleheader').addClass('on');
        }
    },

    'tableCommand': function (command) {

        var table = this.toolbar.toolbar.retrieve('cage'),
            selection = this.parchment.getSelectionObject(),
            range = this.parchment.getRangeObject(selection),
            target;

        switch (command) {
            case 'toggleheader':
                if (table.getElement('thead')) {
                    table.getElement('thead').destroy();
                } else {
                    var theadhtml = '<tr>' + Array(table.getElement('tr').getElements('td').length + 1).join('<th>Column Head</th>') + '</tr>',
                        thead = new Element('thead', {'html': theadhtml});

                    thead.inject(table, 'top');
                }
                break;
            case 'removetable':
                range.selectNode(table);
                range.deleteContents();
                break;
            case 'toggleborders':
                table.toggleClass('with-border');
                break;
            case 'togglewidth':
                table.toggleClass('full-width');
                break;
            case 'moveup':
                target = table.getPrevious();
                if (target) {
                    table.inject(target, 'before');
                }
                break;
            case 'movedown':
                target = table.getNext();
                if (target) {
                    table.inject(target, 'after');
                }
                break;
            case 'breakout':
                table.getElements('td').each(function (td) {
                    while (td.firstChild) {
                        table.parentNode.insertBefore(td.firstChild, table);
                    }
                    table.parentNode.insertBefore(document.createElement('br'), table);
                });
                table.destroy();
                this.parchment.clean({'add_paragraphs': true});
                break;
            default:
                break;
        }

        this.setToolbarButtons(table);
        this.toolbar.setPosition(table);
    },

    'contextMenu': function (e) {

        var node = e.target,
            zIndex = 0,
            td = false;

        // walk up the dom to see if you're in a TD/TH.
        // MAKE Z-INDEX OF TOOLBAR HIGHER THAN EDITOR DOM TREE
        while (node && node != this.parchment.editor) {
            td = td || (node.nodeName.test(/td/i) ? node : false);
            zIndex = Math.max(zIndex, node.getStyle('z-index').toInt() || 0);
            node = node.parentNode;
            if (td) {
                break;
            }
        }

        if (!td) {
            return;
        }

        e.stop();

        if (this.menu) {
            this.menu.destroy();
        }

        this.menu = new Element('div.parchment-2-edit-menu').setStyles({
            'top': e.page.y,
            'left': e.page.x
        }).inject(document.body);

        if (!!zIndex) {
            this.menu.setStyle('z-index', zIndex + 1);
        }

        var commands = [
            {'command': 'addrowbefore', 'text': 'Insert Row Up'},
            {'command': 'addrowafter', 'text': 'Insert Row Down'},
            {'command': 'addcolbefore', 'text': 'Insert Column Left'},
            {'command': 'addcolafter', 'text': 'Insert Column Right'},
            {'command': 'removerow', 'text': 'Delete Row'},
            {'command': 'removecol', 'text': 'Delete Column'}
        ];

        commands.each(function (command) {

            var a = new Element('button', {
                'text': command.text,
                'type': 'button'
            }).addEvent('click', this.cellCommand.pass([td, command.command], this)).inject(this.menu);

            var br = new Element('br').inject(this.menu);

        }.bind(this));

    },

    'cellCommand': function (node, command) {

        this.menu.destroy();

        // find position of the target cell
        var col = node.cellIndex,
            row = node.parentNode.rowIndex,
            table = node,
            clone = false,
            cloneholder = document.createElement('div'),
            selection = this.parchment.getSelectionObject(),
            range = this.parchment.getRangeObject(selection);

        // copy table
        while (table.nodeName.toLowerCase() !== 'table') {
            table = table.parentNode;
        }
        clone = table.cloneNode(true);
        cloneholder.appendChild(clone);

        // ALTER TABLE
        switch (command) {
            case 'addrowbefore':
                this.addRow(clone, row, 'before');
                break;
            case 'addrowafter':
                this.addRow(clone, row, 'after');
                break;
            case 'addcolbefore':
                this.addCol(clone, col, 'before');
                break;
            case 'addcolafter':
                this.addCol(clone, col, 'after');
                break;
            case 'removerow':
                clone.getElementsByTagName('tr')[row].parentNode.removeChild(clone.getElementsByTagName('tr')[row]);
                break;
            case 'removecol':
                clone.getElements('tr > *:nth-child(' + (col + 1) + ')').destroy();
                break;
            default:
                return;
        }

        // IE/Webkit will only select the contents of the node
        // need to select the table tag as well
        // this breaks UNDO
        if (this.parchment.browser.webkit || this.parchment.browser.msie) {
            var span = document.createElement('span');
            table.parentNode.insertBefore(span, table);
            span.appendChild(table);
            span.innerHTML = "&nbsp;" + span.innerHTML + "&nbsp;";
            table = span;
        }

        // select entire target table
        range.selectNode(table);
        selection.removeAllRanges();
        selection.addRange(range);

        this.parchment.saveSelection();

        // paste altered clone over target table
        this.parchment.insertHTML(cloneholder.innerHTML);
    },

    'addRow': function (clone, row, place) {
        // find target row in clone
        var tr = clone.getElementsByTagName('tr')[row],
            cols = tr.childNodes.length;

        // build row
        var newtr = document.createElement('tr');
        for (var c = 0; c < cols; c++) {
            newtr.appendChild(document.createElement('td'));
        }

        // insert row after target row
        newtr.inject(tr, place);
    },

    'addCol': function (clone, col, place) {

        // add a new cell to every row
        clone.getElements('tr').each(function (tr) {
            var newnode = tr.childNodes[col].nodeName.toLowerCase() == 'th' ? new Element('th') : new Element('td');
            newnode.inject(tr.childNodes[col], place);
        });
    }
};
