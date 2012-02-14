Parchment.Plugins['Code'] = {
    'type': 'button',
    'init': function () {
        this.parchment.editor.addEvent('beforeclean', function () {
            if (this.parchment.textarea.getStyle('display') != 'none') {
                this.toggleView();
            }
        }.bind(this));
    },
    'toggleView': function () {
        // EDIT HTML
        if (this.parchment.textarea.getStyle('display') == 'none') {

            var height = this.parchment.editor.getCoordinates().height,
                html = this.parchment.editor.get('html');

            this.parchment.editor.focus();
            this.parchment.clean({'add_paragraphs': true});

            this.parchment.editor.setStyle('display', 'none');

            // WE NEED THE HTML TO BE READABLE

            // insert new line before block level elements
            html = html.replace(/<(ADDRESS|BLOCKQUOTE|DIV|DL|FIELDSET|FORM|H1|H2|H3|H4|H5|H6|HR|NOSCRIPT|OL|P|PRE|TABLE|UL|DD|DT|LI|TBODY|TD|TFOOT|TH|THEAD|TR)([^>]*)>/gi, '\n\n<$1$2>');
            // insert new line after block level elements
            html = html.replace(/<\/(ADDRESS|BLOCKQUOTE|BR|DIV|DL|FIELDSET|FORM|H1|H2|H3|H4|H5|H6|HR|NOSCRIPT|OL|P|PRE|TABLE|UL|DD|DT|LI|TBODY|TD|TFOOT|TH|THEAD|TR)>/gi, '<\/$1>\n\n');
            html = html.replace(/<br>/gi, '<br>\n');
            html = html.replace(/\n{2,}/g, '\n\n');
            html = html.replace(/^\n+/g, '');
            html = html.replace(/\n+$/g, '');

            this.parchment.textarea.set('value', html);

            this.parchment.textarea.setStyles({
                'display': 'inline-block',
                'height': height
            });

        }

        // WYSIWYG
        else {

            this.parchment.textarea.setStyle('display', 'none');
            this.parchment.editor.setStyle('display', 'block');

            this.parchment.editor.set('html', this.parchment.textarea.value);

            this.parchment.editor.focus();
            this.parchment.clean({'add_paragraphs': true});
        }
    },
    'callback': function () {
        this.toggleView();
    }
};
