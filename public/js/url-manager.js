(function(window, undefined) {
  "use strict";

  /* globals Stats */

  /**
   * Service constructor
   *
   * @param {String} id
   * @constructor
   */
  var UrlManager = function UrlManager(opts) {
    var opts = opts || {};
    /**
     * 
     * @type {String}
     */
    this.key = opts.key;
    this.delim = opts.delim || ';';

    this.matcher = new RegExp(this.key + '=(.[^&]*)');
  };

  /**
   * Are there items to be read
   *
   * @api
   * 
   */
  UrlManager.prototype.hasItems = function hasItems() {
    return this.items().length > 0;
  };

  /**
   * Are there items to be read
   *
   * @api
   * 
   */
  UrlManager.prototype.items = function items() {
    var items = [];
    if (this.matcher.test(window.location.search)) {
      var matches = window.location.search.match(this.matcher);
      items = matches[1].split(',');
    }
    return items;
  };

  /**
   * Trigger a state change
   *
   */
  UrlManager.prototype.triggerStateChange = function() {
    var evt = $.Event('serviceStateChanged', {
      service: this
    });
    $(this).trigger(evt);
  };

  /*
   Exporting
   */
  window['UrlManager'] = UrlManager;

}(window));
