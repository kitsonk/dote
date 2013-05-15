define([
	"dojo/_base/array",
	"dojo/_base/declare", // declare
	"dojo/_base/lang", // lang
	"dojo/dom-class", // domClass.add domClass.remove
	"dojo/dom-construct", // domConst.empty
	"dojo/dom-style", // style.set
	"dojo/on",
	"dijit/_CssStateMixin",
	"dijit/_OnDijitClickMixin",
	"dijit/form/Select",
	"dijit/form/TextBox",
	"moment/moment"
], function(array, declare, lang, domClass, domConst, style, on, _CssStateMixin, _OnDijitClickMixin, Select, TextBox,
		moment){

	var activeActions = [ "open", "reopened" ],
		actions = [{
			value: "open",
			label: "Open"
		},{
			value: "reopened",
			label: "Reopened"
		},{
			value: "accepted",
			label: "Accepted"
		},{
			value: "rejected",
			label: "Rejected"
		},{
			value: "closed",
			label: "Closed"
		}];

	function percentVote(count, self){
		return Math.round((count / self.voters.length) * 100);
	}

	return declare([_CssStateMixin, _OnDijitClickMixin], {
		cssStateNodes: {
			"voteUpNode": "doteTopicItemVoteUp",
			"voteNeutralNode": "doteTopicItemVoteNeutral",
			"voteDownNode": "doteTopicItemVoteDown"
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

		summary: "",
		_setSummaryAttr: {
			node: "summaryNode",
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
			if(this._started){
				this._displayVoters();
				this._displayVote();
				this._displaySpark();
			}
		},

		itemWidgets: {},

		actionSelect: null,

		action: "",
		_setActionAttr: function(value){
			if(this.actionSelect){
				this.actionSelect.set("value", value);
			}else{
				this.actionStatusNode.innerHTML = value;
			}
			this._set("action", value);
			if(this._started){
				this._displayStatus();
			}
		},

		owner: "",
		_setOwnerAttr: function(value){
			var user = (this.user && this.user.id) || (this.topicList && this.topicList.user &&
				this.topicList.user.id) || "";
			if(value === user){
				if(!this.actionSelect){
					this.actionSelect = new Select({
						id: this.id + "_actionSelect",
						name: "action",
						options: actions,
						value: this.action
					});
					domConst.empty(this.actionStatusNode);
					this.actionSelect.placeAt(this.actionStatusNode);
					this.actionSelect.startup();
					var self = this;
					this.own(this.actionSelect.on("change", lang.hitch(this, this._onActionChange)));
				}
			}else{
				if(this.actionSelect){
					this.actionSelect.destroy();
				}
				domConst.empty(this.actionStatusNode);
				this.actionStatusNode.innerHTML = this.action;
			}
			this.ownerNode.innerHTML = value;
			this._set("owner", value);
		},

		author: "",

		actioned: "",
		_setActionedAttr: function(value){
			if(value instanceof Date || value instanceof Array){
				value = moment(value).fromNow();
			}else if((parseFloat(value) == parseInt(value, 10)) && !isNaN(value)){
				value = moment.unix(value).fromNow();
			}
			this.actionedStatusNode.innerHTML = value ? "Actioned " + value : "";
			this._set("actionTime", value);
		},

		created: "",
		_setCreatedAttr: function(value){
			if(value instanceof Date || value instanceof Array){
				value = moment(value).fromNow();
			}else if((parseFloat(value) == parseInt(value, 10)) && !isNaN(value)){
				value = moment.unix(value).fromNow();
			}
			this.postedStatusNode.innerHTML = (value ? "Posted " + value : "") +
				(this.author ? "<br>by " + this.author : "");
			this._set("created", value);
		},

		watchers: [],
		_setWatchersAttr: function(value){
			if(value instanceof Array){
				this._set("watchers", value);
			}else{
				this._set("watchers", JSON.parse(value));
			}
			// Need to fix this...
			this.set("watched", ~array.indexOf(this.watchers, this.voter));
		},

		watched: false,
		_setWatchedAttr: function(value){
			if(value){
				domClass.add(this.watchNode, "icon-star");
				domClass.remove(this.watchNode, "icon-star-empty");
			}else{
				domClass.remove(this.watchNode, "icon-star");
				domClass.add(this.watchNode, "icon-star-empty");
			}
			this._set("watched", value);
		},

		commentsCount: 0,
		_setCommentsCountAttr: {
			node: "commentsCountNode",
			type: "innerHTML"
		},

		tagsEditable: false,
		addTagNode: null,
		addTagListener: null,

		constructor: function(){
			this.voters = [];
			this.tags = [];
			this.itemWidgets = {};
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
					innerHTML: voter.user.id + (voter.user.committer ? ' <i class="icon-certificate"></i>' : ''),
					"class": voter.vote > 0 ?
						(this.baseClass + "VoterPlus") : voter.vote < 0 ?
							(this.baseClass + "VoterMinus") : (this.baseClass + "VoterNeutral")
				}, this.votersNode);
			}, this);
		},

		_displayTags: function(){
			if(this.addTagListener){
				this.addTagListener.remove();
			}
			domConst.empty(this.tagsNode);
			array.forEach(this.tags, function(tag){
				domConst.create("li", {
					innerHTML: tag
				}, this.tagsNode);
			}, this);
			if(this.tagsEditable){
				this.addTagNode = domConst.create("a", {
					href: '/editTags',
					innerHTML: '<i class="icon-edit icon-large"></i><span class="a11yLabel">Add Tag</span>'
				}, this.tagsNode);
				this.addTagListener = on(this.addTagNode, "click", lang.hitch(this, this._editTags));
			}
		},

		_editTags: function(e){

			function onEditComplete(e){
				if(!e || (e && e.charOrCode == 13)){
					var value = editTags.get("value");
					editTags.destroy();
					this.set("tags", value);
				}
			}

			e && e.preventDefault();
			this.addTagListener.remove();
			domConst.empty(this.tagsNode);
			var editTags = new TextBox({
				id: this.id + "_editTags",
				name: "editTags",
				value: this.get("tags").join(", "),
				style: {
					width: "550px"
				}
			});
			editTags.on("blur", lang.hitch(this, onEditComplete));
			editTags.on("keypress", lang.hitch(this, onEditComplete));
			editTags.placeAt(this.tagsNode);
			editTags.startup();
		},

		_displayVote: function(){
			var voteSelected = this.baseClass + "VoteSelected";
			array.some(this.voters, function(voter){
				if(voter.user.id === this.voter.id){
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
				domClass.remove(this.statusContainerNode, this.baseClass + "StatusActive");
			}
		},

		_onActionChange: function(e){
			var self = this;
			this.refresh().then(function () {
				self.set('action', e);
			});
		},

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
		},

		_onWatchClick: function(e){
			e && e.preventDefault();
			var watchers = this.watchers.slice(0),
				idx = array.indexOf(watchers, this.voter);
			if(idx >= 0){
				watchers.splice(idx, 1);
			}else{
				watchers.push(this.voter);
			}
			this.set("watchers", watchers);
		}
	});
});