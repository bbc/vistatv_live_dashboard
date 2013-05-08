/* globals Rickshaw */
Rickshaw.namespace('Rickshaw.Graph.PeaksAnnotate');

/**
 * Customized Rickshaw Annotator
 *
 * It displayed peaks every n-minutes to indicate the trend of the audience.
 * Only one annotation can be displayed for a certain datetime.
 * Click events are handled with Event Delegation and thus, don't appear here by purpose/design.
 *
 * @param {Object} args
 * @see Rickshaw.Graph.Annotate
 * @constructor
 */
Rickshaw.Graph.PeaksAnnotate = function(args) {
  "use strict";

  this.elements = { timeline: args.element };

  var self = this;

  this.graph = args.graph;

  this.data = {};

  this.elements.timeline.classList.add('rickshaw_annotation_timeline');

  /**
   * Adds a new annotation at a specific time
   *
   * @param {String} time Will determine where to display that on the timeline
   * @param {String} content  The text content of the annotation
   * @param {{classes:Array}} options Contains CSS classes used to render the trend (positive, negative)
   */
  this.add = function(time, content, options) {
    self.data[time] = {
      options: options,
      content: content
    };
  };

  /**
   * Method to perform each time the Graph object is updated
   * It helps to keep in sync series data and annotations
   *
   * @api
   */
  this.update = function() {

    Rickshaw.keys(self.data).forEach( function(time) {

      var annotation = self.data[time];
      var left = self.graph.x(time);

      // skip offscreen elements
      if (left < 0 || left > self.graph.x.range()[1]) {
        return;
      }

      if (!annotation.element) {
        var element = annotation.element = document.createElement('div');
        element.classList.add('annotation', 'annotation-peak');
        element.setAttribute('data-time', time);

        if (Array.isArray(annotation.options.classes)){
          element.classList.add.apply(element.classList, annotation.options.classes);
        }

        this.elements.timeline.appendChild(element);

        element.addEventListener('hover', function() {
          element.classList.toggle('active');
        }, false);

      }

      annotation.element.style.left = left + 'px';
      annotation.element.style.display = 'block';
    }, this );
  };

  /*
   Subscribes to Graph event to refresh the layout for this annotation drawer
   */
  this.graph.onUpdate( function() { self.update(); } );
};