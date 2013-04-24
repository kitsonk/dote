define("dote-client/TopicList", [
	"./_StoreMixin",
	"./_TopicMixin",
	"./fade",
	"dojo/_base/array", // array.forEach
	"dojo/_base/declare", // declare
	"dojo/_base/lang", // lang.mixin, lang.hitch
	"dojo/_base/window", // win.doc
	"dojo/dom-attr", // attr.set, attr.remove
	"dojo/dom-class", // domClass.toggle
	"dojo/dom-geometry", // domGeom.position
	"dojo/json", // JSON.parse
	"dojo/on", // on
	"dojo/window", // winUtil.getBox
	"dijit/_Contained",
	"dijit/_CssStateMixin",
	"dijit/_OnDijitClickMixin",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetBase",
	"dijit/layout/_LayoutWidget",
	"dojo/text!./resources/_TopicListItem.html",
	"dojo/text!./resources/TopicList.html"
], function(_StoreMixin, _TopicMixin, fade, array, declare, lang, win, attr, domClass, domGeom, JSON, on, winUtil,
		_Contained, _CssStateMixin, _OnDijitClickMixin, _TemplatedMixin, _WidgetBase, _LayoutWidget,
		templateTopicListItem, templateTopicList){

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
				value = value.replace(/\s{2,}/," ").toLowerCase().split(/\s*,\s*/);
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

		_setWatchersAttr: function(value){
			this.inherited(arguments);
			if(this._started && this.item && value && value instanceof Array){
				this.item.watchers = value.slice(0);
				this.topicList.store.put(this.item);
			}
		},

		tagsEditable: true,

		topicList: null,

		startup: function(){
			this.inherited(arguments);
			fade.show(this.domNode);
		},

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
		loadingLabel: '<span class="dijitInline doteTopicListLoadingIcon"></span>Loading...',

		cssStateNodes: {
			"moreButtonNode": "doteTopicListMoreButton"
		},

		user: "",

		more: false,
		_setMoreAttr: function(value){
			if(value !== this.more){
				if(value){
					domClass.remove(this.moreNode, this.baseClass + "Hide");
					this._signals.push(on(this.domNode.parentNode, "scroll", lang.hitch(this, this._calcMoreVisible)));
					this._signals.push(on(win.doc, "scroll", lang.hitch(this, this._calcMoreVisible)));
				}else{
					domClass.add(this.moreNode, this.baseClass + "Hide");
					array.forEach(this._signals, function(signal){
						signal.remove();
					});
					this._signals = [];
				}
				this._set("more", value);
			}
		},

		moreVisible: false,

		_signals: null,
		_morePos: null,

		constructor: function(){
			this._signals = [];
		},

		startup: function(){
			this.inherited(arguments);
			this.own(this.on("results", lang.hitch(this, this._onResults)));
			this.own(this.on("visible", lang.hitch(this, this._onVisible)));
		},

		addTopic: function(topicInfo){
			var topicSettings = lang.mixin(topicInfo, {
				id: this.id + "_topic" + this.getChildren().length
			});
			this.addChild(new _TopicItem(topicSettings));
		},

		empty: function(){
			this.set("more", false);
			this.set("start", 0);
			this.destroyDescendants();
		},

		_onResults: function(e){
			if(e && e.items){
				var self = this;
				this._morePos = null;
				e.items.forEach(function(item){
					self.addChild(new _TopicItem({
						id: self.id + "_topic" + self.getChildren().length,
						voter: self.user,
						topicList: self,
						item: item
					}));
				});
				if(this.total && this.total > this.getChildren().length){
					this.set("more", true);
				}else{
					this.set("more", false);
				}
			}
		},

		_calcMoreVisible: function(){
			var morePos = this._morePos = this._morePos || domGeom.position(this.moreNode, true),
				winPos = winUtil.getBox(),
				moreVisible = ((morePos.y > (winPos.t)) && (morePos.y <= (winPos.h + winPos.t))) &&
					((morePos.x > winPos.l) && (morePos.x <= (winPos.w + winPos.l)));
			if(moreVisible !== this.moreVisible){
				if(moreVisible && !this.moreVisible){
					this.emit("visible", { node: this.moreNode, position: { node: morePos, win: winPos } });
				}
				this.set("moreVisible", moreVisible);
			}
		},

		_setLoading: function(loading){
			if(loading){
				attr.set(this.moreButtonNode, "disabled", "disabled");
				this.moreButtonNode.innerHTML = this.loadingLabel;
			}else{
				attr.remove(this.moreButtonNode, "disabled");
				this.moreButtonNode.innerHTML = this.moreLabel;
			}
		},

		_onVisible: function(e){
			if(e.node === this.moreNode){
				if(this.start < this.maxCount){
					console.log("fetch!");
					this._setLoading(true);
					this.fetch().then(lang.hitch(this, this._setLoading));
				}
			}
		},

		_onMoreClick: function(e){
			e && e.preventDefault();
			this._setLoading(true);
			this.fetch().then(lang.hitch(this, this._setLoading));
		}

	});
});require({cache:{
'url:dote-client/resources/_TopicListItem.html':"<div class=\"${baseClass}\">\n\t<div class=\"${baseClass}VoteContainer\">\n\t\t<div class=\"${baseClass}VoteInner\">\n\t\t\t<div class=\"${baseClass}Votes\" data-dojo-attach-point=\"votesNode\"></div>\n\t\t\t<div class=\"${baseClass}Spark\">\n\t\t\t\t<table>\n\t\t\t\t\t<col class=\"${baseClass}SparkPlus\" data-dojo-attach-point=\"sparkPlusNode\">\n\t\t\t\t\t<col class=\"${baseClass}SparkNeutral\" data-dojo-attach-point=\"sparkNeutralNode\">\n\t\t\t\t\t<col class=\"${baseClass}SparkMinus\" data-dojo-attach-point=\"sparkMinusNode\">\n\t\t\t\t\t<tbody>\n\t\t\t\t\t\t<td></td>\n\t\t\t\t\t\t<td></td>\n\t\t\t\t\t\t<td></td>\n\t\t\t\t\t</tbody>\n\t\t\t\t</table>\n\t\t\t</div>\n\t\t\t<div class=\"${baseClass}VoteButtons\">\n\t\t\t\t<ul>\n\t\t\t\t\t<li role=\"button\">\n\t\t\t\t\t\t<a href=\"#\" class=\"${baseClass}VoteUp\" data-dojo-attach-point=\"voteUpNode\" data-dojo-attach-event=\"ondijitclick:_onUpClick\"><i class=\"icon-plus\"></i><span>Up</span></a>\n\t\t\t\t\t</li>\n\t\t\t\t\t<li role=\"button\">\n\t\t\t\t\t\t<a href=\"#\" class=\"${baseClass}VoteNeutral\" data-dojo-attach-point=\"voteNeutralNode\" data-dojo-attach-event=\"ondijitclick:_onNeutralClick\"><i class=\"icon-circle-blank\"></i><span>Neutral</span></a>\n\t\t\t\t\t</li>\n\t\t\t\t\t<li role=\"button\">\n\t\t\t\t\t\t<a href=\"#\" class=\"${baseClass}VoteDown\" data-dojo-attach-point=\"voteDownNode\" data-dojo-attach-event=\"ondijitclick:_onDownClick\"><i class=\"icon-minus\"></i><span>Minus</span></a>\n\t\t\t\t\t</li>\n\t\t\t\t</ul>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n\t<div class=\"${baseClass}ContentContainer\">\n\t\t<div class=\"${baseClass}Watch\">\n\t\t\t<a href=\"#\" data-dojo-attach-event=\"ondijitclick:_onWatchClick\">\n\t\t\t\t<i data-dojo-attach-point=\"watchNode\" class=\"icon-star-empty\"></i>\n\t\t\t</a>\n\t\t</div>\n\t\t<div class=\"${baseClass}ContentInner\">\n\t\t\t<div class=\"${baseClass}Title\" data-dojo-attach-point=\"titleNode\"></div>\n\t\t\t<div class=\"${baseClass}Status\" data-dojo-attach-point=\"statusContainerNode\">\n\t\t\t\t<div class=\"${baseClass}Action\" data-dojo-attach-point=\"actionStatusNode\"></div>\n\t\t\t\t<div class=\"${baseClass}Owner\" data-dojo-attach-point=\"ownerNode\"></div>\n\t\t\t\t<div class=\"${baseClass}Posted\" data-dojo-attach-point=\"postedStatusNode\"></div>\n\t\t\t\t<div class=\"${baseClass}Actioned\" data-dojo-attach-point=\"actionedStatusNode\"></div>\n\t\t\t\t<div class=\"${baseClass}CommentCount\"><i class=\"icon-comments-alt\"></i><span data-dojo-attach-point=\"commentsCountNode\"></span></div>\n\t\t\t</div>\n\t\t\t<div class=\"${baseClass}Summary\" data-dojo-attach-point=\"summaryNode\"></div>\n\t\t\t<div class=\"${baseClass}TagsContainer\">\n\t\t\t\t<i class=\"icon-tags icon-large\"></i>\n\t\t\t\t<ul class=\"${baseClass}Tags\" data-dojo-attach-point=\"tagsNode\">\n\t\t\t\t</ul>\n\t\t\t</div>\n\t\t\t<div class=\"${baseClass}VotersContainer\">\n\t\t\t\t<i class=\"icon-check icon-large\"></i>\n\t\t\t\t<ul class=\"${baseClass}Voters\" data-dojo-attach-point=\"votersNode\">\n\t\t\t\t</ul>\n\t\t\t</div>\n\t\t\t<div class=\"${baseClass}HeightContainer\"></div>\n\t\t</div>\n\t</div>\n\t<div class=\"${baseClass}HeightContainer\"></div>\n</div>\n",
'url:dote-client/resources/TopicList.html':"<div class=\"${baseClass}\" role=\"presentation\" data-dojo-attach-point=\"wrapperNode\">\n\t<div class=\"${baseClass}Container\" data-dojo-attach-point=\"containerNode\"></div>\n\t<div class=\"${baseClass}More ${baseClass}Hide\" data-dojo-attach-point=\"moreNode\">\n\t\t<button type=\"button\" class=\"${baseClass}MoreButton\" data-dojo-attach-event=\"ondijitclick:_onMoreClick\" data-dojo-attach-point=\"moreButtonNode\">${moreLabel}</button>\n\t</div>\n</div>"}});
