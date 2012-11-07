define([
	"dojo/_base/array",
	"dojo/_base/declare", // declare
	"dojo/dom-class", // domClass.add domClass.remove
	"dojo/dom-construct", // domConst.empty
	"dojo/dom-style", // style.set
	"dijit/_CssStateMixin",
	"dijit/_OnDijitClickMixin",
	"moment/moment"
], function(array, declare, domClass, domConst, style, _CssStateMixin, _OnDijitClickMixin, moment){

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

		tags: [],
		_setTagsAttr: function(value){
			if(value instanceof Array){
				this._set("tags", value);
			}else{
				this._set("tags", value.split(/\s*,\s*/));
			}
			if(this._started){
				this._displayTags();
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
		_setOwnerAttr: {
			node: "ownerNode",
			type: "innerHTML"
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

		commentsCount: 0,
		_setCommentsCountAttr: {
			node: "commentsCountNode",
			type: "innerHTML"
		},

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