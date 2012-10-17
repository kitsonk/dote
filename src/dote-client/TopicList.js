define([
	"./_StoreMixin",
	"dojo/_base/array", // array.forEach
	"dojo/_base/declare", // declare
	"dojo/_base/lang", // lang.mixin
	"dojo/dom-class", // domClass.add, domClass.remove
	"dojo/dom-construct", // domConst.empty
	"dojo/dom-style", // style.set
	"dojo/json", // JSON.parse
	"moment/moment",
	"dijit/_Container",
	"dijit/_Contained",
	"dijit/_CssStateMixin",
	"dijit/_OnDijitClickMixin",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetBase",
	"dijit/layout/_LayoutWidget",
	"dojo/text!./resources/_TopicListItem.html",
	"dojo/text!./resources/TopicList.html"
], function(_StoreMixin, array, declare, lang, domClass, domConst, style, JSON, moment, _Container, _Contained,
		_CssStateMixin, _OnDijitClickMixin, _TemplatedMixin, _WidgetBase, _LayoutWidget, templateTopicListItem,
		templateTopicList){

	function percentVote(count, self){
		return Math.round((count / self.voters.length) * 100);
	}

	var activeActions = [ "open", "reopened" ];

	var _TopicItem = declare([_WidgetBase, _Contained, _TemplatedMixin, _OnDijitClickMixin, _CssStateMixin], {
		baseClass: "doteTopicItem",
		cssStateNodes: {
			"voteUpNode": "doteTopicItemVoteUp",
			"voteNeutralNode": "doteTopicItemVoteNeutral",
			"voteDownNode": "doteTopicItemVoteDown"
		},
		templateString: templateTopicListItem,

		item: null,
		_setItemAttr: function(value){
			for(var attr in value){
				if(attr !== "id"){
					this.set(attr, value[attr]);
				}
			}
		},

		title: "",
		_setTitleAttr: {
			node: "titleNode",
			type: "innerHTML"
		},

		description: "",
		_setDescriptionAttr: {
			node: "descriptionNode",
			type: "innerHTML"
		},

		votes: 0,
		_setVotesAttr: {
			node: "votesNode",
			type: "innerHTML"
		},

		voter: "",

		voters: [],
		_setVotersAttr: function(value){
			var votes = 0;
			if(value instanceof Array){
				this._set("voters", value);
			}else{
				this._set("voters", JSON.parse(value));
			}
			array.forEach(this.voters, function(voter){
				if(voter.vote){
					votes += voter.vote;
				}
			});
			this.set("votes", votes);
			if(this.started){
				this._displayVoters();
				this._displayVote();
				this._displaySpark();
			}
		},

		tags: [],
		_setTagsAttr: function(value){
			if(value instanceof Array){
				this._set("tags", value);
			}else{
				this._set("tags", value.split(/\s*,\s*/));
			}
			if(this.started){
				this._displayTags();
			}
		},

		action: "",
		_setActionAttr: function(value){
			this.actionStatusNode.innerHTML = value;
			this._set("action", value);
			this._displayStatus();
		},

		owner: "",
		_setOwnerAttr: {
			node: "ownerNode",
			type: "innerHTML"
		},

		actioned: "",
		_setActionedAttr: function(value){
			if(value instanceof Date || value instanceof Array){
				value = moment(value).fromNow();
			}
			this.actionedStatusNode.innerHTML = value ? "Actioned " + value : "";
			this._set("actionTime", value);
		},

		created: "",
		_setCreatedAttr: function(value){
			if(value instanceof Date || value instanceof Array){
				value = moment(value).fromNow();
			}
			this.postedStatusNode.innerHTML = value ? "Posted " + value : "";
			this._set("createdTime", value);
		},

		commentsCount: 0,
		_setCommentsCountAttr: {
			node: "commentsCountNode",
			type: "innerHTML"
		},

		constructor: function(){
			this.voters = [];
			this.tags = [];
		},

		postCreate: function(){
			this.inherited(arguments);
			this._displayTags();
			this._displayVoters();
			this._displayVote();
			this._displaySpark();
			this._displayStatus();
		},

		_displayVoters: function(){
			domConst.empty(this.votersNode);
			array.forEach(this.voters, function(voter){
				domConst.create("li", {
					innerHTML: voter.name,
					"class": voter.vote > 0 ?
						(this.baseClass + "VoterPlus") : voter.vote < 0 ?
							(this.baseClass + "VoterMinus") : (this.baseClass + "VoterNeutral")
				}, this.votersNode);
			}, this);
		},

		_displayTags: function(){
			domConst.empty(this.tagsNode);
			array.forEach(this.tags, function(tag){
				domConst.create("li", {
					innerHTML: tag
				}, this.tagsNode);
			}, this);
		},

		_displayVote: function(){
			var voteSelected = this.baseClass + "VoteSelected";
			array.some(this.voters, function(voter){
				if(voter.name === this.voter){
					switch(voter.vote){
						case -1:
							domClass.remove(this.voteUpNode, voteSelected);
							domClass.remove(this.voteNeutralNode, voteSelected);
							domClass.add(this.voteDownNode, voteSelected);
							break;
						case 1:
							domClass.add(this.voteUpNode, voteSelected);
							domClass.remove(this.voteNeutralNode, voteSelected);
							domClass.remove(this.voteDownNode, voteSelected);
							break;
						case 0:
							domClass.remove(this.voteUpNode, voteSelected);
							domClass.add(this.voteNeutralNode, voteSelected);
							domClass.remove(this.voteDownNode, voteSelected);
							break;
					}
					return true;
				}else{
					return false;
				}
			}, this);
		},

		_displaySpark: function(){
			if(this.voters.length){
				var plus = 0,
					minus = 0,
					neutral = 0;

				array.forEach(this.voters, function(voter){
					switch(voter.vote){
						case -1:
							minus++;
							break;
						case 1:
							plus++;
							break;
						default:
							neutral++;
					}
				});
				plus = percentVote(plus, this);
				minus = percentVote(minus, this);
				neutral = percentVote(neutral, this);
				var pad = 100 - plus - minus - neutral;
				if(plus){
					plus += pad;
				}else if(minus){
					minus += pad;
				}else{
					neutral += pad;
				}
				style.set(this.sparkPlusNode, "width", plus + "%");
				style.set(this.sparkNeutralNode, "width", neutral + "%");
				style.set(this.sparkMinusNode, "width", minus + "%");
			}
		},

		_displayStatus: function(){
			if(~activeActions.indexOf(this.action)){
				domClass.add(this.statusContainerNode, this.baseClass + "StatusActive");
			}else{
				domClass.remove(this.statusContainerNode, this.baseClass + "StatusInactive");
			}
		},

		_onUpClick: function(e){
			e && e.preventDefault();
			console.log("up");
		},

		_onNeutralClick: function(e){
			e && e.preventDefault();
			console.log("neutral");
		},

		_onDownClick: function(e){
			e && e.preventDefault();
			console.log("down");
		}

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