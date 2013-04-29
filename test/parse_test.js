/*global Parchment:false */

(function($) {
  /*
    ======== A Handy Little QUnit Reference ========
    http://api.qunitjs.com/

    Test methods:
      module(name, {[setup][ ,teardown]})
      test(name, callback)
      expect(numberOfAssertions)
      stop(increment)
      start(decrement)
    Test assertions:
      ok(value, [message])
      equal(actual, expected, [message])
      notEqual(actual, expected, [message])
      deepEqual(actual, expected, [message])
      notDeepEqual(actual, expected, [message])
      strictEqual(actual, expected, [message])
      notStrictEqual(actual, expected, [message])
      throws(block, [expected], [message])
  */

  module('Parchment.parse', {
    // This will run before each test in this module.
    setup: function() {
      this.rules = $.fn.parchment.defaults.parser_rules;
      $.each(Parchment.default_commands, $.proxy(function (command_name, command) {
        $.extend(true, this.rules, command.parser_rules || {});
      }, this));
    }
  });

  test('Rename node', function() {
    expect(1);
    strictEqual(Parchment.parse('<b>bold</b>', this.rules), '<strong>bold</strong>', '<b> should change to <strong>');
  });

  test('Spacing', function() {
    expect(5);
    strictEqual(Parchment.parse('   text   is spaced ', this.rules), ' text is spaced ', 'should remove extra spaces');
    strictEqual(Parchment.parse('no\ttabs', this.rules), 'no tabs', 'should remove tabs');
    strictEqual(Parchment.parse('non&nbsp;breaking&nbsp;spaces', this.rules), 'non breaking spaces', 'should replace &nbsp; with space');
    strictEqual(Parchment.parse('no\nline\nbreaks', this.rules), 'no line breaks', 'should remove line breaks');
    strictEqual(Parchment.parse('<pre>preserve  spaces\ttabs\nline breaks</pre>', this.rules), '<pre>preserve  spaces\ttabs\nline breaks</pre>', 'should preserve whitespace in PRE');
  });

  test('Remove unknown empty nodes', function() {
    expect(2);
    strictEqual(Parchment.parse('<!-- COMMENT -->', this.rules), '', 'should remove HTML comments');
    strictEqual(Parchment.parse('<meta charset="utf-8">', this.rules), '', 'should remove unknown empty tags');
  });

  test('Handle unknown nodes with children', function() {
    expect(2);
    strictEqual(Parchment.parse('<abbr>something</abbr>', this.rules), '<span>something</span>', 'should convert unknown tags with children');
    strictEqual(Parchment.parse('<script>something</script>', this.rules), '', 'should remove script tags');
  });

  test('Convert CSS to HTML', function() {
    expect(5);
    strictEqual(Parchment.parse('<span style="font-weight:bold;">bold</span>', this.rules), '<strong>bold</strong>', 'should convert css bold to <strong>');
    strictEqual(Parchment.parse('<span style="font-style:italic;">italic</span>', this.rules), '<em>italic</em>', 'should convert css italic to <em>');
    strictEqual(Parchment.parse('<span style="text-decoration:underline;">underline</span>', this.rules), '<u>underline</u>', 'should convert css underline to <u>');
    strictEqual(Parchment.parse('<span style="text-decoration:line-through;">strike</span>', this.rules), '<strike>strike</strike>', 'should convert css line-through to <strike>');
    strictEqual(Parchment.parse('<b style="font-weight:normal;">normal</span>', this.rules), '<span>normal</span>', 'should convert <b> with css font-weight normal to <span>');
  });

}(jQuery));
