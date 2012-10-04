var Parchment = Parchment || {};

Parchment.commands = Parchment.commands || {};

Parchment.commands.image = {
    type: 'group',
    commands: [
        { command: 'insertImage', text: '<i class="icon-picture"></i>' },
        { command: 'insertEmbed', text: '<i class="icon-film"></i>' }
    ],
    init: function () {

        var self = this;

        $toolbar = $(this.toolbar);

        var insertImageModal = $(Mustache.render(Parchment.templates['dialog'], {
            title: 'Insert Image',
            body: '<input placeholder="http://" class="input-xlarge">',
            action: 'Insert Image'
        })).modal({
            show: false
        });

        var urlInput = insertImageModal.find('input'),
            insertButton = insertImageModal.find('a.btn-primary');

        $toolbar.find('a[data-wysihtml5-command=insertImage]').on('click', function() {
            insertImageModal.modal('show');
            return false;
        });

        insertImageModal.on('shown', function() {
            urlInput.focus();
        });

        insertImageModal.on('hide', function() {
            self.editor.currentView.element.focus();
        });

        var insertImage = function() {
            self.editor.composer.commands.exec("insertImage", urlInput.val());
            urlInput.val('');
        };

        urlInput.keypress(function (e) {
            if (e.which == 13) {
                insertImageModal.modal('hide');
                insertImage();
            }
        });

        insertButton.on('click', insertImage);
    }
};