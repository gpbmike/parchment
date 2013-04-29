(function(Parchment) {

  "use strict";

  var commands = {},
      plugins = {},
      // Shortcut
      docExec = function (commandName, showDefaultUI, value) {
        document.execCommand(commandName, showDefaultUI || null, value || null);
      };

  // <strong>
  // <b> => <strong>
  commands.bold = {
    exec: function () {
      docExec('bold');
    },
    state: function () {

    },
    parser_rules: {
      tags: {
        strong: {},
        b: "strong"
      }
    }
  };

  // <em>
  // <i> => <em>
  commands.italic = {
    exec: function () {
      docExec('italic');
    },
    state: function () {

    },
    parser_rules: {
      tags: {
        em: {},
        i: "em"
      }
    }
  };

  // <u>
  commands.underline = {
    exec: function () {
      docExec('underline');
    },
    state: function () {

    },
    parser_rules: {
      tags: {
        u: {}
      }
    }
  };

  // <strike>
  commands.strikethrough = {
    exec: function () {
      docExec('striketrhough');
    },
    state: function () {

    },
    parser_rules: {
      tags: {
        strike: {}
      }
    }
  };

  // <pre>
  commands.pre = {
    exec: function () {

    },
    state: function () {

    },
    parser_rules: {
      tags: {
        pre: {}
      }
    }
  };

  // Global API
  Parchment.default_commands = commands;

})(window.Parchment || {});

/*
// these are built in commands that we can use
Parchment.Plugins = {
  'Bold': function () {

    window.console.log(this);

    function Bold () {
      var _this = this;
      $(this.parchment.editor).on({
        'keydown': function (event) {
          if ((event.metaKey || event.ctrlKey) && String.fromCharCode(event.which) === 'B') {
            event.preventDefault();
            docExec('bold');
            $(_this.button).toggleClass('on');
          }
        },
        'nodetreechange': function (event, tag_tree) {
          if (tag_tree.indexOf('B') > -1 || tag_tree.indexOf('STRONG') > -1) {
            $(_this.button).addClass('on');
          } else {
            $(_this.button).removeClass('on');
          }
        }
      });
    }

    Bold.parser_rules = {
    };

    return Bold;

    // return {
    //   'type': 'button',
    //   'init': function () {

    //   },
    //   'callback': function () {
    //     docExec('bold');
    //     $(this.button).toggleClass('on');
    //   },
    // };
  },
    'Italic': function () {
        return {
            'type': 'button',
            'init': function () {
                var _this = this;
                $(this.parchment.editor).on({
                    'keydown': function (event) {
                        if ((event.metaKey || event.ctrlKey) && String.fromCharCode(event.which) === 'I') {
                            event.preventDefault();
                            docExec('italic');
                            $(_this.button).toggleClass('on');
                        }
                    },
                    'nodetreechange': function (event, tag_tree) {
                        if (tag_tree.indexOf('I') > -1 || tag_tree.indexOf('EM') > -1) {
                            $(_this.button).addClass('on');
                        } else {
                            $(_this.button).removeClass('on');
                        }
                    }
                });
            },
            'callback': function () {
                docExec('italic');
                $(this.button).toggleClass('on');
            },
            parser_rules: {
              tags: {
                em: {},
                i: {
                  rename_tag: "em"
                }
              }
            }
        };
    },
    'Underline': function () {
        return {
            'type': 'button',
            'init': function () {
                // PATCH NOTES: Same as above, the button does not toggle when you press CTRL-U
                var _this = this;
                $(this.parchment.editor).on({
                    'keydown': function (event) {
                        if ((event.metaKey || event.ctrlKey) && String.fromCharCode(event.which) === 'U') {
                            event.preventDefault();
                            docExec('underline');
                            $(_this.button).toggleClass('on');
                        }
                    },
                    'nodetreechange': function (event, tag_tree) {
                        if (tag_tree.indexOf('U') > -1) {
                            $(_this.button).addClass('on');
                        } else {
                            $(_this.button).removeClass('on');
                        }
                    }
                });
            },
            'callback': function () {
                docExec('underline');
                $(this.button).toggleClass('on');
            },
            parser_rules: {
              tags: {
                u: {}
              }
            }
        };
    },
    'Strikethrough': function () {
        return {
            'type': 'button',
            'init': function () {
                var _this = this;
                $(this.parchment.editor).on({
                    'nodetreechange': function (event, tag_tree) {
                        if (tag_tree.indexOf('STRIKE') > -1) {
                            $(_this.button).addClass('on');
                        } else {
                            $(_this.button).removeClass('on');
                        }
                    }
                });
            },
            'callback': function () {
                docExec('strikethrough');
                $(this.button).toggleClass('on');
            },
            parser_rules: {
              tags: {
                strike: {}
              }
            }
        };
    },
    'Ordered List': function () {
        return {
            'type': 'button',
            'init': function () {
                var _this = this;
                $(this.parchment.editor).on({
                    'nodetreechange': function (event, tag_tree) {
                        if (tag_tree.indexOf('OL') > -1) {
                            $(_this.button).addClass('on');
                        } else {
                            $(_this.button).removeClass('on');
                        }
                    }
                });
            },
            'callback': function () {
                docExec('insertOrderedList');
                this.parchment.buildNodeTree();
            },
            parser_rules: {
              tags: {
                ol: {},
                li: {}
              }
            }
        };
    },
    'Unordered List': function () {
        return {
            'type': 'button',
            'init': function () {
                var _this = this;
                $(this.parchment.editor).on({
                    'nodetreechange': function (event, tag_tree) {
                        if (tag_tree.indexOf('UL') > -1) {
                            $(_this.button).addClass('on');
                        } else {
                            $(_this.button).removeClass('on');
                        }
                    }
                });
            },
            'callback': function () {
                docExec('insertUnorderedList');
                this.parchment.buildNodeTree();
            },
            parser_rules: {
              tags: {
                ul: {},
                li: {}
              }
            }
        };
    },
    'Remove Format': function () {
        return {
            'type': 'button',
            'callback': function () {
                docExec('removeFormat');
                this.parchment.buildNodeTree();
            }
        };
    },
    'Clean': function () {
        return {
            'type': 'button',
            'callback': function () {
                this.parchment.clean({'add_paragraphs': true});
            }
        };
    }
};
*/
