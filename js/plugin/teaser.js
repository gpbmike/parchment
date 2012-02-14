Parchment.Plugins['Teaser'] = {
    'type': 'button',
    'attributes_whitelist': {
        'hr': {
            'class': /parchment-teaser/
        }
    },
    'empty_node_whitelist': {
        'span': function (node) {
            return node.hasClass('parchment-teaser');
        }
    },
    'init': function () {

        // convert == TEASER == to something more visual
        this.parchment.editor.innerHTML = this.parchment.editor.innerHTML.replace('== TEASER ==', '<hr class="parchment-teaser">');

        // when form is being saved, convert <hr> back to == TEASER ==
        this.parchment.textarea.form.addEvent('submit', function () {
            this.parchment.textarea.value = this.parchment.textarea.value.replace('<hr class="parchment-teaser">', '== TEASER ==');
        }.bind(this));

        // click on teaser line to remove
        this.parchment.editor.addEvents({
            'click:relay(.parchment-teaser)': function (event, div) {
                div.destroy();
            }
        });

    },
    'callback': function () {

        this.parchment.restoreSelection();

        var userSelection = this.parchment.getSelectionObject(),
            range = this.parchment.getRangeObject(userSelection);

        range.collapse(true);

        var node = range.startContainer;

        // move up to the top level
        while (node != this.parchment.editor && !node.nodeName.test(/td/i) && node.parentNode != this.parchment.editor && !node.parentNode.nodeName.test(/td/i)) {
            node = node.parentNode;
        }

        // insert before this node
        if (node.parentNode == this.parchment.editor) {
            range.setStartBefore(node);
            range.setEndBefore(node);
        }

        userSelection.removeAllRanges();
        userSelection.addRange(range);

        this.parchment.saveSelection();

        this.parchment.insertHTML('<hr class="parchment-teaser">');
    }
};
