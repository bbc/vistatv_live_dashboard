(function(window, undefined) {
  "use strict";

  /* globals Stats */

  /**
   * Service constructor
   *
   * @param {String} id
   * @constructor
   */
  var Service = function Service(id, title) {
    /**
     * Channel service identifier
     * @type {String}
     */
    this.id = id;

    /**
     * Human name for service
     * @type {String}
     */
    this.title = title;

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
    if (this.title) {
      return this.title;
    } else {
      return Stats.humanize(this.id);
    }
  };

  /**
   * Select this service
   * Fires a 'serviceStateChanged' event
   *
   * @api
   */
  Service.prototype.select = function() {
    this.isSelected = true;
    this.triggerStateChange();
  };

  /**
   * Deselect this service
   * Fires a 'serviceStateChanged' event
   *
   * @api
   */
  Service.prototype.deselect = function() {
    this.isSelected = false;
    this.triggerStateChange();
  };

  /**
   * Trigger a state change event
   */
  Service.prototype.triggerStateChange = function() {
    var evt = $.Event('serviceStateChanged', {
      service: this
    });
    $(this).trigger(evt);
  };

  /*
   Exporting
   */
  window['Service'] = Service;

}(window));
