define([
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
				var exists = array.some(this.item.voters, function(voter, idx){
					if(voter.user.id === this.user.id){
						voter.vote = value;
						return true;
					}else{
						return false;
					}
				}, this);
				if(!exists){
					this.item.voters.push({
						user: this.user,
						vote: value
					});
				}
				this.set("voters", this.item.voters);
				this.topicStore.put(this.item);
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
				this.item.action = value;
				var self = this;
				when(this.topicStore.put(this.item), function(item){
					self.set("item", item);
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
});