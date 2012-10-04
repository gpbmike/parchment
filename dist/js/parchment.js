/*
 *  requires: mustache.js
 */

var Parchment = function(textarea, options) {
    this.textarea = textarea;
    this.toolbar = options.toolbar = this.createToolbar(textarea, options);
    this.editor =  this.createEditor(textarea, options);

    // want to signal that parchment is ready and trigger any itit callbacks from commands
    for (var index in options.commands) {
        var command = options.commands[index];
        if (command.init) {
            $.proxy(command.init, this)();
        }
    }

    // close dropdowns when you focus on the editor
    $('iframe.wysihtml5-sandbox').each(function(i, el){
        $(el.contentWindow).off('focus.wysihtml5').on({
          'focus.wysihtml5' : function(){
             $('li.dropdown').removeClass('open');
           }
        });
    });
};

Parchment.commands = {};
Parchment.templates = {};

Parchment.prototype = {
    createToolbar: function (textarea, options) {

        options = options || {};

        var temp = document.createElement('div'),
            toolbar_inner = '',
            commands = options.commands || Parchment.commands,
            templates = options.templates || Parchment.templates;

        for (var index in commands) {
            var group = commands[index];
            toolbar_inner += Mustache.render(templates[group.type], group, templates.partials);
        }

        temp.innerHTML = Mustache.render(Parchment.templates['toolbar'], toolbar_inner);

        var toolbar = temp.firstChild;

        textarea.parentNode.insertBefore(toolbar, textarea);

        return toolbar;
    },

    createEditor: function (textarea, options) {
        return new wysihtml5.Editor(textarea, options);
    }
};

$.fn.parchment = function (options) {
    return this.each(function () {

        $this = $(this);

        var these_options = options || {};

        these_options.commands = $.map(these_options.commands || $this.data('commands') || [], function (command) { return Parchment.commands[command]; });

        new Parchment(this, these_options);

    });
};