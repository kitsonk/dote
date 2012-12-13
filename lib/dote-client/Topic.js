require({cache:{
'url:dote-client/resources/_TopicComment.html':"<div class=\"${baseClass}\">\n\t<div class=\"${baseClass}Header\">\n\t\t<a name=\"\" data-dojo-attach-point=\"anchorNode\"></a>\n\t\t<div class=\"${baseClass}Right\">\n\t\t\t<span class=\"${baseClass}Moment\" data-dojo-attach-point=\"momentNode\"></span>\n\t\t\t<span>\n\t\t\t\t<a href=\"#quote\" data-dojo-attach-event=\"onclick:_onQuote\"><i class=\"icon-comments-alt\"></i><span class=\"${baseClass}Label\">Quote</span></a>\n\t\t\t\t<a href=\"#\" data-dojo-attach-point=\"linkNode\"><i class=\"icon-link\"></i><span class=\"${baseClass}Label\">Link</span></a>\n\t\t\t</span>\n\t\t</div>\n\t\t<div class=\"${baseClass}Author\" data-dojo-attach-point=\"authorNode\"></div>\n\t</div>\n\t<div class=\"${baseClass}Text\" data-dojo-attach-point=\"textNode\"></div>\n</div>",
'url:dote-client/resources/Topic.html':"<div class=\"${baseClass}\">\n\t<div class=\"${baseClass}Title\" data-dojo-attach-point=\"titleNode\"></div>\n\t<div class=\"${baseClass}VoteContainer\">\n\t\t<div class=\"${baseClass}VoteInner\">\n\t\t\t<div class=\"${baseClass}Votes\" data-dojo-attach-point=\"votesNode\"></div>\n\t\t\t<div class=\"${baseClass}Spark\">\n\t\t\t\t<table>\n\t\t\t\t\t<col class=\"${baseClass}SparkPlus\" data-dojo-attach-point=\"sparkPlusNode\">\n\t\t\t\t\t<col class=\"${baseClass}SparkNeutral\" data-dojo-attach-point=\"sparkNeutralNode\">\n\t\t\t\t\t<col class=\"${baseClass}SparkMinus\" data-dojo-attach-point=\"sparkMinusNode\">\n\t\t\t\t\t<tbody>\n\t\t\t\t\t\t<td></td>\n\t\t\t\t\t\t<td></td>\n\t\t\t\t\t\t<td></td>\n\t\t\t\t\t</tbody>\n\t\t\t\t</table>\n\t\t\t</div>\n\t\t\t<div class=\"${baseClass}VoteButtons\">\n\t\t\t\t<ul>\n\t\t\t\t\t<li role=\"button\">\n\t\t\t\t\t\t<a href=\"#\" class=\"${baseClass}VoteUp\" data-dojo-attach-point=\"voteUpNode\" data-dojo-attach-event=\"ondijitclick:_onUpClick\"><i class=\"icon-plus\"></i><span>Up</span></a>\n\t\t\t\t\t</li>\n\t\t\t\t\t<li role=\"button\">\n\t\t\t\t\t\t<a href=\"#\" class=\"${baseClass}VoteNeutral\" data-dojo-attach-point=\"voteNeutralNode\" data-dojo-attach-event=\"ondijitclick:_onNeutralClick\"><i class=\"icon-check-empty\"></i><span>Neutral</span></a>\n\t\t\t\t\t</li>\n\t\t\t\t\t<li role=\"button\">\n\t\t\t\t\t\t<a href=\"#\" class=\"${baseClass}VoteDown\" data-dojo-attach-point=\"voteDownNode\" data-dojo-attach-event=\"ondijitclick:_onDownClick\"><i class=\"icon-minus\"></i><span>Minus</span></a>\n\t\t\t\t\t</li>\n\t\t\t\t</ul>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n\t<div class=\"${baseClass}ContentContainer\">\n\t\t<div class=\"${baseClass}ContentInner\">\n\t\t\t<div class=\"${baseClass}Status\" data-dojo-attach-point=\"statusContainerNode\">\n\t\t\t\t<div class=\"${baseClass}Action\" data-dojo-attach-point=\"actionStatusNode\"></div>\n\t\t\t\t<div class=\"${baseClass}Poster\" data-dojo-attach-point=\"posterNode\"></div>\n\t\t\t\t<div class=\"${baseClass}Owner\" data-dojo-attach-point=\"ownerNode\"></div>\n\t\t\t\t<div class=\"${baseClass}Posted\" data-dojo-attach-point=\"postedStatusNode\"></div>\n\t\t\t\t<div class=\"${baseClass}Actioned\" data-dojo-attach-point=\"actionedStatusNode\"></div>\n\t\t\t\t<div class=\"${baseClass}CommentCount\"><i class=\"icon-comments-alt\"></i><span data-dojo-attach-point=\"commentsCountNode\"></span></div>\n\t\t\t</div>\n\t\t\t<div class=\"${baseClass}TagsContainer\">\n\t\t\t\t<i class=\"icon-tags icon-large\"></i>\n\t\t\t\t<ul class=\"${baseClass}Tags\" data-dojo-attach-point=\"tagsNode\">\n\t\t\t\t</ul>\n\t\t\t</div>\n\t\t\t<div class=\"${baseClass}VotersContainer\">\n\t\t\t\t<i class=\"icon-check icon-large\"></i>\n\t\t\t\t<ul class=\"${baseClass}Voters\" data-dojo-attach-point=\"votersNode\">\n\t\t\t\t</ul>\n\t\t\t</div>\n\t\t\t<div class=\"${baseClass}HeightContainer\"></div>\n\t\t</div>\n\t</div>\n\t<div class=\"${baseClass}HeightContainer\"></div>\n\t<div class=\"${baseClass}Description\" data-dojo-attach-point=\"descriptionNode\"></div>\n\t<div class=\"${baseClass}Comments\" data-dojo-attach-point=\"containerNode\"></div>\n\t<form class=\"${baseClass}Post\" id=\"${id}_post\" action=\"\" method=\"post\" data-dojo-attach-point=\"postNode\">\n\t\t<div class=\"${baseClass}PreviewContainer\" data-dojo-attach-point=\"previewContainerNode\"></div>\n\t\t<div class=\"${baseClass}Submit\" data-dojo-attach-point=\"submitNode\"></div>\n\t</form>\n</div>"}});
define("dote-client/Topic", [
	"./_StoreMixin",
	"./_TopicMixin",
	"dojo/_base/array", // array.forEach
	"dojo/_base/declare", // declare
	"dojo/_base/lang", // lang.mixin
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
], function(_StoreMixin, _TopicMixin, array, declare, lang, when, _Contained, _TemplatedMixin, _WidgetBase, Button,
		Textarea, _LayoutWidget, ContentPane, TabContainer, moment, commentTemplate, topicTemplate){

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

		_onQuote: function(e){
			e && e.preventDefault();
			this.emit("quote", { item: this.item });
		}
	});

	return declare([_LayoutWidget, _TemplatedMixin, _StoreMixin, _TopicMixin], {
		baseClass: "doteTopic",
		templateString: topicTemplate,

		_widgets: [],

		postText: null,
		previewPane: null,
		submitButton: null,
		previewContainer: null,
		topicStore: null,

		user: "",
		_setUserAttr: function(value){
			this._set("voter", value);
			this._set("user", value);
		},

		vote: null,
		_setVoteAttr: function(value){
			if(this.item){
				var exists = array.some(this.item.voters, function(voter, idx){
					if(voter.name === this.user){
						voter.vote = value;
						return true;
					}else{
						return false;
					}
				}, this);
				if(!exists){
					this.item.voters.push({
						name: this.user,
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
				value = value.split(/\s*,\s*/);
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

			if(this.user === this.owner){
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
			this.own(this.on("item", lang.hitch(this, this._onItem)));
			array.forEach(this._widgets, function(widget){
				if(widget && !widget._started && widget.startup){
					widget.startup();
				}
			});
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

		_onItem: function(e){
			var item = e.item;
			if(item.id in this.itemWidgets){
				this.itemWidgets[item.id].set("item", item);
			}else{
				this.addChild(this.itemWidgets[item.id] = new _TopicComment({
					id: this.id + "_comment" + this.getChildren().length,
					item: item,
					topic: this
				}));
				this.own(this.itemWidgets[item.id].on("quote", lang.hitch(this, this._onQuote)));
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
				author: this.user,
				text: this.postText.get("value"),
				created: moment().unix(),
				topicId: this.item.id
			}), function(){
				self.submitButton.set("disabled", false);
				self.postText.set("value", "");
				self.set("commentsCount", self.get("commentsCount") + 1);
				self.refresh();
			}, function(){
				self.submitButton.set("disabled", false);
			});
		},

		_onQuote: function(e){
			this.postText.set("value",
				this.postText.get("value") + "\n**" + e.item.author + "** said:\n > " +
				e.item.text.replace(/\n/g, "\n > ") + "\n");
		},

		addComment: function(commentInfo){
			this.addChild(new _TopicComment(lang.mixin(commentInfo, {
				id: this.id + "_comment" + this.getChildren().length,
				topic: this
			})), 0);
		}
	});
});