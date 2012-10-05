/* HEADERS */
Parchment.utils.addCommand('formatBlock-p', {
    command: { command: 'formatBlock', value: 'p', text: 'Normal Text' },
    parserRules: { tags: { p: { } } }
});

Parchment.utils.addCommand('formatBlock-h1', {
    command: { command: 'formatBlock', value: 'h1', text: 'Heading 1' },
    parserRules: { tags: { h1: { } } }
});

Parchment.utils.addCommand('formatBlock-h2', {
    command: { command: 'formatBlock', value: 'h2', text: 'Heading 2' },
    parserRules: { tags: { h2: { } } }
});

Parchment.utils.addCommand('formatBlock-h3', {
    command: { command: 'formatBlock', value: 'h3', text: 'Heading 3' },
    parserRules: { tags: { h3: { } } }
});

Parchment.utils.commandGroup('headers', [ 'formatBlock-p', 'formatBlock-h1', 'formatBlock-h2', 'formatBlock-h3' ], {
    type: 'dropdown',
    init: function () {
        $toolbar = $(this.toolbar);
        $toolbar.find("a[data-wysihtml5-command='formatBlock']").filter(function () {
            return $.inArray($(this).data('wysihtml5-command-value'), ['p', 'h1', 'h2', 'h3']) >= 0;
        }).on('click', function(e) {
            $toolbar.find('.current-font').text($(this).text());
        });
    }
});


/* EMPHASIS */
Parchment.utils.addCommand('bold', {
    command: { command: 'bold', text: '<i class="icon-bold"></i>', title: 'Bold' },
    parserRules: { tags: { strong: { }, b: { rename_tag: 'strong' } } }
});

Parchment.utils.addCommand('italic', {
    command: { command: 'italic', text: '<i class="icon-italic"></i>', title: 'Italic' },
    parserRules: { tags: { em: { }, i: { rename_tag: 'em' } } }
});

Parchment.utils.addCommand('underline', {
    command: { command: 'underline', text: '<i class="icon-underline"></i>', title: 'Underline' },
    parserRules: { tags: { u: { } } }
});

Parchment.utils.addCommand('strikethrough', {
    command: { command: 'strikethrough', text: '<i class="icon-strikethrough"></i>', title: 'Strikethrough' },
    parserRules: { tags: { strike: { } } }
});

Parchment.utils.addCommand('removeFormat', {
    command: { command: 'removeFormat', text: '<i class="icon-remove"></i>', title: 'Remove Format' }
})

Parchment.utils.commandGroup('emphasis', [ 'bold', 'italic', 'underline', 'strikethrough', 'removeFormat' ]);


/* LISTS */
Parchment.utils.addCommand('unorderedList', {
    command: { command: 'insertUnorderedList', text: '<i class="icon-list-ul"></i>', title: 'Unordered List' },
    parserRules: { tags: { li: { }, ul: { } } }
});

Parchment.utils.addCommand('orderedList', {
    command: { command: 'insertOrderedList', text: '<i class="icon-list-ol"></i>', title: 'Ordered List' },
    parserRules: { tags: { li: { }, ol: { } } }
});

Parchment.utils.commandGroup('lists', [ 'orderedList', 'unorderedList' ]);

Parchment.utils.addCommand('link', {
    command: { command: 'createLink', text: '<i class="icon-link"></i>' },
    parserRules: {
        tags: {
            a: {
                set_attributes: {
                    target: "_blank",
                    rel:    "nofollow"
                },
                check_attributes: {
                    href:   "url" // important to avoid XSS
                }
            }
        }
    },
    init: function () {

        var self = this;

        $toolbar = $(this.toolbar);

        var insertLinkModal = $(Mustache.render(Parchment.templates['dialog'], {
            title: 'Insert Link',
            body: '<input placeholder="http://" class="input-xlarge">',
            action: 'Insert Link'
        })).modal({
            show: false
        });

        var urlInput = insertLinkModal.find('input'),
            insertButton = insertLinkModal.find('a.btn-primary');

        $toolbar.find('a[data-wysihtml5-command=createLink]').on('click', function() {
            insertLinkModal.modal('show');
            return false;
        });

        insertLinkModal.on('shown', function() {
            urlInput.focus();
        });

        insertLinkModal.on('hide', function() {
            self.editor.currentView.element.focus();
        });

        var insertLink = function() {
            self.editor.composer.commands.exec("createLink", {
                href: urlInput.val(),
                target: "_blank",
                rel: "nofollow"
            });
            urlInput.val('');
        };

        urlInput.keypress(function (e) {
            if (e.which == 13) {
                insertLinkModal.modal('hide');
                insertLink();
            }
        });

        insertButton.on('click', insertLink);
    }
});

Parchment.utils.addCommand('html', {
    command: { action: 'change_view', text: '<i class="icon-cogs"></i>', title: 'HTML View' },
    init: function () {
        var toolbar = $(this.toolbar);
        var changeViewSelector = "a[data-wysihtml5-action='change_view']";
        toolbar.find(changeViewSelector).on('click', function (e) {
            toolbar.find('a.btn').not(changeViewSelector).toggleClass('disabled');
        });
    }
});

Parchment.utils.addCommand('blockquote', {
    command: { command: 'formatBlock', value: 'blockquote', text: '<i class="icon-comment"></i>', title: 'Blockquote' }
});


/* MEDIA */
Parchment.utils.addCommand('image', {
    command: { command: 'insertImage', text: '<i class="icon-picture"></i>' },
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
});

Parchment.utils.addCommand('embed', {
    command: { command: 'insertEmbed', text: '<i class="icon-film"></i>' }
});

Parchment.utils.commandGroup('media', [ 'image', 'embed' ]);


/* TEMPLATES */
Parchment.templates = {
    toolbar: '<ul class="wysihtml5-toolbar unstyled">{{&.}}</ul>',
    dropdown: '<li class="btn-group dropdown">{{>dropdown_text}}<ul class="dropdown-menu">{{#commands}}<li>{{>command}}</li>{{/commands}}</ul></li>',
    command: '<li class="btn-group">{{#commands}}{{>btn}}{{/commands}}</li>',
    dialog: "<div class='modal hide fade'>" +
                "<div class='modal-header'>" +
                    "<a class='close' data-dismiss='modal'>&times;</a>" +
                    "<h3>{{title}}</h3>" +
                "</div>" +
                "<div class='modal-body'>{{&body}}</div>" +
                "<div class='modal-footer'>" +
                    "<a href='#' class='btn' data-dismiss='modal'>Cancel</a>" +
                    "<a href='#' class='btn btn-primary' data-dismiss='modal'>{{action}}</a>" +
                "</div>" +
            "</div>",
    partials: {
        dropdown_text:  '<a class="btn dropdown-toggle" data-toggle="dropdown" href="#">' +
                            '<i class="icon-font"></i>&nbsp;<span class="current-font">Normal text</span>&nbsp;<b class="caret"></b>' +
                        '</a>',
        command: '<a{{>action}}{{>command_attr}}{{>value_attr}}{{>title_attr}}>{{&text}}</a>',
        btn: '<a class="btn"{{>action_attr}}{{>command_attr}}{{>value_attr}}{{>title_attr}}>{{&text}}</a>',
        action_attr: '{{#action}} data-wysihtml5-action="{{action}}"{{/action}}',
        command_attr: '{{#command}} data-wysihtml5-command="{{command}}"{{/command}}',
        value_attr: '{{#value}} data-wysihtml5-command-value="{{value}}"{{/value}}',
        title_attr: '{{#title}} title="{{title}}"{{/title}}'
    }
};

$('textarea').parchment();

$(prettyPrint);