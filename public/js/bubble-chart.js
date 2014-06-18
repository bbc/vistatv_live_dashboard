(function(window, $) {
  "use strict";

  /* jshint devel:true */
  /* globals Logo, jQuery, d3 */

  /**
   * Converts d3 radius into pixel value
   *
   * @param {Number} r
   * @returns {number}
   */
  function radiusToPxDimension(r) {
    //return r * 2;
    return 2 * (r * Math.cos(Math.PI/4));
  }

  /**
   * Calculates the distance between to topmost part of an element with the center of the graph
   *
   * @param {Number} x Left position in pixels
   * @param {Number} r Radius
   * @returns {number}
   */
  function topPxFromCentre(x, r) {
    return x - r + radiusToPxDimension(r) - r;
  }

  /**
   * Calculates the distance between to leftmost part of an element with the center of the graph
   *
   * @param {Number} y Top position in pixels
   * @param {Number} r Radius
   * @returns {number}
   */
  function leftPxFromCentre(y, r) {
    return y - r + radiusToPxDimension(r) - r;
  }

  /**
   * Filters the data used for the graph layout.
   *
   * @param {Array} layout
   * @param {Object} data
   * @returns {Array}
   */
  function dataForLayout(layout, data) {
    return layout.nodes({ children: data })
                 .filter(function(d) { return !d.children; });
  }

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
   * Builds the tooltip content for element hovering
   *
   * @param {Stats} d
   * @returns {string}
   */
  function stringForTooltip(d) {
    var title = d.getProgramme().title;
    if(!title){
      title = d.getChannelName();
    }
    return title + " " + d.audience.total + " (" + d.audience.change + (d.audience.change > 0 ? "⬆" : "⬇") + ")";
  }

  /**
   * BubbleChart constructor
   *
   * @param {HTMLElement} container
   * @param {Array.<Stats>} data
   * @constructor
   */
  function BubbleChart(container, data) {
    /**
     * Chart container element
     * @type {HTMLElement}
     */
    this.container = container;

    /**
     * Container with
     * @type {Number} Size in pixel
     */
    this.width      = $(this.container).width();

    /**
     * Container height
     * @type {Number} Size in pixel
     */
    this.height     = $(this.container).height();

    /**
     * Channel data: each item will be rendered as a bubble with a group-relative size
     * @type {Array.<Stats>}
     */
    this.data       = data;

    /**
     * d3 effect used to transition old bubble size to a new one
     * @see https://github.com/mbostock/d3/wiki/Transitions#wiki-d3_ease
     * @type {string}
     */
    this.easingType = 'elastic';

    /**
     * Bubble padding size
     * @type {number} Size in pixel
     */
    this.bubblePaddingPx = 0;

    this._setup();
  }

  /**
   * Setups the d3 graph
   *
   * @private
   */
  BubbleChart.prototype._setup = function _setup() {
    var self = this,
        data = this.data;

    self.bubble = d3.layout.pack()
        .sort(null)
        .size([self.width, self.height])
        .value(function(d){ return d.audience.total; })
        .padding(self.bubblePaddingPx);

    self.root = d3.select(self.container).append("div")
        .style("width", self.width)
        .style("height", self.height)
        .attr("class", "bubble-chart");

    self.update(data);

    d3.select(self.frameElement).style("height", self.height + "px");
  };

  /**
   * Update the graph with new data
   *
   * @param {Array.<Stats>} data
   */
  BubbleChart.prototype.update = function update(data) {
    var self = this;

    console.log('BubbleChart.update', data);

    if (data.length == 0) { return; }

    var node = self.root.selectAll(".node")
                   .data(dataForLayout(self.bubble, data), idForDatum);

    var enteringNodes = node.enter()
                            .append("div")
                            .attr("class", "node")
                            .on('click', function (d) { self.selectNode(d); });

    enteringNodes.append("div")
                 .attr("class", "logo")
                 .style("width", 0)
                 .each(function createLogo(d){ new Logo(d, this); });

    node.attr("title", stringForTooltip)
        .transition()
          .ease(self.easingType)
          .duration(1000)
          .style("width",  function (d) { return radiusToPxDimension(d.r) + "px"; })
          .style("height", function (d) { return radiusToPxDimension(d.r) + "px"; })
          .style("left",   function (d) { return leftPxFromCentre(d.x, d.r) + "px"; })
          .style("top",    function (d) { return topPxFromCentre(d.y, d.r)  + "px"; });

    node.select('.logo')
      .transition()
        .ease(self.easingType)
        .duration(1000)
        .style("width", function(d) { return Math.floor( radiusToPxDimension(d.r) ) + "px"; });

    node.exit()
        .remove();
  };

  /**
   * What to do when a graph element is clicked
   *
   * @param {Stats} item
   */
  BubbleChart.prototype.selectNode = function selectNode (item) {
    var event = $.Event("radioItemClick", { item: item });
    $("body").trigger(event);
  };

  /*
   Exporting
   */
  window['BubbleChart'] = BubbleChart;

}(window, jQuery));
