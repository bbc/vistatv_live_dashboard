(function(window, undefined) {
  "use strict";

  /**
   * UrlManager constructor
   *
   * @param {Object} opts
   * @constructor
   */
  var UrlManager = function UrlManager(opts) {
    var opts = opts || {};
    /**
     * The query string key to use
     * @type {String}
     */
    this.key = opts.key;

    /**
     * The delimeter to use within the query string list
     * @type {String}
     */    
    this.delim = opts.delim || ';';

    /**
     * @private
     * @type {RegExp}
     */ 
    this._matcher = new RegExp(this.key + '=(.[^&]*)');
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
   * Items in the query string
   *
   * @api
   */
  UrlManager.prototype.items = function items() {
    var items = [];
    if (this._matcher.test(window.location.search)) {
      var matches = window.location.search.match(this._matcher);
      items = matches[1].split(',');
    }
    return items;
  };

  /*
   Exporting
   */
  window['UrlManager'] = UrlManager;

}(window));
