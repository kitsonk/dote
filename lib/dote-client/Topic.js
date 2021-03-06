define("dote-client/Topic", [
	"./_StoreMixin",
	"./_TopicMixin",
	"./fade",
	"dojo/_base/array", // array.forEach
	"dojo/_base/declare", // declare
	"dojo/_base/lang", // lang.mixin
	"dojo/dom-attr", // attr.set, attr.remove
	"dojo/dom-class", // domClass.add, domClass.remove
	"dojo/when", // when
	"dijit/_Contained",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetBase",
	"dijit/form/Button",
	"dijit/form/Textarea",
	"dijit/layout/_LayoutWidget",
	"dijit/layout/ContentPane",
	"dijit/layout/TabContainer",
	"moment/moment",
	"dojo/text!./resources/_TopicComment.html",
	"dojo/text!./resources/Topic.html"
], function(_StoreMixin, _TopicMixin, fade, array, declare, lang, attr, domClass, when, _Contained, _TemplatedMixin,
		_WidgetBase, Button, Textarea, _LayoutWidget, ContentPane, TabContainer, moment, commentTemplate,
		topicTemplate){

	var _TopicComment = declare([_WidgetBase, _TemplatedMixin, _Contained], {
		baseClass: "doteTopicComment",
		templateString: commentTemplate,

		topic: null,

		item: null,
		_setItemAttr: function(value){
			for(var attr in value){
				if(attr !== "id"){
					this.set(attr, value[attr]);
				}
			}
			if("id" in value){
				this.anchorNode.name = value.id;
				this.linkNode.href = "#" + value.id;
			}
			this._set("item", value);
		},

		author: "",
		_setAuthorAttr: {
			node: "authorNode",
			type: "innerHTML"
		},

		created: "",
		_setCreatedAttr: function(value){
			if(value instanceof Date || value instanceof Array){
				value = moment(value).fromNow();
			}else if((parseFloat(value) == parseInt(value, 10)) && !isNaN(value)){
				value = moment.unix(value).fromNow();
			}
			this.momentNode.innerHTML = value ? "Added " + value : "";
			this._set("created", value);
		},

		text: "",
		_setTextAttr: function(value){
			if(this.topic && this.topic.parser){
				value = this.topic.parser(value);
			}
			this.textNode.innerHTML = value;
			this._set("text", value);
		},

		startup: function(){
			this.inherited(arguments);
			fade.show(this.domNode);
		},

		_onQuote: function(e){
			e && e.preventDefault();
			this.emit("quote", { item: this.item });
		}
	});

	return declare([_LayoutWidget, _TemplatedMixin, _StoreMixin, _TopicMixin], {
		baseClass: "doteTopic",
		templateString: topicTemplate,

		cssStateNodes: {
			"voteUpNode": "doteTopicVoteUp",
			"voteNeutralNode": "doteTopicVoteNeutral",
			"voteDownNode": "doteTopicVoteDown",
			"previousButtonNode": "doteTopicPreviousButton"
		},

		previousLabel: '<i class="icon-chevron-up"></i> Previous <i class="icon-chevron-up"></i>',
		loadingLabel: '<span class="dijitInline doteTopicLoadingIcon"></span>Loading...',

		_widgets: [],

		postText: null,
		previewPane: null,
		submitButton: null,
		previewContainer: null,
		topicStore: null,

		user: null,
		_setUserAttr: function(value){
			this._set("voter", value);
			this._set("user", value);
		},

		vote: null,
		_setVoteAttr: function(value){
			if(this.item){
				var self = this;
				this.refresh().then(function () {
					var exists = array.some(self.item.voters, function(voter, idx){
						if(voter.user.id === self.user.id){
							if (value === null) {
								self.item.voters.splice(idx, 1);
							}
							else {
								voter.vote = value;
							}
							return true;
						}else{
							return false;
						}
					}, self);
					if(!exists){
						self.item.voters.push({
							user: self.user,
							vote: value
						});
					}
					self.set("voters", self.item.voters);
					self.topicStore.put(self.item);
				});
			}
			this._set("vote", value);
		},

		tags: [],
		_setTagsAttr: function(value){
			if(typeof value === "string"){
				value = value.replace(/\s{2,}/," ").toLowerCase().split(/\s*,\s*/);
			}
			if(this.item && this.tags && value && this._started && (value.join() !== this.tags.join())){
				this.item.tags = value;
				this.topicStore.put(this.item);
			}
			this._set("tags", value);
			if(this._started){
				this._displayTags();
			}
		},

		_setWatchersAttr: function(value){
			this.inherited(arguments);
			if(this._started && this.item && value && value instanceof Array){
				this.item.watchers = value.slice(0);
				this.topicStore.put(this.item);
			}
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

		_setDescriptionAttr: function(value){
			if(this.parser){
				value = this.parser(value);
			}
			this.descriptionNode.innerHTML = value;
			this._set("description", value);
		},

		previous: false,
		_setPreviousAttr: function(value){
			if(value !== this.previous){
				if(value){
					var previousCount = this.total - this.getChildren().length;
					this.previousLabel = '<i class="icon-chevron-up"></i> Previous (' + previousCount +
						') <i class="icon-chevron-up"></i>';
					this.previousButtonNode.innerHTML = this.previousLabel;
					domClass.remove(this.previousNode, this.baseClass + "Hide");
				}else{
					domClass.add(this.previousNode, this.baseClass + "Hide");
				}
				this._set("previous", value);
			}
		},

		_setSummaryAttr: null,

		tagsEditable: true,

		buildRendering: function(){
			this.inherited(arguments);
			this._widgets = [];

			this.previewContainer = new TabContainer({
				id: this.id + "_previewContainer",
				doLayout: false
			}, this.previewContainerNode);
			var writeContentPane = new ContentPane({
				id: this.id + "_writeContentPane",
				title: '<i class="icon-pencil"></i> Write'
			});
			writeContentPane.addChild(this.postText = new Textarea({
				id: this.id + "_postText",
				name: "postText",
				style: {
					minHeight: "120px"
				},
				rows: 15
			}));
			this.previewContainer.addChild(writeContentPane);

			this.previewContainer.addChild(this.previewPane = new ContentPane({
				id: this.id + "_previewPane",
				title: '<i class="icon-eye-open"></i> Preview'
			}));

			this.own(this.previewPane.on("show", lang.hitch(this, this.previewComment)));

			this._widgets.push(this.previewContainer);

			this.submitButton = new Button({
				id: this.id + "_submitButton",
				label: '<i class="icon-comment"></i> Comment'
			});
			this.own(this.submitButton.on("click", lang.hitch(this, this._onSubmit)));
			this.submitButton.placeAt(this.submitNode);
			this._widgets.push(this.submitButton);

			if(this.user.id === this.owner){
				this.actionSelect = new Select({
					id: this.id + "_actionSelect",
					options: actions
				});
				this.actionSelect.placeAt(this.actionNode);
				this.own(this.actionSelect.on("change", lang.hitch(this, this._onActionChange)));
				this._widgets.push(this.actionSelect);
			}
		},

		startup: function(){
			this.own(this.on("results", lang.hitch(this, this._onResults)));
			array.forEach(this._widgets, function(widget){
				if(widget && !widget._started && widget.startup){
					widget.startup();
				}
			});
			fade.show(this.domNode);
			this.previewContainer.resize();
			this.inherited(arguments);
		},

		refresh: function () {
			var self = this;
			if (this.item && this.item.id && this._started) {
				return when(this.topicStore.get(this.item.id)).then(function (item) {
					self._set('item', item);
					return item;
				});
			}
		},

		parser: null,

		previewComment: function(){
			var text = this.postText.get("value");
			if(this.parser){
				text = this.parser(text);
			}
			this.previewPane.set("content", text);
		},

		_onResults: function(e){
			if(e && e.items){
				var self = this;
				e.items.forEach(function(item){
					if(item.id in self.itemWidgets){
						self.itemWidgets[item.id].set("item", item);
					}else{
						self.addChild(self.itemWidgets[item.id] = new _TopicComment({
							id: self.id + "_comment" + self.getChildren().length,
							item: item,
							topic: self
						}), 0);
						self.own(self.itemWidgets[item.id].on("quote", lang.hitch(self, self._onQuote)));
					}
				});
				if(this.total && this.total > this.getChildren().length){
					this.set("previous", false);
					this.set("previous", true);
				}else{
					this.set("previous", false);
				}
			}
		},

		_onActionChange: function(value){
			this.inherited(arguments);
			if(this.item.action !== value){
				var self = this;
				this.refresh().then(function (item) {
					self.item = item;
					self.item.action = value;
					when(self.topicStore.put(self.item), function (item) {
						self.set('item', item);
					});
				});
			}
		},

		_onSubmit: function(e){
			e && e.preventDefault();
			this.submitButton.set("disabled", true);
			var self = this;
			when(this.store.add({
				author: this.user.id,
				text: this.postText.get("value"),
				created: moment().unix(),
				topicId: this.item.id
			}), function(item){
				self.submitButton.set("disabled", false);
				self.postText.set("value", "");
				self.set("commentsCount", self.get("commentsCount") + 1);
				self.addChild(self.itemWidgets[item.id] = new _TopicComment({
					id: self.id + "_comment" + self.getChildren().length,
					item: item,
					topic: self
				}));
				self.own(self.itemWidgets[item.id].on("quote", lang.hitch(self, self._onQuote)));
			}, function(){
				self.submitButton.set("disabled", false);
			});
		},

		_onQuote: function(e){
			this.postText.set("value",
				this.postText.get("value") + "\n**" + e.item.author + "** said:\n > " +
				e.item.text.replace(/\n/g, "\n > ") + "\n");
		},

		_setLoading: function(loading){
			if(loading){
				attr.set(this.previousButtonNode, "disabled", "disabled");
				this.previousButtonNode.innerHTML = this.loadingLabel;
			}else{
				attr.remove(this.previousButtonNode, "disabled");
				this.previousButtonNode.innerHTML = this.previousLabel;
			}
		},

		_onPreviousClick: function(e){
			e && e.preventDefault();
			this._setLoading(true);
			this.fetch().then(lang.hitch(this, this._setLoading));
		}
	});
});require({cache:{
'url:dote-client/resources/_TopicComment.html':"<div class=\"${baseClass}\">\n\t<div class=\"${baseClass}Header\">\n\t\t<a name=\"\" data-dojo-attach-point=\"anchorNode\"></a>\n\t\t<div class=\"${baseClass}Right\">\n\t\t\t<span class=\"${baseClass}Moment\" data-dojo-attach-point=\"momentNode\"></span>\n\t\t\t<span>\n\t\t\t\t<a href=\"#quote\" data-dojo-attach-event=\"onclick:_onQuote\"><i class=\"icon-quote-left\"></i><span class=\"${baseClass}Label\">Quote</span></a>\n\t\t\t\t<a href=\"#\" data-dojo-attach-point=\"linkNode\"><i class=\"icon-link\"></i><span class=\"${baseClass}Label\">Link</span></a>\n\t\t\t</span>\n\t\t</div>\n\t\t<div class=\"${baseClass}Author\" data-dojo-attach-point=\"authorNode\"></div>\n\t</div>\n\t<div class=\"${baseClass}Text\" data-dojo-attach-point=\"textNode\"></div>\n</div>",
'url:dote-client/resources/Topic.html':"<div class=\"${baseClass}\">\n\t<div class=\"${baseClass}Watch\">\n\t\t<a href=\"#\" data-dojo-attach-event=\"ondijitclick:_onWatchClick\">\n\t\t\t<i data-dojo-attach-point=\"watchNode\" class=\"icon-star-empty\"></i>\n\t\t</a>\n\t</div>\n\t<div class=\"${baseClass}Title\" data-dojo-attach-point=\"titleNode\"></div>\n\t<div class=\"${baseClass}VoteContainer\">\n\t\t<div class=\"${baseClass}VoteInner\">\n\t\t\t<div class=\"${baseClass}Votes\" data-dojo-attach-point=\"votesNode\"></div>\n\t\t\t<div class=\"${baseClass}TotalVotes\" data-dojo-attach-point=\"totalVotesNode\"></div>\n\t\t\t<div class=\"${baseClass}Spark\">\n\t\t\t\t<table>\n\t\t\t\t\t<col class=\"${baseClass}SparkPlus\" data-dojo-attach-point=\"sparkPlusNode\">\n\t\t\t\t\t<col class=\"${baseClass}SparkNeutral\" data-dojo-attach-point=\"sparkNeutralNode\">\n\t\t\t\t\t<col class=\"${baseClass}SparkMinus\" data-dojo-attach-point=\"sparkMinusNode\">\n\t\t\t\t\t<tbody>\n\t\t\t\t\t\t<td></td>\n\t\t\t\t\t\t<td></td>\n\t\t\t\t\t\t<td></td>\n\t\t\t\t\t</tbody>\n\t\t\t\t</table>\n\t\t\t</div>\n\t\t\t<div class=\"${baseClass}VoteButtons\">\n\t\t\t\t<ul>\n\t\t\t\t\t<li role=\"button\">\n\t\t\t\t\t\t<a href=\"#\" class=\"${baseClass}VoteUp\" data-dojo-attach-point=\"voteUpNode\" data-dojo-attach-event=\"ondijitclick:_onUpClick\"><i class=\"icon-plus\"></i><span>Up</span></a>\n\t\t\t\t\t</li>\n\t\t\t\t\t<li role=\"button\">\n\t\t\t\t\t\t<a href=\"#\" class=\"${baseClass}VoteNeutral\" data-dojo-attach-point=\"voteNeutralNode\" data-dojo-attach-event=\"ondijitclick:_onNeutralClick\"><i class=\"icon-circle-blank\"></i><span>Neutral</span></a>\n\t\t\t\t\t</li>\n\t\t\t\t\t<li role=\"button\">\n\t\t\t\t\t\t<a href=\"#\" class=\"${baseClass}VoteDown\" data-dojo-attach-point=\"voteDownNode\" data-dojo-attach-event=\"ondijitclick:_onDownClick\"><i class=\"icon-minus\"></i><span>Minus</span></a>\n\t\t\t\t\t</li>\n\t\t\t\t</ul>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n\t<div class=\"${baseClass}ContentContainer\">\n\t\t<div class=\"${baseClass}ContentInner\">\n\t\t\t<div class=\"${baseClass}Status\" data-dojo-attach-point=\"statusContainerNode\">\n\t\t\t\t<div class=\"${baseClass}Action\" data-dojo-attach-point=\"actionStatusNode\"></div>\n\t\t\t\t<div class=\"${baseClass}Poster\" data-dojo-attach-point=\"posterNode\"></div>\n\t\t\t\t<div class=\"${baseClass}Owner\" data-dojo-attach-point=\"ownerNode\"></div>\n\t\t\t\t<div class=\"${baseClass}Posted\" data-dojo-attach-point=\"postedStatusNode\"></div>\n\t\t\t\t<div class=\"${baseClass}Actioned\" data-dojo-attach-point=\"actionedStatusNode\"></div>\n\t\t\t\t<div class=\"${baseClass}CommentCount\"><i class=\"icon-comments-alt\"></i><span data-dojo-attach-point=\"commentsCountNode\"></span></div>\n\t\t\t</div>\n\t\t\t<div class=\"${baseClass}TagsContainer\">\n\t\t\t\t<i class=\"icon-tags icon-large\"></i>\n\t\t\t\t<ul class=\"${baseClass}Tags\" data-dojo-attach-point=\"tagsNode\">\n\t\t\t\t</ul>\n\t\t\t</div>\n\t\t\t<div class=\"${baseClass}VotersContainer\">\n\t\t\t\t<i class=\"icon-check icon-large\"></i>\n\t\t\t\t<ul class=\"${baseClass}Voters\" data-dojo-attach-point=\"votersNode\">\n\t\t\t\t</ul>\n\t\t\t</div>\n\t\t\t<div class=\"${baseClass}HeightContainer\"></div>\n\t\t</div>\n\t</div>\n\t<div class=\"${baseClass}HeightContainer\"></div>\n\t<div class=\"${baseClass}Description\" data-dojo-attach-point=\"descriptionNode\"></div>\n\t<div class=\"${baseClass}Hide ${baseClass}Previous\" data-dojo-attach-point=\"previousNode\">\n\t\t<button type=\"button\" class=\"${baseClass}PreviousButton\" data-dojo-attach-point=\"previousButtonNode\" data-dojo-attach-event=\"ondijitclick:_onPreviousClick\">${!previousLabel}</button>\n\t</div>\n\t<div class=\"${baseClass}Comments\" data-dojo-attach-point=\"containerNode\"></div>\n\t<form class=\"${baseClass}Post\" id=\"${id}_post\" action=\"\" method=\"post\" data-dojo-attach-point=\"postNode\">\n\t\t<div class=\"${baseClass}PreviewContainer\" data-dojo-attach-point=\"previewContainerNode\"></div>\n\t\t<div class=\"${baseClass}Submit\" data-dojo-attach-point=\"submitNode\"></div>\n\t</form>\n</div>"}});
