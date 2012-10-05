/*
 *  requires: mustache.js
 */

var Parchment = function(textarea, options) {

    var name,
        i = 0,
        init_commands = [];

    options = options || {};

    var parseCommand = function (command) {
        if (command.init) {
            init_commands.push(command.init);
        }
        if (command.parserRules) {
            options.parserRules = $.extend(true, options.parserRules, command.parserRules);
        }
    };

    // go through each command and tease out init callbacks and parser rules
    $.each(options.commands || [], function (i, command) {

        if (command.commands) {
            $.each(command.commands, function (i, command) {
                parseCommand(command);
            });
        }

        parseCommand(command);

    });

    this.textarea = textarea;
    this.toolbar =  options.toolbar = this.createToolbar(textarea, options);
    this.editor =   new wysihtml5.Editor(textarea, options);

    // editor is ready, initialize commands
    for (name in init_commands) {
        init_commands[name].call(this);
    }

};

Parchment.commands = {};
Parchment.templates = {};

Parchment.utils = {
    addCommand: function (commandName, params) {
        Parchment.commands[commandName] = params;
    },
    commandGroup: function (commandName, commands, options) {

        options = options || {};

        Parchment.commands[commandName] = {
            commands: $.map(commands, function (command) { return Parchment.commands[command]; })
        };

        if (options.type) {
            Parchment.commands[commandName].type = options.type;
        }
    }
};

Parchment.prototype = {
    createToolbar: function (textarea, options) {

        options = options || {};

        var temp = document.createElement('div'),
            toolbar_inner = '',
            commands = options.commands || Parchment.commands,
            templates = options.templates || Parchment.templates;

        $.each(commands, function (i, command) {

            var commands = [command.command];

            if (command.commands) {
                commands = $.map(command.commands, function (command) { return command.command; });
            }

            toolbar_inner += Mustache.render(templates[command.type || 'command'], { commands: commands }, templates.partials);

        });

        temp.innerHTML = Mustache.render(Parchment.templates['toolbar'], toolbar_inner);

        var toolbar = temp.firstChild;

        textarea.parentNode.insertBefore(toolbar, textarea);

        return toolbar;
    }
};

$.fn.parchment = function (options) {
    return this.each(function () {

        $this = $(this);

        var name,
            these_options = options || {},
            formatted_commands = [];

        command_list = these_options.commands || $this.data('parchment-commands') || [];

        for (name in command_list) {
            formatted_commands.push(Parchment.commands[command_list[name]]);
        }

        these_options.commands = formatted_commands;

        var parchment = new Parchment(this, these_options);

        $(parchment.editor.composer.iframe.contentWindow).on('focus.wysihtml5', function () {
            $('li.dropdown').removeClass('open');
        });

    });
};