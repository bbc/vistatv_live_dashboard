(function(window, $) {
  "use strict";

  /* globals jQuery */

  /**
   * Construct the rendering of services in the UI.
   *
   * @param {HTMLElement} el Parent element containing the view.
   * @constructor
   */
  var ServiceListView = function ServiceListView(el, model){

    /**
     * Reference to the HTML element holding the view
     * @type {jQuery|HTMLElement}
     */
    this.$el = $(el);

    this.$el.on("click", 'input', this.handleClick.bind(this));
  };

  /**
   * Update a single service item based on the model's state
   *
   * @api
   * @param {Service} service The service to update
   */
  ServiceListView.prototype.updateService = function updateService(service) {
    var $item = this.$el.find('#' + service.id);

    if ($item.length > 0) {
      $item.find('input')[0].checked = service.isSelected;
    }
  };

  /**
   * Render the list of Services into the UI so as people can choose what service to display.
   *
   * @api
   * @param {Array.<Service>} services The services we want to render in the UI
   */
  ServiceListView.prototype.render = function render(services) {
    var self = this;

    self.$el.empty();
    self.$el.append(function () {
      return services.map(function (item) {
        var $el = $('<li>' +
          '<input id="' + item.id + '" type="checkbox" ' + (item.isSelected ? 'checked' : '') + ' value="' + item.id + '">' +
          '<label for="' + item.id + '">' + item.displayName() + '</label>' +
        '</li>');
        $el.data('service', item);
        return $el;
      });
    });
  };

  /**
   * Handle the click on a Service box and notifies the app to deal with that.
   *
   * @param {ClickEvent} evt
   */
  ServiceListView.prototype.handleClick = function handleClick(evt) {
    var $input = $(evt.target);
    var serviceId = $input.val();
    var isChecked = $input[0].checked;

    var service = $input.parent().data('service');
    isChecked ? service.select() : service.deselect();

    evt = $.Event('serviceStateChanged', {
      service: serviceId,
      isSelected: isChecked
    });

    $(this).trigger(evt);
  };

  /*
   Exporting
   */
  window['ServiceListView'] = ServiceListView;

}(window, jQuery));
