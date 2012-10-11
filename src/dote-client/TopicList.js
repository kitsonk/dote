define([
	"dojo/_base/declare",
	"dijit/_Container",
	"dijit/_Contained",
	"dijit/_CssStateMixin",
	"dijit/_OnDijitClickMixin",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetBase",
	"dojo/text!./resources/_TopicListItem.html"
], function(declare, _Container, _Contained, _CssStateMixin, _OnDijitClickMixin, _TemplatedMixin, _WidgetBase,
		templateTopicListItem){

	var _TopicListItem = declare([_WidgetBase, _Contained, _TemplatedMixin, _OnDijitClickMixin], {
		baseClass: "doteTopicItem",
		templateString: templateTopicListItem
	});

	return declare([_Container, _TemplatedMixin], {

	});
});