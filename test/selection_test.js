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

  module('Parchment.selection', {
    // This will run before each test in this module.
    setup: function() {
      window.rangy.init();
      this.fixture = document.getElementById('qunit-fixture');
    }
  });

  test('Select Node', function() {
    var range = rangy.createRange();
    range.selectNode($(this.fixture).find('h1').get(0));
    var sel = rangy.getSelection();
    sel.setSingleRange(range);
    console.log(sel);

    expect(2);
    strictEqual(sel.toString(), 'HTML Ipsum Presents', 'selection to string');
    strictEqual(sel.toHtml(), '<h1>HTML Ipsum Presents</h1>', 'selection to HTML');
  });

}(jQuery));
