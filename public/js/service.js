(function(window, undefined) {
  "use strict";

  /* globals Stats */

  /**
   * Service constructor
   *
   * @param {String} id
   * @constructor
   */
  var Service = function Service(id, title, logoId) {
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
     * An id to use for a logo, overrides the default 
     * service id
     * 
     * @type {String}
     */
    this._logoId = logoId;


    /**
     * If the channel is selected, it will be displayed in the UI (charts etc.)
     * @type {boolean}
     */
    this.isSelected = false;
  };

  /**
   * Returns an ID to use when fetching a logo
   *
   * @api
   * @returns {String}
   */
  Service.prototype.logoId = function() {
    if (this._logoId) {
      return this._logoId;
    } else {
      return this.id;
    }
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
