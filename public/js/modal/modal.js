(function ($, window, document, undefined) {
  "use strict";
  /* global jQuery */

  /**
   * Digit associated to the Esc keyboard key
   * @type {number}
   */
  var KEY_ESC = 27;

  /**
   * Binds a Modal Handler to ease
   * @constructor
   */
  var ModalHandler = function ModalHandler() {
    this.$document = $(document);
    this.$body = $(document.body);

    this._initClickEvents();
    this._initKeyboardEvents();
  };

  /**
   * Initialize the behavior on clicks
   * It uses event delegation
   *
   * Add `data-toggle="modal"` to modal openers/closers to trigger them
   *
   * @see example.html
   * @this ModalHandler
   * @private
   */
  ModalHandler.prototype._initClickEvents = function _initClickEvents() {
    var self = this;

    this.$document.on('click', '[data-toggle="modal"]', function dataToggleHandler(event) {
      var $source = $(this);
      var $modal = self.getElementFromHref($source.attr('href'));

      event.preventDefault();

      // Showing a modal
      if ($modal && !self.isVisible($modal)) {
        self.show($modal);
      }

      // Otherwise closing the related modal
      $modal = self.getEnclosing($source);

      if ($modal) {
        self.hide($modal);
      }
    });
  };

  /**
   * Intercepts ESC keyboard interaction to close every opened modals
   *
   * @private
   */
  ModalHandler.prototype._initKeyboardEvents = function _initKeyboardEvents() {
    var self = this;

    this.$document.on('keydown', function modalKeyboardHandler(event) {
      if (event.keyCode !== KEY_ESC) {
        return;
      }

      self.getVisible().each(function (i, el) {
        self.hide($(el));
      });
    });
  };

  /**
   * Retrieves the modal HTML element related to an hyperlink
   *
   * @param {String} href
   * @returns {jQuery|Element|null}  modal HTML Element wrapped by jQuery if found, null otherwise
   */
  ModalHandler.prototype.getElementFromHref = function getElement(href) {
    var selector = (href || '').trim().replace('undefined', '');
    var $el = $(selector).filter('.modal');

    return $el.length === 1 ? $el : null;
  };

  /**
   * Returns all the visible modals
   *
   * @returns {jQuery|Array.<Element>}
   */
  ModalHandler.prototype.getVisible = function getVisible() {
    return this.$body.find('div.modal.modal-visible');
  };

  /**
   * Returns the enclosing modal of an element.
   * This is notably especiall used by closing buttons to retrieve their associated modal.
   *
   * @param {jQuery|Element} $source
   * @returns {jQuery|Element}
   */
  ModalHandler.prototype.getEnclosing = function getEnclosing($source) {
    return $source.parents('div.modal.modal-visible');
  };

  /**
   * Checks if a modal is visible or not
   *
   * @param {jQuery|Element} $modal A modal HTML Element wrapped by jQuery
   * @returns {Boolean}
   */
  ModalHandler.prototype.isVisible = function isVisible($modal) {
    return $modal.hasClass('modal-visible');
  };

  /**
   * Displays a modal
   *
   * @api
   * @param {jQuery|Element} $modal A modal HTML Element wrapped by jQuery
   */
  ModalHandler.prototype.show = function show($modal) {
    $modal.addClass('modal-visible');

    this.$body.addClass('in-modal');
  };

  /**
   * Hides a modal
   *
   * @api
   * @param {jQuery|Element} $modal A modal HTML Element wrapped by jQuery
   */
  ModalHandler.prototype.hide = function hide($modal) {
    $modal.removeClass('modal-visible');

    this.eventuallyHideBackground();
  };

  /**
   * Adds the `loading` status for a modal
   * Indeed, some of them contain async loaded content.
   * This enables to display the modal right now with a deferred loaded content.
   *
   * @api
   * @param {jQuery|Element} $modal A modal HTML Element wrapped by jQuery
   */
  ModalHandler.prototype.load = function load($modal) {
    $modal.addClass('modal-loading');

    this.show($modal);
  };

  /**
   * Removes the `loading` status of the modal
   *
   * @api
   * @param {jQuery|Element} $modal A modal HTML Element wrapped by jQuery
   */
  ModalHandler.prototype.loaded = function loaded($modal) {
    $modal.removeClass('modal-loading');
  };

  /**
   * Hides the the modal backdrop if no modal can be seen on scren
   *
   * @api
   */
  ModalHandler.prototype.eventuallyHideBackground = function eventuallyHideBackground() {
    if (!this.getVisible().length){
      this.hideBackground();
    }
  };

  /**
   * Hides the modal backdrop
   *
   * @api
   */
  ModalHandler.prototype.hideBackground = function hideBackground() {
    this.$body.removeClass('in-modal');
  };

  /*
   Exporting
   */
  window['ModalHandler'] = ModalHandler;
})(jQuery, window, document);
