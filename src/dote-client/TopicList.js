define([
	"./_StoreMixin",
	"./_TopicMixin",
	"dojo/_base/array", // array.forEach
	"dojo/_base/declare", // declare
	"dojo/_base/lang", // lang.mixin
	"dojo/json", // JSON.parse
	"dijit/_Contained",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetBase",
	"dijit/layout/_LayoutWidget",
	"dojo/text!./resources/_TopicListItem.html",
	"dojo/text!./resources/TopicList.html"
], function(_StoreMixin, _TopicMixin, array, declare, lang, JSON, _Contained, _TemplatedMixin, _WidgetBase,
		_LayoutWidget, templateTopicListItem, templateTopicList){

	var _TopicItem = declare([_WidgetBase, _Contained, _TemplatedMixin, _TopicMixin], {
		baseClass: "doteTopicItem",
		templateString: templateTopicListItem,

		item: null,
		_setItemAttr: function(value){
			for(var attr in value){
				if(attr !== "id"){
					this.set(attr, value[attr]);
				}
			}
		},

		vote: null,
		_setVoteAttr: function(value){
			if(this.item){
				var exists = array.some(this.item.voters, function(voter, idx){
					if(voter.name === this.topicList.user){
						voter.vote = value;
						return true;
					}else{
						return false;
					}
				}, this);
				if(!exists){
					this.item.voters.push({
						name: this.topicList.user,
						vote: value
					});
				}
				this.set("voters", this.item.voters);
				this.topicList.store.put(this.item);
			}
			this._set("vote", value);
		},

		topicList: null

	});

	return declare([_LayoutWidget, _TemplatedMixin, _StoreMixin], {
		baseClass: "doteTopicList",
		templateString: templateTopicList,

		user: "",

		startup: function(){
			this.inherited(arguments);
			this.own(this.on("item", lang.hitch(this, this._onItem)));
		},

		_onItem: function(e){
			this.addChild(new _TopicItem({
				id: this.id + "_topic" + this.getChildren().length,
				voter: this.user,
				topicList: this,
				item: e.item
			}), 0);
		},

		addTopic: function(topicInfo){
			var topicSettings = lang.mixin(topicInfo, {
				id: this.id + "_topic" + this.getChildren().length
			});
			this.addChild(new _TopicItem(topicSettings), 0);
		}
	});
});