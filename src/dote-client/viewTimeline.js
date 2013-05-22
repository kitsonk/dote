define([
	'./Timeline',
	'./userControls',
	'dojo/_base/array',
	'dojo/store/JsonRest',
	'dojo/domReady!'
], function (Timeline, userControls, array, JsonRest) {

	userControls.start();

	var events = new JsonRest({
		target: '/events' 
	});

	var widgets = [];

	var timeline = new Timeline({
		store: events,
		count: 20,
		maxCount: 40,
		queryOptions: { sort: [ { attribute: 'created', descending: true } ] }
	}, 'timeline');
	widgets.push(timeline);

	array.forEach(widgets, function (widget) {
		widget && widget.startup && widget.startup();
	});

	timeline.fetch();
});