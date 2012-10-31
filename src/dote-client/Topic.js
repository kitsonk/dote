define([
	"dojo/_base/declare", // declare
	"dijit/_Container",
	"dijit/_Contained",
	"dijit/_CssStateMixin",
	"dijit/_OnDijitClickMixin",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetBase",
	"dijit/layout/_LayoutWidget",
	"dojo/text!./resources/_TopicComment.html",
	"dojo/text!./resources/Topic.html"
], function(declare, _Container, _Contained, _CssStateMixin, _OnDijitClickMixin, _TemplatedMixin, _WidgetBase,
		_LayoutWidget, commentTemplate, topicTemplate){

	var _TopicComment = declare([_WidgetBase, _TemplatedMixin, _Contained, _CssStateMixin], {
		baseClass: "doteTopicClass",
		templateString: commentTemplate
	});

	return declare([_LayoutWidget, _TemplatedMixin], {
		baseClass: "doteTopic",
		templateString: topicTemplate,

		_onUpClick: function(e){
			e && e.preventDefault();
			this.set("vote", 1);
		},

		_onNeutralClick: function(e){
			e && e.preventDefault();
			this.set("vote", 0);
		},

		_onDownClick: function(e){
			e && e.preventDefault();
			this.set("vote", -1);
		}
	});
});