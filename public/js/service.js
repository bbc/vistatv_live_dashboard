(function(window, undefined) {
  "use strict";

  /* globals Stats */

  /**
   * Service constructor
   *
   * @param {String} id
   * @constructor
   */
  var Service = function Service(id) {
    /**
     * Channel service identifier
     * @type {String}
     */
    this.id = id;

    /**
     * If the channel is selected, it will be displayed in the UI (charts etc.)
     * @type {boolean}
     */
    this.isSelected = false;
  };

  /**
   * Returns a human readable label based on an identifier
   *
   * @api
   * @returns {String}
   */
  Service.prototype.displayName = function() {
    return Stats.humanize(this.id).replace(/^BBC/, '');
  };

  /*
   Exporting
   */
  window['Service'] = Service;

}(window));
