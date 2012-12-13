require({cache:{
'url:dote-client/resources/_TopicListItem.html':"<div class=\"${baseClass}\">\n\t<div class=\"${baseClass}VoteContainer\">\n\t\t<div class=\"${baseClass}VoteInner\">\n\t\t\t<div class=\"${baseClass}Votes\" data-dojo-attach-point=\"votesNode\"></div>\n\t\t\t<div class=\"${baseClass}Spark\">\n\t\t\t\t<table>\n\t\t\t\t\t<col class=\"${baseClass}SparkPlus\" data-dojo-attach-point=\"sparkPlusNode\">\n\t\t\t\t\t<col class=\"${baseClass}SparkNeutral\" data-dojo-attach-point=\"sparkNeutralNode\">\n\t\t\t\t\t<col class=\"${baseClass}SparkMinus\" data-dojo-attach-point=\"sparkMinusNode\">\n\t\t\t\t\t<tbody>\n\t\t\t\t\t\t<td></td>\n\t\t\t\t\t\t<td></td>\n\t\t\t\t\t\t<td></td>\n\t\t\t\t\t</tbody>\n\t\t\t\t</table>\n\t\t\t</div>\n\t\t\t<div class=\"${baseClass}VoteButtons\">\n\t\t\t\t<ul>\n\t\t\t\t\t<li role=\"button\">\n\t\t\t\t\t\t<a href=\"#\" class=\"${baseClass}VoteUp\" data-dojo-attach-point=\"voteUpNode\" data-dojo-attach-event=\"ondijitclick:_onUpClick\"><i class=\"icon-plus\"></i><span>Up</span></a>\n\t\t\t\t\t</li>\n\t\t\t\t\t<li role=\"button\">\n\t\t\t\t\t\t<a href=\"#\" class=\"${baseClass}VoteNeutral\" data-dojo-attach-point=\"voteNeutralNode\" data-dojo-attach-event=\"ondijitclick:_onNeutralClick\"><i class=\"icon-check-empty\"></i><span>Neutral</span></a>\n\t\t\t\t\t</li>\n\t\t\t\t\t<li role=\"button\">\n\t\t\t\t\t\t<a href=\"#\" class=\"${baseClass}VoteDown\" data-dojo-attach-point=\"voteDownNode\" data-dojo-attach-event=\"ondijitclick:_onDownClick\"><i class=\"icon-minus\"></i><span>Minus</span></a>\n\t\t\t\t\t</li>\n\t\t\t\t</ul>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n\t<div class=\"${baseClass}ContentContainer\">\n\t\t<div class=\"${baseClass}ContentInner\">\n\t\t\t<div class=\"${baseClass}Title\" data-dojo-attach-point=\"titleNode\"></div>\n\t\t\t<div class=\"${baseClass}Status\" data-dojo-attach-point=\"statusContainerNode\">\n\t\t\t\t<div class=\"${baseClass}Action\" data-dojo-attach-point=\"actionStatusNode\"></div>\n\t\t\t\t<div class=\"${baseClass}Owner\" data-dojo-attach-point=\"ownerNode\"></div>\n\t\t\t\t<div class=\"${baseClass}Posted\" data-dojo-attach-point=\"postedStatusNode\"></div>\n\t\t\t\t<div class=\"${baseClass}Actioned\" data-dojo-attach-point=\"actionedStatusNode\"></div>\n\t\t\t\t<div class=\"${baseClass}CommentCount\"><i class=\"icon-comments-alt\"></i><span data-dojo-attach-point=\"commentsCountNode\"></span></div>\n\t\t\t</div>\n\t\t\t<div class=\"${baseClass}Summary\" data-dojo-attach-point=\"summaryNode\"></div>\n\t\t\t<div class=\"${baseClass}TagsContainer\">\n\t\t\t\t<i class=\"icon-tags icon-large\"></i>\n\t\t\t\t<ul class=\"${baseClass}Tags\" data-dojo-attach-point=\"tagsNode\">\n\t\t\t\t</ul>\n\t\t\t</div>\n\t\t\t<div class=\"${baseClass}VotersContainer\">\n\t\t\t\t<i class=\"icon-check icon-large\"></i>\n\t\t\t\t<ul class=\"${baseClass}Voters\" data-dojo-attach-point=\"votersNode\">\n\t\t\t\t</ul>\n\t\t\t</div>\n\t\t\t<div class=\"${baseClass}HeightContainer\"></div>\n\t\t</div>\n\t</div>\n\t<div class=\"${baseClass}HeightContainer\"></div>\n</div>\n",
'url:dote-client/resources/TopicList.html':"<div class=\"${baseClass}\" role=\"presentation\" data-dojo-attach-point=\"wrapperNode\">\n\t<div class=\"${baseClass}Container\" data-dojo-attach-point=\"containerNode\"></div>\n\t<div class=\"${baseClass}More ${baseClass}Hide\" data-dojo-attach-point=\"moreNode\">\n\t\t<a href=\"#\" class=\"${baseClass}MoreLink\" data-dojo-attach-event=\"ondijitclick:_onMoreClick\" data-dojo-attach-point=\"moreLinkNode\">${moreLabel}</a>\n\t</div>\n</div>"}});
define("dote-client/TopicList", [
	"./_StoreMixin",
	"./_TopicMixin",
	"dojo/_base/array", // array.forEach
	"dojo/_base/declare", // declare
	"dojo/_base/lang", // lang.mixin
	"dojo/json", // JSON.parse
	"dijit/_Contained",
	"dijit/_CssStateMixin",
	"dijit/_OnDijitClickMixin",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetBase",
	"dijit/layout/_LayoutWidget",
	"dojo/text!./resources/_TopicListItem.html",
	"dojo/text!./resources/TopicList.html"
], function(_StoreMixin, _TopicMixin, array, declare, lang, JSON, _Contained, _CssStateMixin, _OnDijitClickMixin,
		_TemplatedMixin, _WidgetBase, _LayoutWidget, templateTopicListItem, templateTopicList){

	var _TopicItem = declare([_WidgetBase, _Contained, _TemplatedMixin, _TopicMixin], {
		baseClass: "doteTopicItem",
		templateString: templateTopicListItem,

		cssStateNodes: {
			"voteUpNode": "doteTopicItemVoteUp",
			"voteNeutralNode": "doteTopicItemVoteNeutral",
			"voteDownNode": "doteTopicItemVoteDown",
			"titleNode": "doteTopicItemTitle"
		},

		item: null,
		_setItemAttr: function(value){
			for(var attr in value){
				if(attr !== "id"){
					this.set(attr, value[attr]);
				}
			}
			this._set("item", value);
		},

		title: "",
		_setTitleAttr: function(value){
			this.titleNode.innerHTML = '<a href="/topic/' + this.item.id + '">' + value + "</a>";
			this._set("title", value);
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

		_setDescriptionAttr: null,

		tags: [],
		_setTagsAttr: function(value){
			if(typeof value === "string"){
				value = value.split(/\s*,\s*/);
			}
			if(this.item && this.tags && value && this._started && (value.join() !== this.tags.join())){
				this.item.tags = value;
				this.topicList.store.put(this.item);
			}
			this._set("tags", value);
			if(this._started){
				this._displayTags();
			}
		},

		tagsEditable: true,

		topicList: null,

		_onActionChange: function(value){
			this.inherited(arguments);
			if(this.item.action !== value){
				this.item.action = value;
				var self = this;
				when(this.topicList.store.put(this.item), function(item){
					self.set("item", item);
				});
			}
		}

	});

	return declare([_LayoutWidget, _TemplatedMixin, _CssStateMixin, _OnDijitClickMixin, _StoreMixin], {

		baseClass: "doteTopicList",
		templateString: templateTopicList,
		moreLabel: "More...",

		cssStateNodes: {
			"moreLinkNode": "doteTopicListMoreLink"
		},

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
			}));
		},

		_onMoreClick: function(e){
			e && e.preventDefault();
			console.log("hello!");
		},

		addTopic: function(topicInfo){
			var topicSettings = lang.mixin(topicInfo, {
				id: this.id + "_topic" + this.getChildren().length
			});
			this.addChild(new _TopicItem(topicSettings));
		}
	});
});