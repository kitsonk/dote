define([
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
	"dojo/when", // when
	"dojo/window", // winUtil.getBox
	"dijit/_Contained",
	"dijit/_CssStateMixin",
	"dijit/_OnDijitClickMixin",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetBase",
	"dijit/layout/_LayoutWidget",
	"dojo/text!./resources/_TopicListItem.html",
	"dojo/text!./resources/TopicList.html"
], function(_StoreMixin, _TopicMixin, fade, array, declare, lang, win, attr, domClass, domGeom, JSON, on, when,
		winUtil, _Contained, _CssStateMixin, _OnDijitClickMixin, _TemplatedMixin, _WidgetBase, _LayoutWidget,
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
			if(this.item && this.item.id){
				var self = this;
				this.refresh().then(function (item) {
					self.item = item;
					var exists = array.some(self.item.voters, function(voter, idx){
						if(voter.user.id === self.topicList.user.id){
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
							user: self.topicList.user,
							vote: value
						});
					}
					self.set("voters", self.item.voters);
					return self.topicList.store.put(self.item);
				});
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

		refresh: function () {
			var self = this;
			if (this.item && this.item.id && this._started) {
				return when(this.topicList.store.get(this.item.id)).then(function (item) {
					self._set('item', item);
					return item;
				});
			}
		},

		_onActionChange: function(value){
			this.inherited(arguments);
			if(this.item.action !== value){
				var self = this;
				this.refresh().then(function (item) {
					self.item = item;
					self.item.action = value;
					self.topicList.store.put(self.item).then(function (item) {
						self._set('item', item);
					});
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

		user: null,

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
});