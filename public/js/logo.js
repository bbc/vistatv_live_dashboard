/* globals dashboardConfig */
(function(window) {
  "use strict";

  /**
   * A visual representation of a broadcast channel
   *
   * @param {Stats} item
   * @param {HTMLElement} logoEl The HTML element container in where the image will be injected
   * @constructor
   */
  var Logo = function (item, logoEl) {
    if (!dashboardConfig.logoTemplate || !dashboardConfig.logoMissing) {
      throw new Error('dashboardConfig.logoTemplate or dashboardConfig.logoMissing not set');
    }

    /**
     * Reference to the channel data
     * @type {Stats}
     */
    this.item = item;

    /**
     * Reference to the parent HTML element
     * @type {HTMLElement}
     */
    this.el = logoEl;

    /**
     * Reference to the newly created image
     * @type {Image|HTMLElement}
     */
    this.img = new Image();

    //this.img.src = this.imageMissing();
    this.img.src = this.channelLogoUrl(this.defaultFormat);

    this.img.onerror = this.imageMissing.bind(this);

    this.el.appendChild(this.img);
  };

  /**
   * Displays an alternative picture when hooked on `error` event.
   */
  Logo.prototype.imageMissing = function () {
    this.img.src = this.emptyCircleUrl(this.defaultFormat);
    this.el.appendChild(this.stationNameEl());
  };

  /**
   * Creates a channel name layout for a later use
   *
   * @returns {HTMLElement}
   */
  Logo.prototype.stationNameEl = function () {
    var span = document.createElement('span');
    span.textContent = this.item.getChannelName();
    return span;
  };

  /**
   * Returns a placeholder image URI to use as an alternate picture
   *
   * @param {String=} format
   * @returns {string} Logo image URI
   */
  Logo.prototype.emptyCircleUrl = function (format) {
    format = format || this.defaultFormat;

    return dashboardConfig.logoMissing.replace(/{{format}}/g, format);
  };


  /**
   * Computes an URI to use a channel logo as an image source
   *
   * @param {String=} format
   * @returns {string} Logo image URI
   */
  Logo.prototype.channelLogoUrl = function (format) {
    format = format || this.defaultFormat;

    return dashboardConfig.logoTemplate
      .replace(/{{format}}/g, format)
      .replace(/{{service_id}}/g, this.item.channel);
  };

  /**
   * Default format to display the logos
   * It will basically help you to use something else than SVG without altering this class, just by writing the following in app.js or anything else:
   * `Logo.prototype.defaultFormat = "png";`
   * It will look for pictures in `/img/png/<channel identifier>.png`
   * @type {string}
   */
  Logo.prototype.defaultFormat = "svg";

  /*
   Exporting
   */
  window['Logo'] = Logo;

}(window));