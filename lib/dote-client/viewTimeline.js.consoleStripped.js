require({cache:{
'dote-client/Timeline':function(){
define([
	'./_StoreMixin',
	'./fade',
	'dojo/_base/array',
	'dojo/_base/declare', // declare
	'dojo/_base/lang', // lang.mixin, lang.hitch
	'dojo/_base/window', // win.doc win.global
	'dojo/dom-attr', // attr.set attr.remove
	'dojo/dom-class', // domClass.remove
	'dojo/dom-geometry', // domGeom.position
	'dojo/on', // on
	'dojo/window', // winUtil.getBox
	'dijit/_Contained',
	'dijit/_CssStateMixin',
	'dijit/_OnDijitClickMixin',
	'dijit/_TemplatedMixin',
	'dijit/_WidgetBase',
	'dijit/layout/_LayoutWidget',
	'moment/moment',
	'dojo/text!./resources/_Event.html',
	'dojo/text!./resources/Timeline.html'
], function (_StoreMixin, fade, array, declare, lang, win, attr, domClass, domGeom, on, winUtil, _Contained,
		_CssStateMixin, _OnDijitClickMixin, _TemplatedMixin, _WidgetBase, _LayoutWidget, moment, templateEvent,
		templateTimeline) {

	var eventTypeClasses = [
			'doteEventTypeVotePlus',
			'doteEventTypeVoteMinus',
			'doteEventTypeVoteNeutral',
			'doteEventTypeComment',
			'doteEventTypeQuestion',
			'doteEventTypeActionAccepted',
			'doteEventTypeActionRejected',
			'doteEventTypeActionClosed',
			'doteEventTypeActionOpen',
			'doteEventTypeNew',
			'doteEventTypeAssign',
			'doteEventTypeTag',
			'doteEventTypeWelcome'
		];

	var _Event = declare([_WidgetBase, _Contained, _TemplatedMixin, _OnDijitClickMixin, _CssStateMixin], {
		baseClass: 'doteEvent',
		templateString: templateEvent,

		cssStateNodes: {
			"innerNode": "doteEventInner"
		},

		item: null,
		_setItemAttr: function (value) {
			var username = (value.user && value.user.id || ''),
				voteValue;
			if (value.user && value.user.committer) {
				username = '<span class="username committer">' + username + '</span>';
			}
			else {
				username = '<span class="username">' + username + '</span>';
			}
			domClass.remove(this.typeNode, eventTypeClasses);
			switch (value.type) {
			case 'topic.vote':
				switch (value.value) {
				case -1:
					this.typeNode.innerHTML = '<i class="icon-minus"></i>';
					domClass.add(this.typeNode, 'doteEventTypeVoteMinus');
					voteValue = '-1';
					break;
				case 1:
					this.typeNode.innerHTML = '<i class="icon-plus"></i>';
					domClass.add(this.typeNode, 'doteEventTypeVotePlus');
					voteValue = '+1';
					break;
				case 0:
					this.typeNode.innerHTML = '<i class="icon-circle-blank"></i>';
					domClass.add(this.typeNode, 'doteEventTypeVoteNeutral');
					voteValue = '0';
					break;
				default:
					this.typeNode.innerHTML = '<i class="icon-question"></i>';
					domClass.add(this.typeNode, 'doteEventTypeQuestion');
					voteValue = '?';
				}
				this.descriptionNode.innerHTML = username + ' has voted <span class="vote">' + voteValue +
					'</span> on topic <span class="topicTitle">' + value.topic.title + '</span>.';
				this.set('href', '/topic/' + value.target);
				break;
			case 'comment':
				this.typeNode.innerHTML = '<i class="icon-comment"></i>';
				domClass.add(this.typeNode, 'doteEventTypeComment');
				this.descriptionNode.innerHTML = username + ' has commented on topic <span class="topicTitle">' +
					value.topic.title + '</span>.';
				this.set('href', '/topic/' + value.topicId + '#' + value.target);
				break;
			case 'topic.action':
				switch (value.value) {
				case 'accepted':
					this.typeNode.innerHTML = '<i class="icon-ok"></i>';
					domClass.add(this.typeNode, 'doteEventTypeActionAccepted');
					break;
				case 'rejected':
					this.typeNode.innerHTML = '<i class="icon-remove"></i>';
					domClass.add(this.typeNode, 'doteEventTypeActionRejected');
					break;
				case 'closed':
					this.typeNode.innerHTML = '<i class="icon-trash"></i>';
					domClass.add(this.typeNode, 'doteEventTypeActionClosed');
					break;
				case 'opened':
				case 'reopened':
					this.typeNode.innerHTML = '<i class="icon-info"></i>';
					domClass.add(this.typeNode, 'doteEventTypeActionOpen');
					break;
				default:
					this.typeNode.innerHTML = '<i class="icon-question"></i>';
				}
				this.descriptionNode.innerHTML = username + ' has <span class="action">' + value.value +
					'</span> topic <span class="topicTitle">' + value.topic.title + '</span>.';
				this.set('href', '/topic/' + value.target);
				break;
			case 'topic.new':
				this.typeNode.innerHTML = '<i class="icon-pencil"></i>';
				domClass.add(this.typeNode, 'doteEventTypeNew');
				this.descriptionNode.innerHTML = username + ' has created the topic <span class="topicTitle">' +
					value.topic.title + '</span>.';
				this.set('href', '/topic/' + value.target);
				break;
			case 'topic.assigned':
				this.typeNode.innerHTML = '<i class="icon-legal"></i>';
				domClass.add(this.typeNode, 'doteEventTypeAssign');
				this.descriptionNode.innerHTML = username + ' has been assigned to topic <span class="topicTitle">' +
					value.topic.title + '</span>.';
				this.set('href', '/topic/' + value.target);
				break;
			case 'topic.tag':
				this.typeNode.innerHTML = '<i class="icon-tag"></i>';
				domClass.add(this.typeNode, 'doteEventTypeTag');
				this.descriptionNode.innerHTML = username + ' has tagged topic <span class="topicTitle">' +
					value.topic.title + '</span>.';
				this.set('href', '/topic/' + value.target);
				break;
			case 'user.welcome':
				this.typeNode.innerHTML = '<i class="icon-user"></i>';
				domClass.add(this.typeNode, 'doteEventTypeWelcome');
				this.descriptionNode.innerHTML = '<span class="newuser">' + value.target + '</span> has joined.';
				this.set('href', '');
				break;
			default:
				this.typeNode.innerHTML = '<i class="icon-question"></i>';
				this.descriptionNode.innerHTML = 'Someone did something, but I don\'t know what it was.';
				this.set('href', '');
			}
			if (value.created) {
				this.timeNode.innerHTML = '<span>' + moment.unix(value.created).fromNow() + '</span>';
			}
			this._set('item', value);
		},

		href: '',

		timeline: null,

		startup: function () {
			this.inherited(arguments);
			fade.show(this.domNode);
		},

		_onClick: function (e) {
			e && e.preventDefault();
			if (this.href) {
				win.global.location.href = this.href;
			}
		}
	});

	var Timeline = declare([_LayoutWidget, _TemplatedMixin, _CssStateMixin, _OnDijitClickMixin, _StoreMixin], {
		baseClass: 'doteTimeline',
		templateString: templateTimeline,

		moreLabel: 'More...',
		loadingLabel: '<span class="dijitInline doteTopicListLoadingIcon"></span>Loading...',

		cssStateNodes: {
			"moreButtonNode": "doteTimelineMoreButton"
		},

		_signals: null,

		more: false,
		_setMoreAttr: function (value) {
			if (value !== this.more) {
				if (value) {
					domClass.remove(this.moreNode, this.baseClass + 'Hide');
					this._signals.push(on(this.domNode.parentNode, 'scroll', lang.hitch(this, this._calcMoreVisible)));
					this._signals.push(on(win.doc, 'scroll', lang.hitch(this, this._calcMoreVisible)));
				}
				else {
					domClass.add(this.moreNode, this.baseClass + 'Hide');
					array.forEach(this._signals, function (signal) {
						signal.remove();
					});
					this._signals = [];
				}
				this._set('more', value);
			}
		},

		constructor: function () {
			this._signals = [];
		},

		startup: function () {
			this.inherited(arguments);
			this.own(this.on('results', lang.hitch(this, this._onResults)));
			this.own(this.on('visible', lang.hitch(this, this._onVisible)));
		},

		addEvent: function (eventInfo) {
			this.addChild(lang.mixin(eventInfo, {
				id: this.id + '_event' + this.getChildren().length
			}));
		},

		empty: function () {
			this.set('more', false);
			this.set('start', 0);
			this.destroyDescendants();
		},

		_onResults: function (e) {
			if (e && e.items) {
				var self = this;
				self._morePos = null;
				e.items.forEach(function (item) {
					self.addChild(new _Event({
						id: this.id + '_event' + self.getChildren().length,
						timeline: self,
						item: item
					}));
				});
				if (self.total && self.total > self.getChildren().length) {
					self.set('more', true);
				}
				else {
					self.set('more', false);
				}
			}
		},

		_calcMoreVisible: function () {
			var morePos = this._morePos = this._morePos || domGeom.position(this.moreNode, true),
				winPos = winUtil.getBox(),
				moreVisible = ((morePos.y > (winPos.t)) && (morePos.y <= (winPos.h + winPos.t))) &&
					((morePos.x > winPos.l) && (morePos.x <= (winPos.w + winPos.l)));
			if (moreVisible !== this.moreVisible) {
				if (moreVisible && !this.moreVisible) {
					this.emit('visible', { node: this.moreNode, position: { node: morePos, win: winPos } });
				}
				this.set('moreVisible', moreVisible);
			}
		},

		_setLoading: function (loading) {
			if (loading) {
				attr.set(this.moreButtonNode, 'disabled', 'disabled');
				this.moreButtonNode.innerHTML = this.loadingLabel;
			}
			else {
				attr.remove(this.moreButtonNode, 'disabled');
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

		_onMoreClick: function (e) {
			e && e.preventDefault();
			this._setLoading(true);
			this.fetch().then(lang.hitch(this, this._setLoading));
		}
	});

	return Timeline;

});
},
'dote-client/_StoreMixin':function(){
define([
	"dojo/_base/array", // array.forEach
	"dojo/_base/declare", // declare
	"dojo/_base/lang", // lang.delegate lang.mixin
	"dojo/when" // when
], function(array, declare, lang, when){
	return declare(null, {

		store: null,
		_setStoreAttr: function(value){
			this._set("store", value);
			this.dirty = {};
		},

		query: null,
		_setQueryAttr: function(value){
			this._set("query", value !== undefined ? value : this.query);
			if(this.started){
				this.start = 0;
			}
		},
		_getQueryAttr: function(){
			return ((typeof this.query == "object") && (this.query !== null)) ? lang.delegate(this.query, {}) : this.query;
		},

		queryOptions: null,
		_setQueryOptionsAttr: function(value){
			var sort = value && value.sort;
			this._set("queryOptions", value || this.queryOptions);
		},
		_getQueryOptionsAttr: function(){
			return lang.delegate(this.queryOptions, {});
		},

		start: 0,
		count: 10,
		maxCount: Infinity,

		total: null,

		getBeforePut: true,
		noDataMessage: "",
		loadingMessage: "",

		constructor: function(){
			this.query = {};
			this.queryOptions = {};
			this.dirty = {};
			this.sort = [];
			this._updating = {};
		},

		_results: null,
		_querying: false,

		_doQuery: function(){
			this._qeurying = true;
			var queryOptions = lang.mixin({
				start: this.start,
				count: this.count
			}, this.queryOptions || {});
			var results = this._results = this.store.query(this.query, queryOptions),
				self = this;
			return when(results.total, function(total){
				self._set("total", total);
				return when(results, function(items){
					self.emit("results", { items: items });
					self._querying = false;
					return items;
				});
			});
		},

		fetch: function(){
			if(!this._querying){
				var self = this;
				return this._doQuery().then(function(items){
					self._set("start", self.start + items.length);
				});
			}
		},

		refresh: function(){
			if(!this._querying){
				return this._doQuery();
			}
		}
	});
});
},
'dote-client/fade':function(){
define([
	"dojo/_base/fx",
	"dojo/dom",
	"dojo/dom-style"
], function(fx, dom, style){
	return {
		show: function(node, duration, widget){
			if(typeof node === "string"){
				node = dom.byId(node);
			}
			style.set(node, "opacity", "0");
			style.set(node, "display", "block");
			fx.fadeIn({
				node: node,
				duration: duration || 500
			}).play();
			if(widget) widget.focus();
		}
	};
});
},
'dijit/_Contained':function(){
define([
	"dojo/_base/declare", // declare
	"./registry"	// registry.getEnclosingWidget(), registry.byNode()
], function(declare, registry){

	// module:
	//		dijit/_Contained

	return declare("dijit._Contained", null, {
		// summary:
		//		Mixin for widgets that are children of a container widget
		// example:
		//	|	// make a basic custom widget that knows about its parents
		//	|	declare("my.customClass",[dijit._WidgetBase, dijit._Contained],{});

		_getSibling: function(/*String*/ which){
			// summary:
			//		Returns next or previous sibling
			// which:
			//		Either "next" or "previous"
			// tags:
			//		private
			var node = this.domNode;
			do{
				node = node[which+"Sibling"];
			}while(node && node.nodeType != 1);
			return node && registry.byNode(node);	// dijit/_WidgetBase
		},

		getPreviousSibling: function(){
			// summary:
			//		Returns null if this is the first child of the parent,
			//		otherwise returns the next element sibling to the "left".

			return this._getSibling("previous"); // dijit/_WidgetBase
		},

		getNextSibling: function(){
			// summary:
			//		Returns null if this is the last child of the parent,
			//		otherwise returns the next element sibling to the "right".

			return this._getSibling("next"); // dijit/_WidgetBase
		},

		getIndexInParent: function(){
			// summary:
			//		Returns the index of this widget within its container parent.
			//		It returns -1 if the parent does not exist, or if the parent
			//		is not a dijit/_Container

			var p = this.getParent();
			if(!p || !p.getIndexOfChild){
				return -1; // int
			}
			return p.getIndexOfChild(this); // int
		}
	});
});

},
'dijit/layout/_LayoutWidget':function(){
define([
	"dojo/_base/lang", // lang.mixin
	"../_Widget",
	"../_Container",
	"../_Contained",
	"../Viewport",
	"dojo/_base/declare", // declare
	"dojo/dom-class", // domClass.add domClass.remove
	"dojo/dom-geometry", // domGeometry.marginBox
	"dojo/dom-style" // domStyle.getComputedStyle
], function(lang, _Widget, _Container, _Contained, Viewport,
	declare, domClass, domGeometry, domStyle){

	// module:
	//		dijit/layout/_LayoutWidget


	return declare("dijit.layout._LayoutWidget", [_Widget, _Container, _Contained], {
		// summary:
		//		Base class for a _Container widget which is responsible for laying out its children.
		//		Widgets which mixin this code must define layout() to manage placement and sizing of the children.

		// baseClass: [protected extension] String
		//		This class name is applied to the widget's domNode
		//		and also may be used to generate names for sub nodes,
		//		for example dijitTabContainer-content.
		baseClass: "dijitLayoutContainer",

		// isLayoutContainer: [protected] Boolean
		//		Indicates that this widget is going to call resize() on its
		//		children widgets, setting their size, when they become visible.
		isLayoutContainer: true,

		buildRendering: function(){
			this.inherited(arguments);
			domClass.add(this.domNode, "dijitContainer");
		},

		startup: function(){
			// summary:
			//		Called after all the widgets have been instantiated and their
			//		dom nodes have been inserted somewhere under <body>.
			//
			//		Widgets should override this method to do any initialization
			//		dependent on other widgets existing, and then call
			//		this superclass method to finish things off.
			//
			//		startup() in subclasses shouldn't do anything
			//		size related because the size of the widget hasn't been set yet.

			if(this._started){ return; }

			// Need to call inherited first - so that child widgets get started
			// up correctly
			this.inherited(arguments);

			// If I am a not being controlled by a parent layout widget...
			var parent = this.getParent && this.getParent();
			if(!(parent && parent.isLayoutContainer)){
				// Do recursive sizing and layout of all my descendants
				// (passing in no argument to resize means that it has to glean the size itself)
				this.resize();

				// Since my parent isn't a layout container, and my style *may be* width=height=100%
				// or something similar (either set directly or via a CSS class),
				// monitor when viewport size changes so that I can re-layout.
				this.own(Viewport.on("resize", lang.hitch(this, "resize")));
			}
		},

		resize: function(changeSize, resultSize){
			// summary:
			//		Call this to resize a widget, or after its size has changed.
			// description:
			//		####Change size mode:
			//
			//		When changeSize is specified, changes the marginBox of this widget
			//		and forces it to re-layout its contents accordingly.
			//		changeSize may specify height, width, or both.
			//
			//		If resultSize is specified it indicates the size the widget will
			//		become after changeSize has been applied.
			//
			//		####Notification mode:
			//
			//		When changeSize is null, indicates that the caller has already changed
			//		the size of the widget, or perhaps it changed because the browser
			//		window was resized.  Tells widget to re-layout its contents accordingly.
			//
			//		If resultSize is also specified it indicates the size the widget has
			//		become.
			//
			//		In either mode, this method also:
			//
			//		1. Sets this._borderBox and this._contentBox to the new size of
			//			the widget.  Queries the current domNode size if necessary.
			//		2. Calls layout() to resize contents (and maybe adjust child widgets).
			// changeSize: Object?
			//		Sets the widget to this margin-box size and position.
			//		May include any/all of the following properties:
			//	|	{w: int, h: int, l: int, t: int}
			// resultSize: Object?
			//		The margin-box size of this widget after applying changeSize (if
			//		changeSize is specified).  If caller knows this size and
			//		passes it in, we don't need to query the browser to get the size.
			//	|	{w: int, h: int}

			var node = this.domNode;

			// set margin box size, unless it wasn't specified, in which case use current size
			if(changeSize){
				domGeometry.setMarginBox(node, changeSize);
			}

			// If either height or width wasn't specified by the user, then query node for it.
			// But note that setting the margin box and then immediately querying dimensions may return
			// inaccurate results, so try not to depend on it.
			var mb = resultSize || {};
			lang.mixin(mb, changeSize || {});	// changeSize overrides resultSize
			if( !("h" in mb) || !("w" in mb) ){
				mb = lang.mixin(domGeometry.getMarginBox(node), mb);	// just use domGeometry.marginBox() to fill in missing values
			}

			// Compute and save the size of my border box and content box
			// (w/out calling domGeometry.getContentBox() since that may fail if size was recently set)
			var cs = domStyle.getComputedStyle(node);
			var me = domGeometry.getMarginExtents(node, cs);
			var be = domGeometry.getBorderExtents(node, cs);
			var bb = (this._borderBox = {
				w: mb.w - (me.w + be.w),
				h: mb.h - (me.h + be.h)
			});
			var pe = domGeometry.getPadExtents(node, cs);
			this._contentBox = {
				l: domStyle.toPixelValue(node, cs.paddingLeft),
				t: domStyle.toPixelValue(node, cs.paddingTop),
				w: bb.w - pe.w,
				h: bb.h - pe.h
			};

			// Callback for widget to adjust size of its children
			this.layout();
		},

		layout: function(){
			// summary:
			//		Widgets override this method to size and position their contents/children.
			//		When this is called this._contentBox is guaranteed to be set (see resize()).
			//
			//		This is called after startup(), and also when the widget's size has been
			//		changed.
			// tags:
			//		protected extension
		},

		_setupChild: function(/*dijit/_WidgetBase*/child){
			// summary:
			//		Common setup for initial children and children which are added after startup
			// tags:
			//		protected extension

			var cls = this.baseClass + "-child "
				+ (child.baseClass ? this.baseClass + "-" + child.baseClass : "");
			domClass.add(child.domNode, cls);
		},

		addChild: function(/*dijit/_WidgetBase*/ child, /*Integer?*/ insertIndex){
			// Overrides _Container.addChild() to call _setupChild()
			this.inherited(arguments);
			if(this._started){
				this._setupChild(child);
			}
		},

		removeChild: function(/*dijit/_WidgetBase*/ child){
			// Overrides _Container.removeChild() to remove class added by _setupChild()
			var cls = this.baseClass + "-child"
					+ (child.baseClass ?
						" " + this.baseClass + "-" + child.baseClass : "");
			domClass.remove(child.domNode, cls);

			this.inherited(arguments);
		}
	});
});

},
'moment/moment':function(){
// moment.js
// version : 1.7.2
// author : Tim Wood
// license : MIT
// momentjs.com

define([], function(){

    /************************************
        Constants
    ************************************/

    var moment,
        VERSION = "1.7.2",
        round = Math.round, i,
        // internal storage for language config files
        languages = {},
        currentLanguage = 'en',

        // check for nodeJS
        hasModule = (typeof module !== 'undefined' && module.exports),

        // Parameters to check for on the lang config.  This list of properties
        // will be inherited from English if not provided in a language
        // definition.  monthsParse is also a lang config property, but it
        // cannot be inherited and as such cannot be enumerated here.
        langConfigProperties = 'months|monthsShort|weekdays|weekdaysShort|weekdaysMin|longDateFormat|calendar|relativeTime|ordinal|meridiem'.split('|'),

        // ASP.NET json date format regex
        aspNetJsonRegex = /^\/?Date\((\-?\d+)/i,

        // format tokens
        formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|YYYY|YY|a|A|hh?|HH?|mm?|ss?|SS?S?|zz?|ZZ?|.)/g,
        localFormattingTokens = /(\[[^\[]*\])|(\\)?(LT|LL?L?L?)/g,

        // parsing tokens
        parseMultipleFormatChunker = /([0-9a-zA-Z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)/gi,

        // parsing token regexes
        parseTokenOneOrTwoDigits = /\d\d?/, // 0 - 99
        parseTokenOneToThreeDigits = /\d{1,3}/, // 0 - 999
        parseTokenThreeDigits = /\d{3}/, // 000 - 999
        parseTokenFourDigits = /\d{1,4}/, // 0 - 9999
        parseTokenWord = /[0-9a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+/i, // any word characters or numbers
        parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/i, // +00:00 -00:00 +0000 -0000 or Z
        parseTokenT = /T/i, // T (ISO seperator)

        // preliminary iso regex
        // 0000-00-00 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000
        isoRegex = /^\s*\d{4}-\d\d-\d\d(T(\d\d(:\d\d(:\d\d(\.\d\d?\d?)?)?)?)?([\+\-]\d\d:?\d\d)?)?/,
        isoFormat = 'YYYY-MM-DDTHH:mm:ssZ',

        // iso time formats and regexes
        isoTimes = [
            ['HH:mm:ss.S', /T\d\d:\d\d:\d\d\.\d{1,3}/],
            ['HH:mm:ss', /T\d\d:\d\d:\d\d/],
            ['HH:mm', /T\d\d:\d\d/],
            ['HH', /T\d\d/]
        ],

        // timezone chunker "+10:00" > ["10", "00"] or "-1530" > ["-15", "30"]
        parseTimezoneChunker = /([\+\-]|\d\d)/gi,

        // getter and setter names
        proxyGettersAndSetters = 'Month|Date|Hours|Minutes|Seconds|Milliseconds'.split('|'),
        unitMillisecondFactors = {
            'Milliseconds' : 1,
            'Seconds' : 1e3,
            'Minutes' : 6e4,
            'Hours' : 36e5,
            'Days' : 864e5,
            'Months' : 2592e6,
            'Years' : 31536e6
        },

        // format function strings
        formatFunctions = {},

        // tokens to ordinalize and pad
        ordinalizeTokens = 'DDD w M D d'.split(' '),
        paddedTokens = 'M D H h m s w'.split(' '),

        /*
         * moment.fn.format uses new Function() to create an inlined formatting function.
         * Results are a 3x speed boost
         * http://jsperf.com/momentjs-cached-format-functions
         *
         * These strings are appended into a function using replaceFormatTokens and makeFormatFunction
         */
        formatTokenFunctions = {
            // a = placeholder
            // b = placeholder
            // t = the current moment being formatted
            // v = getValueAtKey function
            // o = language.ordinal function
            // p = leftZeroFill function
            // m = language.meridiem value or function
            M    : function () {
                return this.month() + 1;
            },
            MMM  : function (format) {
                return getValueFromArray("monthsShort", this.month(), this, format);
            },
            MMMM : function (format) {
                return getValueFromArray("months", this.month(), this, format);
            },
            D    : function () {
                return this.date();
            },
            DDD  : function () {
                var a = new Date(this.year(), this.month(), this.date()),
                    b = new Date(this.year(), 0, 1);
                return ~~(((a - b) / 864e5) + 1.5);
            },
            d    : function () {
                return this.day();
            },
            dd   : function (format) {
                return getValueFromArray("weekdaysMin", this.day(), this, format);
            },
            ddd  : function (format) {
                return getValueFromArray("weekdaysShort", this.day(), this, format);
            },
            dddd : function (format) {
                return getValueFromArray("weekdays", this.day(), this, format);
            },
            w    : function () {
                var a = new Date(this.year(), this.month(), this.date() - this.day() + 5),
                    b = new Date(a.getFullYear(), 0, 4);
                return ~~((a - b) / 864e5 / 7 + 1.5);
            },
            YY   : function () {
                return leftZeroFill(this.year() % 100, 2);
            },
            YYYY : function () {
                return leftZeroFill(this.year(), 4);
            },
            a    : function () {
                return this.lang().meridiem(this.hours(), this.minutes(), true);
            },
            A    : function () {
                return this.lang().meridiem(this.hours(), this.minutes(), false);
            },
            H    : function () {
                return this.hours();
            },
            h    : function () {
                return this.hours() % 12 || 12;
            },
            m    : function () {
                return this.minutes();
            },
            s    : function () {
                return this.seconds();
            },
            S    : function () {
                return ~~(this.milliseconds() / 100);
            },
            SS   : function () {
                return leftZeroFill(~~(this.milliseconds() / 10), 2);
            },
            SSS  : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            Z    : function () {
                var a = -this.zone(),
                    b = "+";
                if (a < 0) {
                    a = -a;
                    b = "-";
                }
                return b + leftZeroFill(~~(a / 60), 2) + ":" + leftZeroFill(~~a % 60, 2);
            },
            ZZ   : function () {
                var a = -this.zone(),
                    b = "+";
                if (a < 0) {
                    a = -a;
                    b = "-";
                }
                return b + leftZeroFill(~~(10 * a / 6), 4);
            }
        };

    function getValueFromArray(key, index, m, format) {
        var lang = m.lang();
        return lang[key].call ? lang[key](m, format) : lang[key][index];
    }

    function padToken(func, count) {
        return function (a) {
            return leftZeroFill(func.call(this, a), count);
        };
    }
    function ordinalizeToken(func) {
        return function (a) {
            var b = func.call(this, a);
            return b + this.lang().ordinal(b);
        };
    }

    while (ordinalizeTokens.length) {
        i = ordinalizeTokens.pop();
        formatTokenFunctions[i + 'o'] = ordinalizeToken(formatTokenFunctions[i]);
    }
    while (paddedTokens.length) {
        i = paddedTokens.pop();
        formatTokenFunctions[i + i] = padToken(formatTokenFunctions[i], 2);
    }
    formatTokenFunctions.DDDD = padToken(formatTokenFunctions.DDD, 3);


    /************************************
        Constructors
    ************************************/


    // Moment prototype object
    function Moment(date, isUTC, lang) {
        this._d = date;
        this._isUTC = !!isUTC;
        this._a = date._a || null;
        this._lang = lang || false;
    }

    // Duration Constructor
    function Duration(duration) {
        var data = this._data = {},
            years = duration.years || duration.y || 0,
            months = duration.months || duration.M || 0,
            weeks = duration.weeks || duration.w || 0,
            days = duration.days || duration.d || 0,
            hours = duration.hours || duration.h || 0,
            minutes = duration.minutes || duration.m || 0,
            seconds = duration.seconds || duration.s || 0,
            milliseconds = duration.milliseconds || duration.ms || 0;

        // representation for dateAddRemove
        this._milliseconds = milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 36e5; // 1000 * 60 * 60
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = days +
            weeks * 7;
        // It is impossible translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = months +
            years * 12;

        // The following code bubbles up values, see the tests for
        // examples of what that means.
        data.milliseconds = milliseconds % 1000;
        seconds += absRound(milliseconds / 1000);

        data.seconds = seconds % 60;
        minutes += absRound(seconds / 60);

        data.minutes = minutes % 60;
        hours += absRound(minutes / 60);

        data.hours = hours % 24;
        days += absRound(hours / 24);

        days += weeks * 7;
        data.days = days % 30;

        months += absRound(days / 30);

        data.months = months % 12;
        years += absRound(months / 12);

        data.years = years;

        this._lang = false;
    }


    /************************************
        Helpers
    ************************************/


    function absRound(number) {
        if (number < 0) {
            return Math.ceil(number);
        } else {
            return Math.floor(number);
        }
    }

    // left zero fill a number
    // see http://jsperf.com/left-zero-filling for performance comparison
    function leftZeroFill(number, targetLength) {
        var output = number + '';
        while (output.length < targetLength) {
            output = '0' + output;
        }
        return output;
    }

    // helper function for _.addTime and _.subtractTime
    function addOrSubtractDurationFromMoment(mom, duration, isAdding) {
        var ms = duration._milliseconds,
            d = duration._days,
            M = duration._months,
            currentDate;

        if (ms) {
            mom._d.setTime(+mom + ms * isAdding);
        }
        if (d) {
            mom.date(mom.date() + d * isAdding);
        }
        if (M) {
            currentDate = mom.date();
            mom.date(1)
                .month(mom.month() + M * isAdding)
                .date(Math.min(currentDate, mom.daysInMonth()));
        }
    }

    // check if is an array
    function isArray(input) {
        return Object.prototype.toString.call(input) === '[object Array]';
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if (~~array1[i] !== ~~array2[i]) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function dateFromArray(input, asUTC, hoursOffset, minutesOffset) {
        var i, date, forValid = [];
        for (i = 0; i < 7; i++) {
            forValid[i] = input[i] = (input[i] == null) ? (i === 2 ? 1 : 0) : input[i];
        }
        // we store whether we used utc or not in the input array
        input[7] = forValid[7] = asUTC;
        // if the parser flagged the input as invalid, we pass the value along
        if (input[8] != null) {
            forValid[8] = input[8];
        }
        // add the offsets to the time to be parsed so that we can have a clean array
        // for checking isValid
        input[3] += hoursOffset || 0;
        input[4] += minutesOffset || 0;
        date = new Date(0);
        if (asUTC) {
            date.setUTCFullYear(input[0], input[1], input[2]);
            date.setUTCHours(input[3], input[4], input[5], input[6]);
        } else {
            date.setFullYear(input[0], input[1], input[2]);
            date.setHours(input[3], input[4], input[5], input[6]);
        }
        date._a = forValid;
        return date;
    }

    // Loads a language definition into the `languages` cache.  The function
    // takes a key and optionally values.  If not in the browser and no values
    // are provided, it will load the language file module.  As a convenience,
    // this function also returns the language values.
    function loadLang(key, values) {
        var i, m,
            parse = [];

        if (!values && hasModule) {
            values = require('./lang/' + key);
        }

        for (i = 0; i < langConfigProperties.length; i++) {
            // If a language definition does not provide a value, inherit
            // from English
            values[langConfigProperties[i]] = values[langConfigProperties[i]] ||
              languages.en[langConfigProperties[i]];
        }

        for (i = 0; i < 12; i++) {
            m = moment([2000, i]);
            parse[i] = new RegExp('^' + (values.months[i] || values.months(m, '')) +
                '|^' + (values.monthsShort[i] || values.monthsShort(m, '')).replace('.', ''), 'i');
        }
        values.monthsParse = values.monthsParse || parse;

        languages[key] = values;

        return values;
    }

    // Determines which language definition to use and returns it.
    //
    // With no parameters, it will return the global language.  If you
    // pass in a language key, such as 'en', it will return the
    // definition for 'en', so long as 'en' has already been loaded using
    // moment.lang.  If you pass in a moment or duration instance, it
    // will decide the language based on that, or default to the global
    // language.
    function getLangDefinition(m) {
        var langKey = (typeof m === 'string') && m ||
                      m && m._lang ||
                      null;

        return langKey ? (languages[langKey] || loadLang(langKey)) : moment;
    }


    /************************************
        Formatting
    ************************************/


    function removeFormattingTokens(input) {
        if (input.match(/\[.*\]/)) {
            return input.replace(/^\[|\]$/g, "");
        }
        return input.replace(/\\/g, "");
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = "";
            for (i = 0; i < length; i++) {
                output += typeof array[i].call === 'function' ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return m.lang().longDateFormat[input] || input;
        }

        while (i-- && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
        }

        if (!formatFunctions[format]) {
            formatFunctions[format] = makeFormatFunction(format);
        }

        return formatFunctions[format](m);
    }


    /************************************
        Parsing
    ************************************/


    // get the regex to find the next token
    function getParseRegexForToken(token) {
        switch (token) {
        case 'DDDD':
            return parseTokenThreeDigits;
        case 'YYYY':
            return parseTokenFourDigits;
        case 'S':
        case 'SS':
        case 'SSS':
        case 'DDD':
            return parseTokenOneToThreeDigits;
        case 'MMM':
        case 'MMMM':
        case 'dd':
        case 'ddd':
        case 'dddd':
        case 'a':
        case 'A':
            return parseTokenWord;
        case 'Z':
        case 'ZZ':
            return parseTokenTimezone;
        case 'T':
            return parseTokenT;
        case 'MM':
        case 'DD':
        case 'YY':
        case 'HH':
        case 'hh':
        case 'mm':
        case 'ss':
        case 'M':
        case 'D':
        case 'd':
        case 'H':
        case 'h':
        case 'm':
        case 's':
            return parseTokenOneOrTwoDigits;
        default :
            return new RegExp(token.replace('\\', ''));
        }
    }

    // function to convert string input to date
    function addTimeToArrayFromToken(token, input, datePartArray, config) {
        var a, b;

        switch (token) {
        // MONTH
        case 'M' : // fall through to MM
        case 'MM' :
            datePartArray[1] = (input == null) ? 0 : ~~input - 1;
            break;
        case 'MMM' : // fall through to MMMM
        case 'MMMM' :
            for (a = 0; a < 12; a++) {
                if (getLangDefinition().monthsParse[a].test(input)) {
                    datePartArray[1] = a;
                    b = true;
                    break;
                }
            }
            // if we didn't find a month name, mark the date as invalid.
            if (!b) {
                datePartArray[8] = false;
            }
            break;
        // DAY OF MONTH
        case 'D' : // fall through to DDDD
        case 'DD' : // fall through to DDDD
        case 'DDD' : // fall through to DDDD
        case 'DDDD' :
            if (input != null) {
                datePartArray[2] = ~~input;
            }
            break;
        // YEAR
        case 'YY' :
            datePartArray[0] = ~~input + (~~input > 70 ? 1900 : 2000);
            break;
        case 'YYYY' :
            datePartArray[0] = ~~Math.abs(input);
            break;
        // AM / PM
        case 'a' : // fall through to A
        case 'A' :
            config.isPm = ((input + '').toLowerCase() === 'pm');
            break;
        // 24 HOUR
        case 'H' : // fall through to hh
        case 'HH' : // fall through to hh
        case 'h' : // fall through to hh
        case 'hh' :
            datePartArray[3] = ~~input;
            break;
        // MINUTE
        case 'm' : // fall through to mm
        case 'mm' :
            datePartArray[4] = ~~input;
            break;
        // SECOND
        case 's' : // fall through to ss
        case 'ss' :
            datePartArray[5] = ~~input;
            break;
        // MILLISECOND
        case 'S' :
        case 'SS' :
        case 'SSS' :
            datePartArray[6] = ~~ (('0.' + input) * 1000);
            break;
        // TIMEZONE
        case 'Z' : // fall through to ZZ
        case 'ZZ' :
            config.isUTC = true;
            a = (input + '').match(parseTimezoneChunker);
            if (a && a[1]) {
                config.tzh = ~~a[1];
            }
            if (a && a[2]) {
                config.tzm = ~~a[2];
            }
            // reverse offsets
            if (a && a[0] === '+') {
                config.tzh = -config.tzh;
                config.tzm = -config.tzm;
            }
            break;
        }

        // if the input is null, the date is not valid
        if (input == null) {
            datePartArray[8] = false;
        }
    }

    // date from string and format string
    function makeDateFromStringAndFormat(string, format) {
        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        // We store some additional data on the array for validation
        // datePartArray[7] is true if the Date was created with `Date.UTC` and false if created with `new Date`
        // datePartArray[8] is false if the Date is invalid, and undefined if the validity is unknown.
        var datePartArray = [0, 0, 1, 0, 0, 0, 0],
            config = {
                tzh : 0, // timezone hour offset
                tzm : 0  // timezone minute offset
            },
            tokens = format.match(formattingTokens),
            i, parsedInput;

        for (i = 0; i < tokens.length; i++) {
            parsedInput = (getParseRegexForToken(tokens[i]).exec(string) || [])[0];
            if (parsedInput) {
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
            }
            // don't parse if its not a known token
            if (formatTokenFunctions[tokens[i]]) {
                addTimeToArrayFromToken(tokens[i], parsedInput, datePartArray, config);
            }
        }
        // handle am pm
        if (config.isPm && datePartArray[3] < 12) {
            datePartArray[3] += 12;
        }
        // if is 12 am, change hours to 0
        if (config.isPm === false && datePartArray[3] === 12) {
            datePartArray[3] = 0;
        }
        // return
        return dateFromArray(datePartArray, config.isUTC, config.tzh, config.tzm);
    }

    // date from string and array of format strings
    function makeDateFromStringAndArray(string, formats) {
        var output,
            inputParts = string.match(parseMultipleFormatChunker) || [],
            formattedInputParts,
            scoreToBeat = 99,
            i,
            currentDate,
            currentScore;
        for (i = 0; i < formats.length; i++) {
            currentDate = makeDateFromStringAndFormat(string, formats[i]);
            formattedInputParts = formatMoment(new Moment(currentDate), formats[i]).match(parseMultipleFormatChunker) || [];
            currentScore = compareArrays(inputParts, formattedInputParts);
            if (currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                output = currentDate;
            }
        }
        return output;
    }

    // date from iso format
    function makeDateFromString(string) {
        var format = 'YYYY-MM-DDT',
            i;
        if (isoRegex.exec(string)) {
            for (i = 0; i < 4; i++) {
                if (isoTimes[i][1].exec(string)) {
                    format += isoTimes[i][0];
                    break;
                }
            }
            return parseTokenTimezone.exec(string) ?
                makeDateFromStringAndFormat(string, format + ' Z') :
                makeDateFromStringAndFormat(string, format);
        }
        return new Date(string);
    }


    /************************************
        Relative Time
    ************************************/


    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, lang) {
        var rt = lang.relativeTime[string];
        return (typeof rt === 'function') ?
            rt(number || 1, !!withoutSuffix, string, isFuture) :
            rt.replace(/%d/i, number || 1);
    }

    function relativeTime(milliseconds, withoutSuffix, lang) {
        var seconds = round(Math.abs(milliseconds) / 1000),
            minutes = round(seconds / 60),
            hours = round(minutes / 60),
            days = round(hours / 24),
            years = round(days / 365),
            args = seconds < 45 && ['s', seconds] ||
                minutes === 1 && ['m'] ||
                minutes < 45 && ['mm', minutes] ||
                hours === 1 && ['h'] ||
                hours < 22 && ['hh', hours] ||
                days === 1 && ['d'] ||
                days <= 25 && ['dd', days] ||
                days <= 45 && ['M'] ||
                days < 345 && ['MM', round(days / 30)] ||
                years === 1 && ['y'] || ['yy', years];
        args[2] = withoutSuffix;
        args[3] = milliseconds > 0;
        args[4] = lang;
        return substituteTimeAgo.apply({}, args);
    }


    /************************************
        Top Level Functions
    ************************************/


    moment = function (input, format) {
        if (input === null || input === '') {
            return null;
        }
        var date,
            matched;
        // parse Moment object
        if (moment.isMoment(input)) {
            return new Moment(new Date(+input._d), input._isUTC, input._lang);
        // parse string and format
        } else if (format) {
            if (isArray(format)) {
                date = makeDateFromStringAndArray(input, format);
            } else {
                date = makeDateFromStringAndFormat(input, format);
            }
        // evaluate it as a JSON-encoded date
        } else {
            matched = aspNetJsonRegex.exec(input);
            date = input === undefined ? new Date() :
                matched ? new Date(+matched[1]) :
                input instanceof Date ? input :
                isArray(input) ? dateFromArray(input) :
                typeof input === 'string' ? makeDateFromString(input) :
                new Date(input);
        }

        return new Moment(date);
    };

    // creating with utc
    moment.utc = function (input, format) {
        if (isArray(input)) {
            return new Moment(dateFromArray(input, true), true);
        }
        // if we don't have a timezone, we need to add one to trigger parsing into utc
        if (typeof input === 'string' && !parseTokenTimezone.exec(input)) {
            input += ' +0000';
            if (format) {
                format += ' Z';
            }
        }
        return moment(input, format).utc();
    };

    // creating with unix timestamp (in seconds)
    moment.unix = function (input) {
        return moment(input * 1000);
    };

    // duration
    moment.duration = function (input, key) {
        var isDuration = moment.isDuration(input),
            isNumber = (typeof input === 'number'),
            duration = (isDuration ? input._data : (isNumber ? {} : input)),
            ret;

        if (isNumber) {
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        }

        ret = new Duration(duration);

        if (isDuration) {
            ret._lang = input._lang;
        }

        return ret;
    };

    // humanizeDuration
    // This method is deprecated in favor of the new Duration object.  Please
    // see the moment.duration method.
    moment.humanizeDuration = function (num, type, withSuffix) {
        return moment.duration(num, type === true ? null : type).humanize(type === true ? true : withSuffix);
    };

    // version number
    moment.version = VERSION;

    // default format
    moment.defaultFormat = isoFormat;

    // This function will load languages and then set the global language.  If
    // no arguments are passed in, it will simply return the current global
    // language key.
    moment.lang = function (key, values) {
        var i;

        if (!key) {
            return currentLanguage;
        }
        if (values || !languages[key]) {
            loadLang(key, values);
        }
        if (languages[key]) {
            // deprecated, to get the language definition variables, use the
            // moment.fn.lang method or the getLangDefinition function.
            for (i = 0; i < langConfigProperties.length; i++) {
                moment[langConfigProperties[i]] = languages[key][langConfigProperties[i]];
            }
            moment.monthsParse = languages[key].monthsParse;
            currentLanguage = key;
        }
    };

    // returns language data
    moment.langData = getLangDefinition;

    // compare moment object
    moment.isMoment = function (obj) {
        return obj instanceof Moment;
    };

    // for typechecking Duration objects
    moment.isDuration = function (obj) {
        return obj instanceof Duration;
    };

    // Set default language, other languages will inherit from English.
    moment.lang('en', {
        months : "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
        monthsShort : "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
        weekdays : "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
        weekdaysShort : "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
        weekdaysMin : "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
        longDateFormat : {
            LT : "h:mm A",
            L : "MM/DD/YYYY",
            LL : "MMMM D YYYY",
            LLL : "MMMM D YYYY LT",
            LLLL : "dddd, MMMM D YYYY LT"
        },
        meridiem : function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'pm' : 'PM';
            } else {
                return isLower ? 'am' : 'AM';
            }
        },
        calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[last] dddd [at] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : "in %s",
            past : "%s ago",
            s : "a few seconds",
            m : "a minute",
            mm : "%d minutes",
            h : "an hour",
            hh : "%d hours",
            d : "a day",
            dd : "%d days",
            M : "a month",
            MM : "%d months",
            y : "a year",
            yy : "%d years"
        },
        ordinal : function (number) {
            var b = number % 10;
            return (~~ (number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
        }
    });


    /************************************
        Moment Prototype
    ************************************/


    moment.fn = Moment.prototype = {

        clone : function () {
            return moment(this);
        },

        valueOf : function () {
            return +this._d;
        },

        unix : function () {
            return Math.floor(+this._d / 1000);
        },

        toString : function () {
            return this._d.toString();
        },

        toDate : function () {
            return this._d;
        },

        toArray : function () {
            var m = this;
            return [
                m.year(),
                m.month(),
                m.date(),
                m.hours(),
                m.minutes(),
                m.seconds(),
                m.milliseconds(),
                !!this._isUTC
            ];
        },

        isValid : function () {
            if (this._a) {
                // if the parser finds that the input is invalid, it sets
                // the eighth item in the input array to false.
                if (this._a[8] != null) {
                    return !!this._a[8];
                }
                return !compareArrays(this._a, (this._a[7] ? moment.utc(this._a) : moment(this._a)).toArray());
            }
            return !isNaN(this._d.getTime());
        },

        utc : function () {
            this._isUTC = true;
            return this;
        },

        local : function () {
            this._isUTC = false;
            return this;
        },

        format : function (inputString) {
            return formatMoment(this, inputString ? inputString : moment.defaultFormat);
        },

        add : function (input, val) {
            var dur = val ? moment.duration(+val, input) : moment.duration(input);
            addOrSubtractDurationFromMoment(this, dur, 1);
            return this;
        },

        subtract : function (input, val) {
            var dur = val ? moment.duration(+val, input) : moment.duration(input);
            addOrSubtractDurationFromMoment(this, dur, -1);
            return this;
        },

        diff : function (input, val, asFloat) {
            var inputMoment = this._isUTC ? moment(input).utc() : moment(input).local(),
                zoneDiff = (this.zone() - inputMoment.zone()) * 6e4,
                diff = this._d - inputMoment._d - zoneDiff,
                year = this.year() - inputMoment.year(),
                month = this.month() - inputMoment.month(),
                date = this.date() - inputMoment.date(),
                output;
            if (val === 'months') {
                output = year * 12 + month + date / 30;
            } else if (val === 'years') {
                output = year + (month + date / 30) / 12;
            } else {
                output = val === 'seconds' ? diff / 1e3 : // 1000
                    val === 'minutes' ? diff / 6e4 : // 1000 * 60
                    val === 'hours' ? diff / 36e5 : // 1000 * 60 * 60
                    val === 'days' ? diff / 864e5 : // 1000 * 60 * 60 * 24
                    val === 'weeks' ? diff / 6048e5 : // 1000 * 60 * 60 * 24 * 7
                    diff;
            }
            return asFloat ? output : round(output);
        },

        from : function (time, withoutSuffix) {
            return moment.duration(this.diff(time)).lang(this._lang).humanize(!withoutSuffix);
        },

        fromNow : function (withoutSuffix) {
            return this.from(moment(), withoutSuffix);
        },

        calendar : function () {
            var diff = this.diff(moment().sod(), 'days', true),
                calendar = this.lang().calendar,
                allElse = calendar.sameElse,
                format = diff < -6 ? allElse :
                diff < -1 ? calendar.lastWeek :
                diff < 0 ? calendar.lastDay :
                diff < 1 ? calendar.sameDay :
                diff < 2 ? calendar.nextDay :
                diff < 7 ? calendar.nextWeek : allElse;
            return this.format(typeof format === 'function' ? format.apply(this) : format);
        },

        isLeapYear : function () {
            var year = this.year();
            return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        },

        isDST : function () {
            return (this.zone() < moment([this.year()]).zone() ||
                this.zone() < moment([this.year(), 5]).zone());
        },

        day : function (input) {
            var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
            return input == null ? day :
                this.add({ d : input - day });
        },

        startOf: function (val) {
            // the following switch intentionally omits break keywords
            // to utilize falling through the cases.
            switch (val.replace(/s$/, '')) {
            case 'year':
                this.month(0);
                /* falls through */
            case 'month':
                this.date(1);
                /* falls through */
            case 'day':
                this.hours(0);
                /* falls through */
            case 'hour':
                this.minutes(0);
                /* falls through */
            case 'minute':
                this.seconds(0);
                /* falls through */
            case 'second':
                this.milliseconds(0);
                /* falls through */
            }
            return this;
        },

        endOf: function (val) {
            return this.startOf(val).add(val.replace(/s?$/, 's'), 1).subtract('ms', 1);
        },

        sod: function () {
            return this.clone().startOf('day');
        },

        eod: function () {
            // end of day = start of day plus 1 day, minus 1 millisecond
            return this.clone().endOf('day');
        },

        zone : function () {
            return this._isUTC ? 0 : this._d.getTimezoneOffset();
        },

        daysInMonth : function () {
            return moment.utc([this.year(), this.month() + 1, 0]).date();
        },

        // If passed a language key, it will set the language for this
        // instance.  Otherwise, it will return the language configuration
        // variables for this instance.
        lang : function (lang) {
            if (lang === undefined) {
                return getLangDefinition(this);
            } else {
                this._lang = lang;
                return this;
            }
        }
    };

    // helper for adding shortcuts
    function makeGetterAndSetter(name, key) {
        moment.fn[name] = function (input) {
            var utc = this._isUTC ? 'UTC' : '';
            if (input != null) {
                this._d['set' + utc + key](input);
                return this;
            } else {
                return this._d['get' + utc + key]();
            }
        };
    }

    // loop through and add shortcuts (Month, Date, Hours, Minutes, Seconds, Milliseconds)
    for (i = 0; i < proxyGettersAndSetters.length; i ++) {
        makeGetterAndSetter(proxyGettersAndSetters[i].toLowerCase(), proxyGettersAndSetters[i]);
    }

    // add shortcut for year (uses different syntax than the getter/setter 'year' == 'FullYear')
    makeGetterAndSetter('year', 'FullYear');


    /************************************
        Duration Prototype
    ************************************/


    moment.duration.fn = Duration.prototype = {
        weeks : function () {
            return absRound(this.days() / 7);
        },

        valueOf : function () {
            return this._milliseconds +
              this._days * 864e5 +
              this._months * 2592e6;
        },

        humanize : function (withSuffix) {
            var difference = +this,
                rel = this.lang().relativeTime,
                output = relativeTime(difference, !withSuffix, this.lang()),
                fromNow = difference <= 0 ? rel.past : rel.future;

            if (withSuffix) {
                if (typeof fromNow === 'function') {
                    output = fromNow(output);
                } else {
                    output = fromNow.replace(/%s/i, output);
                }
            }

            return output;
        },

        lang : moment.fn.lang
    };

    function makeDurationGetter(name) {
        moment.duration.fn[name] = function () {
            return this._data[name];
        };
    }

    function makeDurationAsGetter(name, factor) {
        moment.duration.fn['as' + name] = function () {
            return +this / factor;
        };
    }

    for (i in unitMillisecondFactors) {
        if (unitMillisecondFactors.hasOwnProperty(i)) {
            makeDurationAsGetter(i, unitMillisecondFactors[i]);
            makeDurationGetter(i.toLowerCase());
        }
    }

    makeDurationAsGetter('Weeks', 6048e5);


    /************************************
        Exposing Moment
    ************************************/

    return moment;
});
},
'url:dote-client/resources/_Event.html':"<div class=\"${baseClass}\" data-dojo-attach-event=\"ondijitclick:_onClick\">\n\t<div class=\"${baseClass}Inner\" data-dojo-attach-point=\"innerNode\">\n\t\t<div class=\"${baseClass}Time\" data-dojo-attach-point=\"timeNode\"></div>\n\t\t<div class=\"${baseClass}Type\" data-dojo-attach-point=\"typeNode\"></div>\n\t\t<div class=\"${baseClass}Description\" data-dojo-attach-point=\"descriptionNode\"></div>\n\t</div>\n</div>",
'url:dote-client/resources/Timeline.html':"<div class=\"${baseClass}\" role=\"presentation\" data-dojo-attach-point=\"wrapperNode\">\n\t<div class=\"${baseClass}Container\" data-dojo-attach-point=\"containerNode\"></div>\n\t<div class=\"${baseClass}More ${baseClass}Hide\" data-dojo-attach-point=\"moreNode\">\n\t\t<button type=\"button\" class=\"${baseClass}MoreButton\" data-dojo-attach-event=\"ondijitclick:_onMoreClick\" data-dojo-attach-point=\"moreButtonNode\">${moreLabel}</button>\n\t</div>\n</div>"}});
define("dote-client/viewTimeline", [
	'./Timeline',
	'./userControls',
	'dojo/_base/array',
	'dojo/store/JsonRest',
	'dojo/domReady!'
], function (Timeline, userControls, array, JsonRest) {

	userControls.start();

	var events = new JsonRest({
		target: '/events' 
	});

	var widgets = [];

	var timeline = new Timeline({
		store: events,
		count: 20,
		maxCount: 40,
		queryOptions: { sort: [ { attribute: 'created', descending: true } ] }
	}, 'timeline');
	widgets.push(timeline);

	array.forEach(widgets, function (widget) {
		widget && widget.startup && widget.startup();
	});

	timeline.fetch();
});