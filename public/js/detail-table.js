(function (window, $) {
  "use strict";

  /* globals d3, jQuery, Logo */

  /**
   * Custom identifier for d3 (because we don't have an `id` property)
   *
   * @param {Stats} d
   * @returns {string}
   */
  function idForDatum(d) {
    return d.channel;
  }

  /**
   * Detail table constructor
   *
   * @param {HTMLElement} container
   * @param {Array.<Stats>} data
   * @constructor
   */
  var DetailTable = function DetailTable(container, data) {
    /**
     * Chart container element
     * @type {HTMLElement}
     */
    this.container = container;

    /**
     * Container with
     * @type {Number} Size in pixel
     */
    this.width = $(this.container).width();

    /**
     * Container height
     * @type {Number} Size in pixel
     */
    this.height = $(this.container).height();

    /**
     * Channel data: each item will be rendered as a bubble with a group-relative size
     * @type {Array.<Stats>}
     */
    this.data = data;

    this._setup();
  };


  /**
   * Setups the d3 table-like layout
   * A div-structure is used in combination with `display: table` layout enables a swipe effect when row position change.
   *
   * @private
   */
  DetailTable.prototype._setup = function _setup() {
    var self = this;
    var data = this.data;

    self.root = d3.select(self.container).append("div").attr("class", "detail-table");

    var headRow = self.root.append('div').attr('class', 'thead').append('div').attr('class', 'tr');
    headRow.append('div').text('Service').attr('class', 'th service');
    headRow.append('div').text('Title').attr('class', 'th');
    headRow.append('div').text('Audience').attr('class', 'th');
    headRow.append('div').text('').attr('class', 'th');
    headRow.append('div').text('Change').attr('class', 'th');

    self.root.append('div').attr("class", "tbody");

    self.update(data);
  };

  /**
   * Update the graph with new data
   *
   * @param {Array.<Stats>} data
   */
  DetailTable.prototype.update = function update(data) {
    var self = this;

    var node = self.root.select('div.tbody').selectAll("div.tr").data(data, idForDatum);

    // Entering selection
    var enteringNodes = node.enter().append("div")
      .attr("class", "tr")
      .attr("data-service-id", function (d) {
        return d.channel;
      })
      .on("click", function (d) {
        self.selectNode(d, this);
      });

    enteringNodes.append("div").attr("class", "td station").each(function (d) {
      new Logo(d, this);
    });
    enteringNodes.append("div").attr("class", "td title");
    enteringNodes.append("div").attr("class", "td audience");
    enteringNodes.append("div").attr("class", "td change-arrow").append("img");
    enteringNodes.append("div").attr("class", "td change-percentage quiet-value");


    node.select(".title")
      .text(function (d) {
        if(d.getProgramme().title){
          return d.channel_name+": "+d.getProgramme().title;
        }else{
          return d.channel_name;
        }
      });

    node.select(".change-arrow img")
      .classed("arrow-up", function (d) {
        return (d.getAudienceChange() > 0);
      })
      .classed("arrow-down", function (d) {
        return (d.getAudienceChange() < 0);
      });

    node.select(".change-percentage")
      .text(function (d) {
        return d3.round(d.getAudienceChange() * 100, 1) + '%';
      });

    node.select(".audience")
      .text(function (d) {
        return d.audience.total;
      });

    node.sort(function (a, b) {
      //return d3.descending(a.getAudienceChange(), b.getAudienceChange());
      return d3.descending(a.audience.total, b.audience.total);
    });

    node
      .style('-webkit-transform', function (d, i) {
        return 'translateY(' + (i * 50) + 'px)';
      })
      .style('transform', function (d, i) {
        return 'translateY(' + (i * 50) + 'px)';
      });

    // Exiting selection
    node.exit().remove();
  };

  /**
   * Handles the behavior when a node (table row) is selected (clicked, touched)
   *
   * @param {Stats} item
   * @param {HTMLElement} el
   */
  DetailTable.prototype.selectNode = function selectNode(item, el) {
    //jshint unused:vars
    var event = jQuery.Event("radioItemClick", { item: item });
    $("body").trigger(event);
  };

  /*
   Exporting
   */
  window.DetailTable = DetailTable;

}(window, jQuery));
