require({cache:{
'dojo/store/Cache':function(){
define(["../_base/lang","../when" /*=====, "../_base/declare", "./api/Store" =====*/],
function(lang, when /*=====, declare, Store =====*/){

// module:
//		dojo/store/Cache

var Cache = function(masterStore, cachingStore, options){
	options = options || {};
	return lang.delegate(masterStore, {
		query: function(query, directives){
			var results = masterStore.query(query, directives);
			results.forEach(function(object){
				if(!options.isLoaded || options.isLoaded(object)){
					cachingStore.put(object);
				}
			});
			return results;
		},
		// look for a queryEngine in either store
		queryEngine: masterStore.queryEngine || cachingStore.queryEngine,
		get: function(id, directives){
			return when(cachingStore.get(id), function(result){
				return result || when(masterStore.get(id, directives), function(result){
					if(result){
						cachingStore.put(result, {id: id});
					}
					return result;
				});
			});
		},
		add: function(object, directives){
			return when(masterStore.add(object, directives), function(result){
				// now put result in cache
				cachingStore.add(object && typeof result == "object" ? result : object, directives);
				return result; // the result from the add should be dictated by the masterStore and be unaffected by the cachingStore
			});
		},
		put: function(object, directives){
			// first remove from the cache, so it is empty until we get a response from the master store
			cachingStore.remove((directives && directives.id) || this.getIdentity(object));
			return when(masterStore.put(object, directives), function(result){
				// now put result in cache
				cachingStore.put(object && typeof result == "object" ? result : object, directives);
				return result; // the result from the put should be dictated by the masterStore and be unaffected by the cachingStore
			});
		},
		remove: function(id, directives){
			return when(masterStore.remove(id, directives), function(result){
				return cachingStore.remove(id, directives);
			});
		},
		evict: function(id){
			return cachingStore.remove(id);
		}
	});
};
lang.setObject("dojo.store.Cache", Cache);

/*=====
var __CacheArgs = {
	// summary:
	//		These are additional options for how caching is handled.
	// isLoaded: Function?
	//		This is a function that will be called for each item in a query response to determine
	//		if it is cacheable. If isLoaded returns true, the item will be cached, otherwise it
	//		will not be cached. If isLoaded is not provided, all items will be cached.
};

Cache = declare(Store, {
	// summary:
	//		The Cache store wrapper takes a master store and a caching store,
	//		caches data from the master into the caching store for faster
	//		lookup. Normally one would use a memory store for the caching
	//		store and a server store like JsonRest for the master store.
	// example:
	//	|	var master = new Memory(data);
	//	|	var cacher = new Memory();
	//	|	var store = new Cache(master, cacher);
	//
	constructor: function(masterStore, cachingStore, options){
		// masterStore:
		//		This is the authoritative store, all uncached requests or non-safe requests will
		//		be made against this store.
		// cachingStore:
		//		This is the caching store that will be used to store responses for quick access.
		//		Typically this should be a local store.
		// options: __CacheArgs?
		//		These are additional options for how caching is handled.
	},
	query: function(query, directives){
		// summary:
		//		Query the underlying master store and cache any results.
		// query: Object|String
		//		The object or string containing query information. Dependent on the query engine used.
		// directives: dojo/store/api/Store.QueryOptions?
		//		An optional keyword arguments object with additional parameters describing the query.
		// returns: dojo/store/api/Store.QueryResults
		//		A QueryResults object that can be used to iterate over.
	},
	get: function(id, directives){
		// summary:
		//		Get the object with the specific id.
		// id: Number
		//		The identifier for the object in question.
		// directives: Object?
		//		Any additional parameters needed to describe how the get should be performed.
		// returns: dojo/store/api/Store.QueryResults
		//		A QueryResults object.
	},
	add: function(object, directives){
		// summary:
		//		Add the given object to the store.
		// object: Object
		//		The object to add to the store.
		// directives: dojo/store/api/Store.AddOptions?
		//		Any additional parameters needed to describe how the add should be performed.
		// returns: Number
		//		The new id for the object.
	},
	put: function(object, directives){
		// summary:
		//		Put the object into the store (similar to an HTTP PUT).
		// object: Object
		//		The object to put to the store.
		// directives: dojo/store/api/Store.PutDirectives?
		//		Any additional parameters needed to describe how the put should be performed.
		// returns: Number
		//		The new id for the object.
	},
	remove: function(id){
		// summary:
		//		Remove the object with the specific id.
		// id: Number
		//		The identifier for the object in question.
	},
	evict: function(id){
		// summary:
		//		Remove the object with the given id from the underlying caching store.
		// id: Number
		//		The identifier for the object in question.
	}
});
=====*/

return Cache;
});

},
'dojo/store/Memory':function(){
define(["../_base/declare", "./util/QueryResults", "./util/SimpleQueryEngine" /*=====, "./api/Store" =====*/],
function(declare, QueryResults, SimpleQueryEngine /*=====, Store =====*/){

// module:
//		dojo/store/Memory

// No base class, but for purposes of documentation, the base class is dojo/store/api/Store
var base = null;
/*===== base = Store; =====*/

return declare("dojo.store.Memory", base, {
	// summary:
	//		This is a basic in-memory object store. It implements dojo/store/api/Store.
	constructor: function(options){
		// summary:
		//		Creates a memory object store.
		// options: dojo/store/Memory
		//		This provides any configuration information that will be mixed into the store.
		//		This should generally include the data property to provide the starting set of data.
		for(var i in options){
			this[i] = options[i];
		}
		this.setData(this.data || []);
	},
	// data: Array
	//		The array of all the objects in the memory store
	data:null,

	// idProperty: String
	//		Indicates the property to use as the identity property. The values of this
	//		property should be unique.
	idProperty: "id",

	// index: Object
	//		An index of data indices into the data array by id
	index:null,

	// queryEngine: Function
	//		Defines the query engine to use for querying the data store
	queryEngine: SimpleQueryEngine,
	get: function(id){
		// summary:
		//		Retrieves an object by its identity
		// id: Number
		//		The identity to use to lookup the object
		// returns: Object
		//		The object in the store that matches the given id.
		return this.data[this.index[id]];
	},
	getIdentity: function(object){
		// summary:
		//		Returns an object's identity
		// object: Object
		//		The object to get the identity from
		// returns: Number
		return object[this.idProperty];
	},
	put: function(object, options){
		// summary:
		//		Stores an object
		// object: Object
		//		The object to store.
		// options: dojo/store/api/Store.PutDirectives?
		//		Additional metadata for storing the data.  Includes an "id"
		//		property if a specific id is to be used.
		// returns: Number
		var data = this.data,
			index = this.index,
			idProperty = this.idProperty;
		var id = object[idProperty] = (options && "id" in options) ? options.id : idProperty in object ? object[idProperty] : Math.random();
		if(id in index){
			// object exists
			if(options && options.overwrite === false){
				throw new Error("Object already exists");
			}
			// replace the entry in data
			data[index[id]] = object;
		}else{
			// add the new object
			index[id] = data.push(object) - 1;
		}
		return id;
	},
	add: function(object, options){
		// summary:
		//		Creates an object, throws an error if the object already exists
		// object: Object
		//		The object to store.
		// options: dojo/store/api/Store.PutDirectives?
		//		Additional metadata for storing the data.  Includes an "id"
		//		property if a specific id is to be used.
		// returns: Number
		(options = options || {}).overwrite = false;
		// call put with overwrite being false
		return this.put(object, options);
	},
	remove: function(id){
		// summary:
		//		Deletes an object by its identity
		// id: Number
		//		The identity to use to delete the object
		// returns: Boolean
		//		Returns true if an object was removed, falsy (undefined) if no object matched the id
		var index = this.index;
		var data = this.data;
		if(id in index){
			data.splice(index[id], 1);
			// now we have to reindex
			this.setData(data);
			return true;
		}
	},
	query: function(query, options){
		// summary:
		//		Queries the store for objects.
		// query: Object
		//		The query to use for retrieving objects from the store.
		// options: dojo/store/api/Store.QueryOptions?
		//		The optional arguments to apply to the resultset.
		// returns: dojo/store/api/Store.QueryResults
		//		The results of the query, extended with iterative methods.
		//
		// example:
		//		Given the following store:
		//
		// 	|	var store = new Memory({
		// 	|		data: [
		// 	|			{id: 1, name: "one", prime: false },
		//	|			{id: 2, name: "two", even: true, prime: true},
		//	|			{id: 3, name: "three", prime: true},
		//	|			{id: 4, name: "four", even: true, prime: false},
		//	|			{id: 5, name: "five", prime: true}
		//	|		]
		//	|	});
		//
		//	...find all items where "prime" is true:
		//
		//	|	var results = store.query({ prime: true });
		//
		//	...or find all items where "even" is true:
		//
		//	|	var results = store.query({ even: true });
		return QueryResults(this.queryEngine(query, options)(this.data));
	},
	setData: function(data){
		// summary:
		//		Sets the given data as the source for this store, and indexes it
		// data: Object[]
		//		An array of objects to use as the source of data.
		if(data.items){
			// just for convenience with the data format IFRS expects
			this.idProperty = data.identifier;
			data = this.data = data.items;
		}else{
			this.data = data;
		}
		this.index = {};
		for(var i = 0, l = data.length; i < l; i++){
			this.index[data[i][this.idProperty]] = i;
		}
	}
});

});

},
'dojo/store/util/SimpleQueryEngine':function(){
define(["../../_base/array" /*=====, "../api/Store" =====*/], function(arrayUtil /*=====, Store =====*/){

// module:
//		dojo/store/util/SimpleQueryEngine

return function(query, options){
	// summary:
	//		Simple query engine that matches using filter functions, named filter
	//		functions or objects by name-value on a query object hash
	//
	// description:
	//		The SimpleQueryEngine provides a way of getting a QueryResults through
	//		the use of a simple object hash as a filter.  The hash will be used to
	//		match properties on data objects with the corresponding value given. In
	//		other words, only exact matches will be returned.
	//
	//		This function can be used as a template for more complex query engines;
	//		for example, an engine can be created that accepts an object hash that
	//		contains filtering functions, or a string that gets evaluated, etc.
	//
	//		When creating a new dojo.store, simply set the store's queryEngine
	//		field as a reference to this function.
	//
	// query: Object
	//		An object hash with fields that may match fields of items in the store.
	//		Values in the hash will be compared by normal == operator, but regular expressions
	//		or any object that provides a test() method are also supported and can be
	//		used to match strings by more complex expressions
	//		(and then the regex's or object's test() method will be used to match values).
	//
	// options: dojo/store/api/Store.QueryOptions?
	//		An object that contains optional information such as sort, start, and count.
	//
	// returns: Function
	//		A function that caches the passed query under the field "matches".  See any
	//		of the "query" methods on dojo.stores.
	//
	// example:
	//		Define a store with a reference to this engine, and set up a query method.
	//
	//	|	var myStore = function(options){
	//	|		//	...more properties here
	//	|		this.queryEngine = SimpleQueryEngine;
	//	|		//	define our query method
	//	|		this.query = function(query, options){
	//	|			return QueryResults(this.queryEngine(query, options)(this.data));
	//	|		};
	//	|	};

	// create our matching query function
	switch(typeof query){
		default:
			throw new Error("Can not query with a " + typeof query);
		case "object": case "undefined":
			var queryObject = query;
			query = function(object){
				for(var key in queryObject){
					var required = queryObject[key];
					if(required && required.test){
						// an object can provide a test method, which makes it work with regex
						if(!required.test(object[key], object)){
							return false;
						}
					}else if(required != object[key]){
						return false;
					}
				}
				return true;
			};
			break;
		case "string":
			// named query
			if(!this[query]){
				throw new Error("No filter function " + query + " was found in store");
			}
			query = this[query];
			// fall through
		case "function":
			// fall through
	}
	function execute(array){
		// execute the whole query, first we filter
		var results = arrayUtil.filter(array, query);
		// next we sort
		var sortSet = options && options.sort;
		if(sortSet){
			results.sort(typeof sortSet == "function" ? sortSet : function(a, b){
				for(var sort, i=0; sort = sortSet[i]; i++){
					var aValue = a[sort.attribute];
					var bValue = b[sort.attribute];
					if (aValue != bValue){
						return !!sort.descending == (aValue == null || aValue > bValue) ? -1 : 1;
					}
				}
				return 0;
			});
		}
		// now we paginate
		if(options && (options.start || options.count)){
			var total = results.length;
			results = results.slice(options.start || 0, (options.start || 0) + (options.count || Infinity));
			results.total = total;
		}
		return results;
	}
	execute.matches = query;
	return execute;
};

});

},
'dojo/store/Observable':function(){
define(["../_base/kernel", "../_base/lang", "../when", "../_base/array" /*=====, "./api/Store" =====*/
], function(kernel, lang, when, array /*=====, Store =====*/){

// module:
//		dojo/store/Observable

var Observable = function(/*Store*/ store){
	// summary:
	//		The Observable store wrapper takes a store and sets an observe method on query()
	//		results that can be used to monitor results for changes.
	//
	// description:
	//		Observable wraps an existing store so that notifications can be made when a query
	//		is performed.
	//
	// example:
	//		Create a Memory store that returns an observable query, and then log some
	//		information about that query.
	//
	//	|	var store = Observable(new Memory({
	//	|		data: [
	//	|			{id: 1, name: "one", prime: false},
	//	|			{id: 2, name: "two", even: true, prime: true},
	//	|			{id: 3, name: "three", prime: true},
	//	|			{id: 4, name: "four", even: true, prime: false},
	//	|			{id: 5, name: "five", prime: true}
	//	|		]
	//	|	}));
	//	|	var changes = [], results = store.query({ prime: true });
	//	|	var observer = results.observe(function(object, previousIndex, newIndex){
	//	|		changes.push({previousIndex:previousIndex, newIndex:newIndex, object:object});
	//	|	});
	//
	//		See the Observable tests for more information.

	var undef, queryUpdaters = [], revision = 0;
	// a Comet driven store could directly call notify to notify observers when data has
	// changed on the backend
	// create a new instance
	store = lang.delegate(store);
	
	store.notify = function(object, existingId){
		revision++;
		var updaters = queryUpdaters.slice();
		for(var i = 0, l = updaters.length; i < l; i++){
			updaters[i](object, existingId);
		}
	};
	var originalQuery = store.query;
	store.query = function(query, options){
		options = options || {};
		var results = originalQuery.apply(this, arguments);
		if(results && results.forEach){
			var nonPagedOptions = lang.mixin({}, options);
			delete nonPagedOptions.start;
			delete nonPagedOptions.count;

			var queryExecutor = store.queryEngine && store.queryEngine(query, nonPagedOptions);
			var queryRevision = revision;
			var listeners = [], queryUpdater;
			results.observe = function(listener, includeObjectUpdates){
				if(listeners.push(listener) == 1){
					// first listener was added, create the query checker and updater
					queryUpdaters.push(queryUpdater = function(changed, existingId){
						when(results, function(resultsArray){
							var atEnd = resultsArray.length != options.count;
							var i, l, listener;
							if(++queryRevision != revision){
								throw new Error("Query is out of date, you must observe() the query prior to any data modifications");
							}
							var removedObject, removedFrom = -1, insertedInto = -1;
							if(existingId !== undef){
								// remove the old one
								for(i = 0, l = resultsArray.length; i < l; i++){
									var object = resultsArray[i];
									if(store.getIdentity(object) == existingId){
										removedObject = object;
										removedFrom = i;
										if(queryExecutor || !changed){// if it was changed and we don't have a queryExecutor, we shouldn't remove it because updated objects would be eliminated
											resultsArray.splice(i, 1);
										}
										break;
									}
								}
							}
							if(queryExecutor){
								// add the new one
								if(changed &&
										// if a matches function exists, use that (probably more efficient)
										(queryExecutor.matches ? queryExecutor.matches(changed) : queryExecutor([changed]).length)){

									var firstInsertedInto = removedFrom > -1 ? 
										removedFrom : // put back in the original slot so it doesn't move unless it needs to (relying on a stable sort below)
										resultsArray.length;
									resultsArray.splice(firstInsertedInto, 0, changed); // add the new item
									insertedInto = array.indexOf(queryExecutor(resultsArray), changed); // sort it
									// we now need to push the chagne back into the original results array
									resultsArray.splice(firstInsertedInto, 1); // remove the inserted item from the previous index
									
									if((options.start && insertedInto == 0) ||
										(!atEnd && insertedInto == resultsArray.length)){
										// if it is at the end of the page, assume it goes into the prev or next page
										insertedInto = -1;
									}else{
										resultsArray.splice(insertedInto, 0, changed); // and insert into the results array with the correct index
									}
								}
							}else if(changed){
								// we don't have a queryEngine, so we can't provide any information
								// about where it was inserted or moved to. If it is an update, we leave it's position alone, other we at least indicate a new object
								if(existingId !== undef){
									// an update, keep the index the same
									insertedInto = removedFrom;
								}else if(!options.start){
									// a new object
									insertedInto = store.defaultIndex || 0;
									resultsArray.splice(insertedInto, 0, changed);
								}
							}
							if((removedFrom > -1 || insertedInto > -1) &&
									(includeObjectUpdates || !queryExecutor || (removedFrom != insertedInto))){
								var copyListeners = listeners.slice();
								for(i = 0;listener = copyListeners[i]; i++){
									listener(changed || removedObject, removedFrom, insertedInto);
								}
							}
						});
					});
				}
				var handle = {};
				// TODO: Remove cancel in 2.0.
				handle.remove = handle.cancel = function(){
					// remove this listener
					var index = array.indexOf(listeners, listener);
					if(index > -1){ // check to make sure we haven't already called cancel
						listeners.splice(index, 1);
						if(!listeners.length){
							// no more listeners, remove the query updater too
							queryUpdaters.splice(array.indexOf(queryUpdaters, queryUpdater), 1);
						}
					}
				};
				return handle;
			};
		}
		return results;
	};
	var inMethod;
	function whenFinished(method, action){
		var original = store[method];
		if(original){
			store[method] = function(value){
				if(inMethod){
					// if one method calls another (like add() calling put()) we don't want two events
					return original.apply(this, arguments);
				}
				inMethod = true;
				try{
					var results = original.apply(this, arguments);
					when(results, function(results){
						action((typeof results == "object" && results) || value);
					});
					return results;
				}finally{
					inMethod = false;
				}
			};
		}
	}
	// monitor for updates by listening to these methods
	whenFinished("put", function(object){
		store.notify(object, store.getIdentity(object));
	});
	whenFinished("add", function(object){
		store.notify(object);
	});
	whenFinished("remove", function(id){
		store.notify(undefined, id);
	});

	return store;
};

lang.setObject("dojo.store.Observable", Observable);

return Observable;
});

},
'dijit/form/Button':function(){
define([
	"require",
	"dojo/_base/declare", // declare
	"dojo/dom-class", // domClass.toggle
	"dojo/has", //  0 
	"dojo/_base/kernel", // kernel.deprecated
	"dojo/_base/lang", // lang.trim
	"dojo/ready",
	"./_FormWidget",
	"./_ButtonMixin",
	"dojo/text!./templates/Button.html"
], function(require, declare, domClass, has, kernel, lang, ready, _FormWidget, _ButtonMixin, template){

	// module:
	//		dijit/form/Button

	// Back compat w/1.6, remove for 2.0
	if( 0 ){
		ready(0, function(){
			var requires = ["dijit/form/DropDownButton", "dijit/form/ComboButton", "dijit/form/ToggleButton"];
			require(requires);	// use indirection so modules not rolled into a build
		});
	}

	var Button = declare("dijit.form.Button" + (has("dojo-bidi") ? "_NoBidi" : ""), [_FormWidget, _ButtonMixin], {
		// summary:
		//		Basically the same thing as a normal HTML button, but with special styling.
		// description:
		//		Buttons can display a label, an icon, or both.
		//		A label should always be specified (through innerHTML) or the label
		//		attribute.  It can be hidden via showLabel=false.
		// example:
		// |	<button data-dojo-type="dijit/form/Button" onClick="...">Hello world</button>
		//
		// example:
		// |	var button1 = new Button({label: "hello world", onClick: foo});
		// |	dojo.body().appendChild(button1.domNode);

		// showLabel: Boolean
		//		Set this to true to hide the label text and display only the icon.
		//		(If showLabel=false then iconClass must be specified.)
		//		Especially useful for toolbars.
		//		If showLabel=true, the label will become the title (a.k.a. tooltip/hint) of the icon.
		//
		//		The exception case is for computers in high-contrast mode, where the label
		//		will still be displayed, since the icon doesn't appear.
		showLabel: true,

		// iconClass: String
		//		Class to apply to DOMNode in button to make it display an icon
		iconClass: "dijitNoIcon",
		_setIconClassAttr: { node: "iconNode", type: "class" },

		baseClass: "dijitButton",

		templateString: template,

		// Map widget attributes to DOMNode attributes.
		_setValueAttr: "valueNode",
		_setNameAttr: function(name){
			// avoid breaking existing subclasses where valueNode undefined.  Perhaps in 2.0 require it to be defined?
			if(this.valueNode){
				this.valueNode.setAttribute("name", name);
			}
		},

		_fillContent: function(/*DomNode*/ source){
			// Overrides _Templated._fillContent().
			// If button label is specified as srcNodeRef.innerHTML rather than
			// this.params.label, handle it here.
			// TODO: remove the method in 2.0, parser will do it all for me
			if(source && (!this.params || !("label" in this.params))){
				var sourceLabel = lang.trim(source.innerHTML);
				if(sourceLabel){
					this.label = sourceLabel; // _applyAttributes will be called after buildRendering completes to update the DOM
				}
			}
		},

		_setShowLabelAttr: function(val){
			if(this.containerNode){
				domClass.toggle(this.containerNode, "dijitDisplayNone", !val);
			}
			this._set("showLabel", val);
		},

		setLabel: function(/*String*/ content){
			// summary:
			//		Deprecated.  Use set('label', ...) instead.
			kernel.deprecated("dijit.form.Button.setLabel() is deprecated.  Use set('label', ...) instead.", "", "2.0");
			this.set("label", content);
		},

		_setLabelAttr: function(/*String*/ content){
			// summary:
			//		Hook for set('label', ...) to work.
			// description:
			//		Set the label (text) of the button; takes an HTML string.
			//		If the label is hidden (showLabel=false) then and no title has
			//		been specified, then label is also set as title attribute of icon.
			this.inherited(arguments);
			if(!this.showLabel && !("title" in this.params)){
				this.titleNode.title = lang.trim(this.containerNode.innerText || this.containerNode.textContent || '');
			}
		}
	});

	if(has("dojo-bidi")){
		Button = declare("dijit.form.Button", Button, {
			_setLabelAttr: function(/*String*/ content){
				this.inherited(arguments);
				if(this.titleNode.title){
					this.applyTextDir(this.titleNode, this.titleNode.title);
				}
			},

			_setTextDirAttr: function(/*String*/ textDir){
				if(this._created && this.textDir != textDir){
					this._set("textDir", textDir);
					this._setLabelAttr(this.label); // call applyTextDir on both focusNode and titleNode
				}
			}
		});
	}

	return Button;
});

},
'dijit/form/_FormWidget':function(){
define([
	"dojo/_base/declare", // declare
	"dojo/sniff", //  0 , has("msapp")
	"dojo/_base/kernel", // kernel.deprecated
	"dojo/ready",
	"../_Widget",
	"../_CssStateMixin",
	"../_TemplatedMixin",
	"./_FormWidgetMixin"
], function(declare, has, kernel, ready, _Widget, _CssStateMixin, _TemplatedMixin, _FormWidgetMixin){

	// module:
	//		dijit/form/_FormWidget

	// Back compat w/1.6, remove for 2.0
	if( 0 ){
		ready(0, function(){
			var requires = ["dijit/form/_FormValueWidget"];
			require(requires);	// use indirection so modules not rolled into a build
		});
	}

	return declare("dijit.form._FormWidget", [_Widget, _TemplatedMixin, _CssStateMixin, _FormWidgetMixin], {
		// summary:
		//		Base class for widgets corresponding to native HTML elements such as `<checkbox>` or `<button>`,
		//		which can be children of a `<form>` node or a `dijit/form/Form` widget.
		//
		// description:
		//		Represents a single HTML element.
		//		All these widgets should have these attributes just like native HTML input elements.
		//		You can set them during widget construction or afterwards, via `dijit/_WidgetBase.set()`.
		//
		//		They also share some common methods.

		setDisabled: function(/*Boolean*/ disabled){
			// summary:
			//		Deprecated.  Use set('disabled', ...) instead.
			kernel.deprecated("setDisabled(" + disabled + ") is deprecated. Use set('disabled'," + disabled + ") instead.", "", "2.0");
			this.set('disabled', disabled);
		},

		setValue: function(/*String*/ value){
			// summary:
			//		Deprecated.  Use set('value', ...) instead.
			kernel.deprecated("dijit.form._FormWidget:setValue(" + value + ") is deprecated.  Use set('value'," + value + ") instead.", "", "2.0");
			this.set('value', value);
		},

		getValue: function(){
			// summary:
			//		Deprecated.  Use get('value') instead.
			kernel.deprecated(this.declaredClass + "::getValue() is deprecated. Use get('value') instead.", "", "2.0");
			return this.get('value');
		},

		postMixInProperties: function(){
			// Setup name=foo string to be referenced from the template (but only if a name has been specified).
			// Unfortunately we can't use _setNameAttr to set the name in IE due to IE limitations, see #8484, #8660.
			// But when IE6 and IE7 are desupported, then we probably don't need this anymore, so should remove it in 2.0.
			// Also, don't do this for Windows 8 Store Apps because it causes a security exception (see #16452).
			// Regarding escaping, see heading "Attribute values" in
			// http://www.w3.org/TR/REC-html40/appendix/notes.html#h-B.3.2
			this.nameAttrSetting = (this.name && !has("msapp")) ? ('name="' + this.name.replace(/"/g, "&quot;") + '"') : '';
			this.inherited(arguments);
		},

		// Override automatic assigning type --> focusNode, it causes exception on IE.
		// Instead, type must be specified as ${type} in the template, as part of the original DOM
		_setTypeAttr: null
	});
});

},
'dijit/form/_FormWidgetMixin':function(){
define([
	"dojo/_base/array", // array.forEach
	"dojo/_base/declare", // declare
	"dojo/dom-attr", // domAttr.set
	"dojo/dom-style", // domStyle.get
	"dojo/_base/lang", // lang.hitch lang.isArray
	"dojo/mouse", // mouse.isLeft
	"dojo/on",
	"dojo/sniff", // has("webkit")
	"dojo/window", // winUtils.scrollIntoView
	"../a11y"    // a11y.hasDefaultTabStop
], function(array, declare, domAttr, domStyle, lang, mouse, on, has, winUtils, a11y){

	// module:
	//		dijit/form/_FormWidgetMixin

	return declare("dijit.form._FormWidgetMixin", null, {
		// summary:
		//		Mixin for widgets corresponding to native HTML elements such as `<checkbox>` or `<button>`,
		//		which can be children of a `<form>` node or a `dijit/form/Form` widget.
		//
		// description:
		//		Represents a single HTML element.
		//		All these widgets should have these attributes just like native HTML input elements.
		//		You can set them during widget construction or afterwards, via `dijit/_WidgetBase.set()`.
		//
		//		They also share some common methods.

		// name: [const] String
		//		Name used when submitting form; same as "name" attribute or plain HTML elements
		name: "",

		// alt: String
		//		Corresponds to the native HTML `<input>` element's attribute.
		alt: "",

		// value: String
		//		Corresponds to the native HTML `<input>` element's attribute.
		value: "",

		// type: [const] String
		//		Corresponds to the native HTML `<input>` element's attribute.
		type: "text",

		// type: String
		//		Apply aria-label in markup to the widget's focusNode
		"aria-label": "focusNode",

		// tabIndex: String
		//		Order fields are traversed when user hits the tab key
		tabIndex: "0",
		_setTabIndexAttr: "focusNode", // force copy even when tabIndex default value, needed since Button is <span>

		// disabled: Boolean
		//		Should this widget respond to user input?
		//		In markup, this is specified as "disabled='disabled'", or just "disabled".
		disabled: false,

		// intermediateChanges: Boolean
		//		Fires onChange for each value change or only on demand
		intermediateChanges: false,

		// scrollOnFocus: Boolean
		//		On focus, should this widget scroll into view?
		scrollOnFocus: true,

		// Override _WidgetBase mapping id to this.domNode, needs to be on focusNode so <label> etc.
		// works with screen reader
		_setIdAttr: "focusNode",

		_setDisabledAttr: function(/*Boolean*/ value){
			this._set("disabled", value);
			domAttr.set(this.focusNode, 'disabled', value);
			if(this.valueNode){
				domAttr.set(this.valueNode, 'disabled', value);
			}
			this.focusNode.setAttribute("aria-disabled", value ? "true" : "false");

			if(value){
				// reset these, because after the domNode is disabled, we can no longer receive
				// mouse related events, see #4200
				this._set("hovering", false);
				this._set("active", false);

				// clear tab stop(s) on this widget's focusable node(s)  (ComboBox has two focusable nodes)
				var attachPointNames = "tabIndex" in this.attributeMap ? this.attributeMap.tabIndex :
					("_setTabIndexAttr" in this) ? this._setTabIndexAttr : "focusNode";
				array.forEach(lang.isArray(attachPointNames) ? attachPointNames : [attachPointNames], function(attachPointName){
					var node = this[attachPointName];
					// complex code because tabIndex=-1 on a <div> doesn't work on FF
					if(has("webkit") || a11y.hasDefaultTabStop(node)){    // see #11064 about webkit bug
						node.setAttribute('tabIndex', "-1");
					}else{
						node.removeAttribute('tabIndex');
					}
				}, this);
			}else{
				if(this.tabIndex != ""){
					this.set('tabIndex', this.tabIndex);
				}
			}
		},

		_onFocus: function(/*String*/ by){
			// If user clicks on the widget, even if the mouse is released outside of it,
			// this widget's focusNode should get focus (to mimic native browser behavior).
			// Browsers often need help to make sure the focus via mouse actually gets to the focusNode.
			// TODO: consider removing all of this for 2.0 or sooner, see #16622 etc.
			if(by == "mouse" && this.isFocusable()){
				// IE exhibits strange scrolling behavior when refocusing a node so only do it when !focused.
				var focusHandle = this.own(on(this.focusNode, "focus", function(){
					mouseUpHandle.remove();
					focusHandle.remove();
				}))[0];
				// Set a global event to handle mouseup, so it fires properly
				// even if the cursor leaves this.domNode before the mouse up event.
				var mouseUpHandle = this.own(on(this.ownerDocumentBody, "mouseup, touchend", lang.hitch(this, function(evt){
					mouseUpHandle.remove();
					focusHandle.remove();
					// if here, then the mousedown did not focus the focusNode as the default action
					if(this.focused){
						if(evt.type == "touchend"){
							this.defer("focus"); // native focus hasn't occurred yet
						}else{
							this.focus(); // native focus already occurred on mousedown
						}
					}
				})))[0];
			}
			if(this.scrollOnFocus){
				this.defer(function(){
					winUtils.scrollIntoView(this.domNode);
				}); // without defer, the input caret position can change on mouse click
			}
			this.inherited(arguments);
		},

		isFocusable: function(){
			// summary:
			//		Tells if this widget is focusable or not.  Used internally by dijit.
			// tags:
			//		protected
			return !this.disabled && this.focusNode && (domStyle.get(this.domNode, "display") != "none");
		},

		focus: function(){
			// summary:
			//		Put focus on this widget
			if(!this.disabled && this.focusNode.focus){
				try{
					this.focusNode.focus();
				}catch(e){
				}
				/*squelch errors from hidden nodes*/
			}
		},

		compare: function(/*anything*/ val1, /*anything*/ val2){
			// summary:
			//		Compare 2 values (as returned by get('value') for this widget).
			// tags:
			//		protected
			if(typeof val1 == "number" && typeof val2 == "number"){
				return (isNaN(val1) && isNaN(val2)) ? 0 : val1 - val2;
			}else if(val1 > val2){
				return 1;
			}else if(val1 < val2){
				return -1;
			}else{
				return 0;
			}
		},

		onChange: function(/*===== newValue =====*/){
			// summary:
			//		Callback when this widget's value is changed.
			// tags:
			//		callback
		},

		// _onChangeActive: [private] Boolean
		//		Indicates that changes to the value should call onChange() callback.
		//		This is false during widget initialization, to avoid calling onChange()
		//		when the initial value is set.
		_onChangeActive: false,

		_handleOnChange: function(/*anything*/ newValue, /*Boolean?*/ priorityChange){
			// summary:
			//		Called when the value of the widget is set.  Calls onChange() if appropriate
			// newValue:
			//		the new value
			// priorityChange:
			//		For a slider, for example, dragging the slider is priorityChange==false,
			//		but on mouse up, it's priorityChange==true.  If intermediateChanges==false,
			//		onChange is only called form priorityChange=true events.
			// tags:
			//		private
			if(this._lastValueReported == undefined && (priorityChange === null || !this._onChangeActive)){
				// this block executes not for a change, but during initialization,
				// and is used to store away the original value (or for ToggleButton, the original checked state)
				this._resetValue = this._lastValueReported = newValue;
			}
			this._pendingOnChange = this._pendingOnChange
				|| (typeof newValue != typeof this._lastValueReported)
				|| (this.compare(newValue, this._lastValueReported) != 0);
			if((this.intermediateChanges || priorityChange || priorityChange === undefined) && this._pendingOnChange){
				this._lastValueReported = newValue;
				this._pendingOnChange = false;
				if(this._onChangeActive){
					if(this._onChangeHandle){
						this._onChangeHandle.remove();
					}
					// defer allows hidden value processing to run and
					// also the onChange handler can safely adjust focus, etc
					this._onChangeHandle = this.defer(
						function(){
							this._onChangeHandle = null;
							this.onChange(newValue);
						}); // try to collapse multiple onChange's fired faster than can be processed
				}
			}
		},

		create: function(){
			// Overrides _Widget.create()
			this.inherited(arguments);
			this._onChangeActive = true;
		},

		destroy: function(){
			if(this._onChangeHandle){ // destroy called before last onChange has fired
				this._onChangeHandle.remove();
				this.onChange(this._lastValueReported);
			}
			this.inherited(arguments);
		}
	});
});

},
'dijit/form/_ButtonMixin':function(){
define([
	"dojo/_base/declare", // declare
	"dojo/dom", // dom.setSelectable
	"dojo/has",
	"../registry"        // registry.byNode
], function(declare, dom, has, registry){

	// module:
	//		dijit/form/_ButtonMixin

	var ButtonMixin = declare("dijit.form._ButtonMixin" + (has("dojo-bidi") ? "_NoBidi" : ""), null, {
		// summary:
		//		A mixin to add a thin standard API wrapper to a normal HTML button
		// description:
		//		A label should always be specified (through innerHTML) or the label attribute.
		//
		//		Attach points:
		//
		//		- focusNode (required): this node receives focus
		//		- valueNode (optional): this node's value gets submitted with FORM elements
		//		- containerNode (optional): this node gets the innerHTML assignment for label
		// example:
		// |	<button data-dojo-type="dijit/form/Button" onClick="...">Hello world</button>
		// example:
		// |	var button1 = new Button({label: "hello world", onClick: foo});
		// |	dojo.body().appendChild(button1.domNode);

		// label: HTML String
		//		Content to display in button.
		label: "",

		// type: [const] String
		//		Type of button (submit, reset, button, checkbox, radio)
		type: "button",

		__onClick: function(/*Event*/ e){
			// summary:
			//		Internal function to divert the real click onto the hidden INPUT that has a native default action associated with it
			// type:
			//		private
			e.stopPropagation();
			e.preventDefault();
			if(!this.disabled){
				// cannot use on.emit since button default actions won't occur
				this.valueNode.click(e);
			}
			return false;
		},

		_onClick: function(/*Event*/ e){
			// summary:
			//		Internal function to handle click actions
			if(this.disabled){
				e.stopPropagation();
				e.preventDefault();
				return false;
			}
			if(this.onClick(e) === false){
				e.preventDefault();
			}
			cancelled = e.defaultPrevented;

			// Signal Form/Dialog to submit/close.  For 2.0, consider removing this code and instead making the Form/Dialog
			// listen for bubbled click events where evt.target.type == "submit" && !evt.defaultPrevented.
			if(!cancelled && this.type == "submit" && !(this.valueNode || this.focusNode).form){
				for(var node = this.domNode; node.parentNode; node = node.parentNode){
					var widget = registry.byNode(node);
					if(widget && typeof widget._onSubmit == "function"){
						widget._onSubmit(e);
						e.preventDefault(); // action has already occurred
						cancelled = true;
						break;
					}
				}
			}

			return !cancelled;
		},

		postCreate: function(){
			this.inherited(arguments);
			dom.setSelectable(this.focusNode, false);
		},

		onClick: function(/*Event*/ /*===== e =====*/){
			// summary:
			//		Callback for when button is clicked.
			//		If type="submit", return true to perform submit, or false to cancel it.
			// type:
			//		callback
			return true;		// Boolean
		},

		_setLabelAttr: function(/*String*/ content){
			// summary:
			//		Hook for set('label', ...) to work.
			// description:
			//		Set the label (text) of the button; takes an HTML string.
			this._set("label", content);
			var labelNode = this.containerNode || this.focusNode;
			labelNode.innerHTML = content;
		}
	});

	if(has("dojo-bidi")){
		ButtonMixin = declare("dijit.form._ButtonMixin", ButtonMixin, {
			_setLabelAttr: function(){
				this.inherited(arguments);
				var labelNode = this.containerNode || this.focusNode;
				this.applyTextDir(labelNode);
			}
		});
	}

	return ButtonMixin;
});

},
'dgrid/OnDemandGrid':function(){
define(["dojo/_base/declare", "./Grid", "./OnDemandList"], function(declare, Grid, OnDemandList){
	return declare([Grid, OnDemandList], {});
});
},
'dgrid/Grid':function(){
define(["dojo/_base/kernel", "dojo/_base/declare", "dojo/on", "dojo/has", "put-selector/put", "./List", "./util/misc", "dojo/_base/sniff"],
function(kernel, declare, listen, has, put, List, miscUtil){
	var contentBoxSizing = has("ie") < 8 && ! 0 ;
	var invalidClassChars = /[^\._a-zA-Z0-9-]/g;
	function appendIfNode(parent, subNode){
		if(subNode && subNode.nodeType){
			parent.appendChild(subNode);
		}
	}
	
	var Grid = declare(List, {
		columns: null,
		// cellNavigation: Boolean
		//		This indicates that focus is at the cell level. This may be set to false to cause
		//		focus to be at the row level, which is useful if you want only want row-level
		//		navigation.
		cellNavigation: true,
		tabableHeader: true,
		showHeader: true,
		column: function(target){
			// summary:
			//		Get the column object by node, or event, or a columnId
			if(typeof target == "string"){
				return this.columns[target];
			}else{
				return this.cell(target).column;
			}
		},
		listType: "grid",
		cell: function(target, columnId){
			// summary:
			//		Get the cell object by node, or event, id, plus a columnId
			
			if(target.column && target.element){ return target; }
			
			if(target.target && target.target.nodeType){
				// event
				target = target.target;
			}
			var element;
			if(target.nodeType){
				var object;
				do{
					if(this._rowIdToObject[target.id]){
						break;
					}
					var colId = target.columnId;
					if(colId){
						columnId = colId;
						element = target;
						break;
					}
					target = target.parentNode;
				}while(target && target != this.domNode);
			}
			if(!element && typeof columnId != "undefined"){
				var row = this.row(target),
					rowElement = row.element;
				if(rowElement){
					var elements = rowElement.getElementsByTagName("td");
					for(var i = 0; i < elements.length; i++){
						if(elements[i].columnId == columnId){
							element = elements[i];
							break;
						}
					}
				}
			}
			if(target != null){
				return {
					row: row || this.row(target),
					column: columnId && this.column(columnId),
					element: element
				};
			}
		},
		
		createRowCells: function(tag, each, subRows){
			// summary:
			//		Generates the grid for each row (used by renderHeader and and renderRow)
			var row = put("table.dgrid-row-table[role=presentation]"),
				cellNavigation = this.cellNavigation,
				// IE < 9 needs an explicit tbody; other browsers do not
				tbody = (has("ie") < 9 ||  0 ) ? put(row, "tbody") : row,
				tr,
				si, sl, i, l, // iterators
				subRow, column, id, extraClassName, cell, innerCell, colSpan, rowSpan; // used inside loops
			
			// Allow specification of custom/specific subRows, falling back to
			// those defined on the instance.
			subRows = subRows || this.subRows;
			
			for(si = 0, sl = subRows.length; si < sl; si++){
				subRow = subRows[si];
				// for single-subrow cases in modern browsers, TR can be skipped
				// http://jsperf.com/table-without-trs
				tr = put(tbody, "tr");
				if(subRow.className){
					put(tr, "." + subRow.className);
				}
				
				for(i = 0, l = subRow.length; i < l; i++){
					// iterate through the columns
					column = subRow[i];
					id = column.id;
					extraClassName = column.className || (column.field && "field-" + column.field);
					cell = put(tag + (
							".dgrid-cell.dgrid-cell-padding" +
							(id ? ".dgrid-column-" + id : "") +
							(extraClassName ? "." + extraClassName : "")
						).replace(invalidClassChars,"-") +
						"[role=" + (tag === "th" ? "columnheader" : "gridcell") + "]");
					cell.columnId = id;
					if(contentBoxSizing){
						// The browser (IE7-) does not support box-sizing: border-box, so we emulate it with a padding div
						innerCell = put(cell, "!dgrid-cell-padding div.dgrid-cell-padding");// remove the dgrid-cell-padding, and create a child with that class
						cell.contents = innerCell;
					}else{
						innerCell = cell;
					}
					colSpan = column.colSpan;
					if(colSpan){
						cell.colSpan = colSpan;
					}
					rowSpan = column.rowSpan;
					if(rowSpan){
						cell.rowSpan = rowSpan;
					}
					each(innerCell, column);
					// add the td to the tr at the end for better performance
					tr.appendChild(cell);
				}
			}
			return row;
		},
		
		left: function(cell, steps){
			if(!cell.element){ cell = this.cell(cell); }
			return this.cell(this._move(cell, -(steps || 1), "dgrid-cell"));
		},
		right: function(cell, steps){
			if(!cell.element){ cell = this.cell(cell); }
			return this.cell(this._move(cell, steps || 1, "dgrid-cell"));
		},
		
		renderRow: function(object, options){
			var self = this;
			var row = this.createRowCells("td", function(td, column){
				var data = object;
				// Support get function or field property (similar to DataGrid)
				if(column.get){
					data = column.get(object);
				}else if("field" in column && column.field != "_item"){
					data = data[column.field];
				}
				
				if(column.renderCell){
					// A column can provide a renderCell method to do its own DOM manipulation,
					// event handling, etc.
					appendIfNode(td, column.renderCell(object, data, td, options));
				}else{
					defaultRenderCell.call(column, object, data, td, options);
				}
			}, options && options.subRows);
			// row gets a wrapper div for a couple reasons:
			//	1. So that one can set a fixed height on rows (heights can't be set on <table>'s AFAICT)
			// 2. So that outline style can be set on a row when it is focused, and Safari's outline style is broken on <table>
			return put("div[role=row]>", row);
		},
		renderHeader: function(){
			// summary:
			//		Setup the headers for the grid
			var
				grid = this,
				columns = this.columns,
				headerNode = this.headerNode,
				i = headerNode.childNodes.length;
			
			headerNode.setAttribute("role", "row");
			
			// clear out existing header in case we're resetting
			while(i--){
				put(headerNode.childNodes[i], "!");
			}
			
			var row = this.createRowCells("th", function(th, column){
				var contentNode = column.headerNode = th;
				if(contentBoxSizing){
					// we're interested in the th, but we're passed the inner div
					th = th.parentNode;
				}
				var field = column.field;
				if(field){
					th.field = field;
				}
				// allow for custom header content manipulation
				if(column.renderHeaderCell){
					appendIfNode(contentNode, column.renderHeaderCell(contentNode));
				}else if(column.label || column.field){
					contentNode.appendChild(document.createTextNode(column.label || column.field));
				}
				if(column.sortable !== false && field && field != "_item"){
					th.sortable = true;
					th.className += " dgrid-sortable";
				}
			}, this.subRows && this.subRows.headerRows);
			this._rowIdToObject[row.id = this.id + "-header"] = this.columns;
			headerNode.appendChild(row);
			
			// If the columns are sortable, re-sort on clicks.
			// Use a separate listener property to be managed by renderHeader in case
			// of subsequent calls.
			if(this._sortListener){
				this._sortListener.remove();
			}
			this._sortListener = listen(row, "click,keydown", function(event){
				// respond to click, space keypress, or enter keypress
				if(event.type == "click" || event.keyCode == 32 /* space bar */ || (! 0  && event.keyCode == 13) /* enter */){
					var target = event.target,
						field, sort, newSort, eventObj;
					do{
						if(target.sortable){
							// If the click is on the same column as the active sort,
							// reverse sort direction
							newSort = [{
								attribute: (field = target.field || target.columnId),
								descending: (sort = grid._sort[0]) && sort.attribute == field &&
									!sort.descending
							}];
							
							// Emit an event with the new sort
							eventObj = {
								bubbles: true,
								cancelable: true,
								grid: grid,
								parentType: event.type,
								sort: newSort
							};
							
							if (listen.emit(target, "dgrid-sort", eventObj)){
								// Stash node subject to DOM manipulations,
								// to be referenced then removed by sort()
								grid._sortNode = target;
								grid.set("sort", newSort);
							}
							
							break;
						}
					}while((target = target.parentNode) && target != headerNode);
				}
			});
		},
		
		resize: function(){
			// extension of List.resize to allow accounting for
			// column sizes larger than actual grid area
			var
				headerTableNode = this.headerNode.firstChild,
				contentNode = this.contentNode,
				width;
			
			this.inherited(arguments);
			
			if(!has("ie") || (has("ie") > 7 && ! 0 )){
				// Force contentNode width to match up with header width.
				// (Old IEs don't have a problem due to how they layout.)
				
				contentNode.style.width = ""; // reset first
				
				if(contentNode && headerTableNode){
					if((width = headerTableNode.offsetWidth) != contentNode.offsetWidth){
						// update size of content node if necessary (to match size of rows)
						// (if headerTableNode can't be found, there isn't much we can do)
						contentNode.style.width = width + "px";
					}
				}
			}
		},
		
		destroy: function(){
			// Run _destroyColumns first to perform any column plugin tear-down logic.
			this._destroyColumns();
			if(this._sortListener){
				this._sortListener.remove();
			}
			
			this.inherited(arguments);
		},
		
		_setSort: function(property, descending){
			// summary:
			//		Extension of List.js sort to update sort arrow in UI
			
			// Normalize _sort first via inherited logic, then update the sort arrow
			this.inherited(arguments);
			this.updateSortArrow(this._sort);
		},
		
		updateSortArrow: function(sort, updateSort){
			// summary:
			//		Method responsible for updating the placement of the arrow in the
			//		appropriate header cell.  Typically this should not be called (call
			//		set("sort", ...) when actually updating sort programmatically), but
			//		this method may be used by code which is customizing sort (e.g.
			//		by reacting to the dgrid-sort event, canceling it, then
			//		performing logic and calling this manually).
			// sort: Array
			//		Standard sort parameter - array of object(s) containing attribute
			//		and optionally descending property
			// updateSort: Boolean?
			//		If true, will update this._sort based on the passed sort array
			//		(i.e. to keep it in sync when custom logic is otherwise preventing
			//		it from being updated); defaults to false
			
			// Clean up UI from any previous sort
			if(this._lastSortedArrow){
				// Remove the sort classes from the parent node
				put(this._lastSortedArrow, "<!dgrid-sort-up!dgrid-sort-down");
				// Destroy the lastSortedArrow node
				put(this._lastSortedArrow, "!");
				delete this._lastSortedArrow;
			}
			
			if(updateSort){ this._sort = sort; }
			if(!sort[0]){ return; } // nothing to do if no sort is specified
			
			var prop = sort[0].attribute,
				desc = sort[0].descending,
				target = this._sortNode, // stashed if invoked from header click
				columns, column, i;
			
			delete this._sortNode;
			
			if(!target){
				columns = this.columns;
				for(i in columns){
					column = columns[i];
					if(column.field == prop){
						target = column.headerNode;
						break;
					}
				}
			}
			// skip this logic if field being sorted isn't actually displayed
			if(target){
				target = target.contents || target;
				// place sort arrow under clicked node, and add up/down sort class
				this._lastSortedArrow = put(target.firstChild, "-div.dgrid-sort-arrow.ui-icon[role=presentation]");
				this._lastSortedArrow.innerHTML = "&nbsp;";
				put(target, desc ? ".dgrid-sort-down" : ".dgrid-sort-up");
				// call resize in case relocation of sort arrow caused any height changes
				this.resize();
			}
		},
		
		styleColumn: function(colId, css){
			// summary:
			//		Dynamically creates a stylesheet rule to alter a column's style.
			
			return this.addCssRule("#" + miscUtil.escapeCssIdentifier(this.domNode.id) +
				" .dgrid-column-" + colId, css);
		},
		
		/*=====
		_configColumn: function(column, columnId, rowColumns, prefix){
			// summary:
			//		Method called when normalizing base configuration of a single
			//		column.  Can be used as an extension point for behavior requiring
			//		access to columns when a new configuration is applied.
		},=====*/
		
		_configColumns: function(prefix, rowColumns){
			// configure the current column
			var subRow = [],
				isArray = rowColumns instanceof Array,
				columnId, column;
			for(columnId in rowColumns){
				column = rowColumns[columnId];
				if(typeof column == "string"){
					rowColumns[columnId] = column = {label:column};
				}
				if(!isArray && !column.field){
					column.field = columnId;
				}
				columnId = column.id = column.id || (isNaN(columnId) ? columnId : (prefix + columnId));
				if(isArray){ this.columns[columnId] = column; }
				
				// allow further base configuration in subclasses
				if(this._configColumn){
					this._configColumn(column, columnId, rowColumns, prefix);
				}
				
				// add grid reference to each column object for potential use by plugins
				column.grid = this;
				if(typeof column.init === "function"){ column.init(); }
				
				subRow.push(column); // make sure it can be iterated on
			}
			return isArray ? rowColumns : subRow;
		},
		
		_destroyColumns: function(){
			// summary:
			//		Iterates existing subRows looking for any column definitions with
			//		destroy methods (defined by plugins) and calls them.  This is called
			//		immediately before configuring a new column structure.
			
			var subRows = this.subRows,
				// if we have column sets, then we don't need to do anything with the missing subRows, ColumnSet will handle it
				subRowsLength = subRows && subRows.length,
				i, j, column, len;
			
			// First remove rows (since they'll be refreshed after we're done),
			// so that anything aspected onto removeRow by plugins can run.
			// (cleanup will end up running again, but with nothing to iterate.)
			this.cleanup();
			
			for(i = 0; i < subRowsLength; i++){
				for(j = 0, len = subRows[i].length; j < len; j++){
					column = subRows[i][j];
					if(typeof column.destroy === "function"){ column.destroy(); }
				}
			}
		},
		
		configStructure: function(){
			// configure the columns and subRows
			var subRows = this.subRows,
				columns = this._columns = this.columns;
			
			// Reset this.columns unless it was already passed in as an object
			this.columns = !columns || columns instanceof Array ? {} : columns;
			
			if(subRows){
				// Process subrows, which will in turn populate the this.columns object
				for(var i = 0; i < subRows.length; i++){
					subRows[i] = this._configColumns(i + "-", subRows[i]);
				}
			}else{
				this.subRows = [this._configColumns("", columns)];
			}
		},
		
		_getColumns: function(){
			// _columns preserves what was passed to set("columns"), but if subRows
			// was set instead, columns contains the "object-ified" version, which
			// was always accessible in the past, so maintain that accessibility going
			// forward.
			return this._columns || this.columns;
		},
		_setColumns: function(columns){
			this._destroyColumns();
			// reset instance variables
			this.subRows = null;
			this.columns = columns;
			// re-run logic
			this._updateColumns();
		},
		
		_setSubRows: function(subrows){
			this._destroyColumns();
			this.subRows = subrows;
			this._updateColumns();
		},
		
		setColumns: function(columns){
			kernel.deprecated("setColumns(...)", 'use set("columns", ...) instead', "dgrid 1.0");
			this.set("columns", columns);
		},
		setSubRows: function(subrows){
			kernel.deprecated("setSubRows(...)", 'use set("subRows", ...) instead', "dgrid 1.0");
			this.set("subRows", subrows);
		},
		
		_updateColumns: function(){
			// summary:
			//		Called when columns, subRows, or columnSets are reset
			
			this.configStructure();
			this.renderHeader();
			
			this.refresh();
			// re-render last collection if present
			this._lastCollection && this.renderArray(this._lastCollection);
			
			// After re-rendering the header, re-apply the sort arrow if needed.
			if(this._started){
				if(this._sort && this._sort.length){
					this.updateSortArrow(this._sort);
				} else {
					// Only call resize directly if we didn't call updateSortArrow,
					// since that calls resize itself when it updates.
					this.resize();
				}
			}
		}
	});
	
	function defaultRenderCell(object, data, td, options){
		if(this.formatter){
			// Support formatter, with or without formatterScope
			var formatter = this.formatter,
				formatterScope = this.grid.formatterScope;
			td.innerHTML = typeof formatter === "string" && formatterScope ?
				formatterScope[formatter](data, object) : formatter(data, object);
		}else if(data != null){
			td.appendChild(document.createTextNode(data)); 
		}
	}
	
	// expose appendIfNode and default implementation of renderCell,
	// e.g. for use by column plugins
	Grid.appendIfNode = appendIfNode;
	Grid.defaultRenderCell = defaultRenderCell;
	
	return Grid;
});

},
'put-selector/put':function(){
(function(define){
var forDocument, fragmentFasterHeuristic = /[-+,> ]/; // if it has any of these combinators, it is probably going to be faster with a document fragment 
define([], forDocument = function(doc, newFragmentFasterHeuristic){
"use strict";
	// module:
	//		put-selector/put
	// summary:
	//		This module defines a fast lightweight function for updating and creating new elements
	//		terse, CSS selector-based syntax. The single function from this module creates
	// 		new DOM elements and updates existing elements. See README.md for more information.
	//	examples:
	//		To create a simple div with a class name of "foo":
	//		|	put("div.foo");
	fragmentFasterHeuristic = newFragmentFasterHeuristic || fragmentFasterHeuristic;
	var selectorParse = /(?:\s*([-+ ,<>]))?\s*(\.|!\.?|#)?([-\w%$|]+)?(?:\[([^\]=]+)=?['"]?([^\]'"]*)['"]?\])?/g,
		undefined, namespaceIndex, namespaces = false,
		doc = doc || document,
		ieCreateElement = typeof doc.createElement == "object"; // telltale sign of the old IE behavior with createElement that does not support later addition of name 
	function insertTextNode(element, text){
		element.appendChild(doc.createTextNode(text));
	}
	function put(topReferenceElement){
		var fragment, lastSelectorArg, nextSibling, referenceElement, current,
			args = arguments,
			returnValue = args[0]; // use the first argument as the default return value in case only an element is passed in
		function insertLastElement(){
			// we perform insertBefore actions after the element is fully created to work properly with 
			// <input> tags in older versions of IE that require type attributes
			//	to be set before it is attached to a parent.
			// We also handle top level as a document fragment actions in a complex creation 
			// are done on a detached DOM which is much faster
			// Also if there is a parse error, we generally error out before doing any DOM operations (more atomic) 
			if(current && referenceElement && current != referenceElement){
				(referenceElement == topReferenceElement &&
					// top level, may use fragment for faster access 
					(fragment || 
						// fragment doesn't exist yet, check to see if we really want to create it 
						(fragment = fragmentFasterHeuristic.test(argument) && doc.createDocumentFragment()))
							// any of the above fails just use the referenceElement  
							|| referenceElement).
								insertBefore(current, nextSibling || null); // do the actual insertion
			}
		}
		for(var i = 0; i < args.length; i++){
			var argument = args[i];
			if(typeof argument == "object"){
				lastSelectorArg = false;
				if(argument instanceof Array){
					// an array
					current = doc.createDocumentFragment();
					for(var key = 0; key < argument.length; key++){
						current.appendChild(put(argument[key]));
					}
					argument = current;
				}
				if(argument.nodeType){
					current = argument;
					insertLastElement();
					referenceElement = argument;
					nextSibling = 0;
				}else{
					// an object hash
					for(var key in argument){
						current[key] = argument[key];
					}				
				}
			}else if(lastSelectorArg){
				// a text node should be created
				// take a scalar value, use createTextNode so it is properly escaped
				// createTextNode is generally several times faster than doing an escaped innerHTML insertion: http://jsperf.com/createtextnode-vs-innerhtml/2
				lastSelectorArg = false;
				insertTextNode(current, argument);
			}else{
				if(i < 1){
					// if we are starting with a selector, there is no top element
					topReferenceElement = null;
				}
				lastSelectorArg = true;
				var leftoverCharacters = argument.replace(selectorParse, function(t, combinator, prefix, value, attrName, attrValue){
					if(combinator){
						// insert the last current object
						insertLastElement();
						if(combinator == '-' || combinator == '+'){
							// + or - combinator, 
							// TODO: add support for >- as a means of indicating before the first child?
							referenceElement = (nextSibling = (current || referenceElement)).parentNode;
							current = null;
							if(combinator == "+"){
								nextSibling = nextSibling.nextSibling;
							}// else a - operator, again not in CSS, but obvious in it's meaning (create next element before the current/referenceElement)
						}else{
							if(combinator == "<"){
								// parent combinator (not really in CSS, but theorized, and obvious in it's meaning)
								referenceElement = current = (current || referenceElement).parentNode;
							}else{
								if(combinator == ","){
									// comma combinator, start a new selector
									referenceElement = topReferenceElement;
								}else if(current){
									// else descendent or child selector (doesn't matter, treated the same),
									referenceElement = current;
								}
								current = null;
							}
							nextSibling = 0;
						}
						if(current){
							referenceElement = current;
						}
					}
					var tag = !prefix && value;
					if(tag || (!current && (prefix || attrName))){
						if(tag == "$"){
							// this is a variable to be replaced with a text node
							insertTextNode(referenceElement, args[++i]);
						}else{
							// Need to create an element
							tag = tag || put.defaultTag;
							var ieInputName = ieCreateElement && args[i +1] && args[i +1].name;
							if(ieInputName){
								// in IE, we have to use the crazy non-standard createElement to create input's that have a name 
								tag = '<' + tag + ' name="' + ieInputName + '">';
							}
							// we swtich between creation methods based on namespace usage
							current = namespaces && ~(namespaceIndex = tag.indexOf('|')) ?
								doc.createElementNS(namespaces[tag.slice(0, namespaceIndex)], tag.slice(namespaceIndex + 1)) : 
								doc.createElement(tag);
						}
					}
					if(prefix){
						if(value == "$"){
							value = args[++i];
						}
						if(prefix == "#"){
							// #id was specified
							current.id = value;
						}else{
							// we are in the className addition and removal branch
							var currentClassName = current.className;
							// remove the className (needed for addition or removal)
							// see http://jsperf.com/remove-class-name-algorithm/2 for some tests on this
							var removed = currentClassName && (" " + currentClassName + " ").replace(" " + value + " ", " ");
							if(prefix == "."){
								// addition, add the className
								current.className = currentClassName ? (removed + value).substring(1) : value;
							}else{
								// else a '!' class removal
								if(argument == "!"){
									var parentNode;
									// special signal to delete this element
									if(ieCreateElement){
										// use the ol' innerHTML trick to get IE to do some cleanup
										put("div", current, '<').innerHTML = "";
									}else if(parentNode = current.parentNode){ // intentional assigment
										// use a faster, and more correct (for namespaced elements) removal (http://jsperf.com/removechild-innerhtml)
										parentNode.removeChild(current);
									}
								}else{
									// we already have removed the class, just need to trim
									removed = removed.substring(1, removed.length - 1);
									// only assign if it changed, this can save a lot of time
									if(removed != currentClassName){
										current.className = removed;
									}
								}
							}
							// CSS class removal
						}
					}
					if(attrName){
						if(attrValue == "$"){
							attrValue = args[++i];
						}
						// [name=value]
						if(attrName == "style"){
							// handle the special case of setAttribute not working in old IE
							current.style.cssText = attrValue;
						}else{
							var method = attrName.charAt(0) == "!" ? (attrName = attrName.substring(1)) && 'removeAttribute' : 'setAttribute';
							attrValue = attrValue === '' ? attrName : attrValue;
							// determine if we need to use a namespace
							namespaces && ~(namespaceIndex = attrName.indexOf('|')) ?
								current[method + "NS"](namespaces[attrName.slice(0, namespaceIndex)], attrName.slice(namespaceIndex + 1), attrValue) :
								current[method](attrName, attrValue);
						}
					}
					return '';
				});
				if(leftoverCharacters){
					throw new SyntaxError("Unexpected char " + leftoverCharacters + " in " + argument);
				}
				insertLastElement();
				referenceElement = returnValue = current || referenceElement;
			}
		}
		if(topReferenceElement && fragment){
			// we now insert the top level elements for the fragment if it exists
			topReferenceElement.appendChild(fragment);
		}
		return returnValue;
	}
	put.addNamespace = function(name, uri){
		if(doc.createElementNS){
			(namespaces || (namespaces = {}))[name] = uri;
		}else{
			// for old IE
			doc.namespaces.add(name, uri);
		}
	};
	put.defaultTag = "div";
	put.forDocument = forDocument;
	return put;
});
})(function(id, deps, factory){
	factory = factory || deps;
	if(typeof define === "function"){
		// AMD loader
		define([], function(){
			return factory();
		});
	}else if(typeof window == "undefined"){
		// server side JavaScript, probably (hopefully) NodeJS
		require("./node-html")(module, factory);
	}else{
		// plain script in a browser
		put = factory();
	}
});

},
'dgrid/List':function(){
define(["dojo/_base/kernel", "dojo/_base/declare", "dojo/on", "dojo/has", "./util/misc", "dojo/has!touch?./TouchScroll", "xstyle/has-class", "put-selector/put", "dojo/_base/sniff", "xstyle/css!./css/dgrid.css"], 
function(kernel, declare, listen, has, miscUtil, TouchScroll, hasClass, put){
	// Add user agent/feature CSS classes 
	hasClass("mozilla", "opera", "webkit", "ie", "ie-6", "ie-6-7", "quirks", "no-quirks", "touch");
	
	var oddClass = "dgrid-row-odd",
		evenClass = "dgrid-row-even",
		scrollbarWidth, scrollbarHeight;
	
	function byId(id){
		return document.getElementById(id);
	}
	
	function getScrollbarSize(node, dimension){
		// Used by has tests for scrollbar width/height
		var body = document.body,
			size;
		
		put(body, node, ".dgrid-scrollbar-measure");
		size = node["offset" + dimension] - node["client" + dimension];
		
		put(node, "!dgrid-scrollbar-measure");
		body.removeChild(node);
		
		return size;
	}
	has.add("dom-scrollbar-width", function(global, doc, element){
		return getScrollbarSize(element, "Width");
	});
	has.add("dom-scrollbar-height", function(global, doc, element){
		return getScrollbarSize(element, "Height");
	});
	
	// var and function for autogenerating ID when one isn't provided
	var autogen = 0;
	function generateId(){
		return "dgrid_" + autogen++;
	}
	
	// common functions for class and className setters/getters
	// (these are run in instance context)
	var spaceRx = / +/g;
	function setClass(cls){
		// Format input appropriately for use with put...
		var putClass = cls ? "." + cls.replace(spaceRx, ".") : "";
		
		// Remove any old classes, and add new ones.
		if(this._class){
			putClass = "!" + this._class.replace(spaceRx, "!") + putClass;
		}
		put(this.domNode, putClass);
		
		// Store for later retrieval/removal.
		this._class = cls;
	}
	function getClass(){
		return this._class;
	}
	
	// window resize event handler, run in context of List instance
	var winResizeHandler = has("ie") < 7 && ! 0  ? function(){
		// IE6 triggers window.resize on any element resize;
		// avoid useless calls (and infinite loop if height: auto).
		// The measurement logic here is based on dojo/window logic.
		var root, w, h, dims;
		
		if(!this._started){ return; } // no sense calling resize yet
		
		root = document.documentElement;
		w = root.clientWidth;
		h = root.clientHeight;
		dims = this._prevWinDims || [];
		if(dims[0] !== w || dims[1] !== h){
			this.resize();
			this._prevWinDims = [w, h];
		}
	} :
	function(){
		if(this._started){ this.resize(); }
	};
	
	return declare(TouchScroll ? TouchScroll : null, {
		tabableHeader: false,
		// showHeader: Boolean
		//		Whether to render header (sub)rows.
		showHeader: false,
		// showFooter: Boolean
		//		Whether to render footer area.  Extensions which display content
		//		in the footer area should set this to true.
		showFooter: false,
		// maintainOddEven: Boolean
		//		Whether to maintain the odd/even classes when new rows are inserted.
		//		This can be disabled to improve insertion performance if odd/even styling is not employed.
		maintainOddEven: true,
		
		// cleanAddedRules: Boolean
		//		Whether to track rules added via the addCssRule method to be removed
		//		when the list is destroyed.  Note this is effective at the time of
		//		the call to addCssRule, not at the time of destruction.
		cleanAddedRules: true,
		
		postscript: function(params, srcNodeRef){
			// perform setup and invoke create in postScript to allow descendants to
			// perform logic before create/postCreate happen (a la dijit/_WidgetBase)
			var grid = this;
			
			(this._Row = function(id, object, element){
				this.id = id;
				this.data = object;
				this.element = element;
			}).prototype.remove = function(){
				grid.removeRow(this.element);
			};
			
			if(srcNodeRef){
				// normalize srcNodeRef and store on instance during create process.
				// Doing this in postscript is a bit earlier than dijit would do it,
				// but allows subclasses to access it pre-normalized during create.
				this.srcNodeRef = srcNodeRef =
					srcNodeRef.nodeType ? srcNodeRef : byId(srcNodeRef);
			}
			this.create(params, srcNodeRef);
		},
		listType: "list",
		
		create: function(params, srcNodeRef){
			var domNode = this.domNode = srcNodeRef || put("div"),
				cls;
			
			if(params){
				this.params = params;
				declare.safeMixin(this, params);
				
				// Check for initial class or className in params or on domNode
				cls = params["class"] || params.className || domNode.className;
				
				// handle sort param - TODO: revise @ 1.0 when _sort -> sort
				this._sort = params.sort || [];
				delete this.sort; // ensure back-compat method isn't shadowed
			}else{
				this._sort = [];
			}
			
			// ensure arrays and hashes are initialized
			this.observers = [];
			this._listeners = [];
			this._rowIdToObject = {};
			
			this.postMixInProperties && this.postMixInProperties();
			
			// Apply id to widget and domNode,
			// from incoming node, widget params, or autogenerated.
			this.id = domNode.id = domNode.id || this.id || generateId();
			
			// Perform initial rendering, and apply classes if any were specified.
			this.buildRendering();
			if(cls){ setClass.call(this, cls); }
			
			this.postCreate && this.postCreate();
			
			// remove srcNodeRef instance property post-create
			delete this.srcNodeRef;
			// to preserve "it just works" behavior, call startup if we're visible
			if(this.domNode.offsetHeight){
				this.startup();
			}
		},
		buildRendering: function(){
			var domNode = this.domNode,
				self = this,
				headerNode, spacerNode, bodyNode, footerNode, isRTL;
			
			// Detect RTL on html/body nodes; taken from dojo/dom-geometry
			isRTL = this.isRTL = (document.body.dir || document.documentElement.dir ||
				document.body.style.direction).toLowerCase() == "rtl";
			
			// Clear out className (any pre-applied classes will be re-applied via the
			// class / className setter), then apply standard classes/attributes
			domNode.className = "";
			
			put(domNode, "[role=grid].ui-widget.dgrid.dgrid-" + this.listType);
			
			// Place header node (initially hidden if showHeader is false).
			headerNode = this.headerNode = put(domNode, 
				"div.dgrid-header.dgrid-header-row.ui-widget-header" +
				(this.showHeader ? "" : ".dgrid-header-hidden"));
			if( 0  || has("ie") < 8){
				spacerNode = put(domNode, "div.dgrid-spacer");
			}
			bodyNode = this.bodyNode = put(domNode, "div.dgrid-scroller");
			
			// firefox 4 until at least 10 adds overflow: auto elements to the tab index by default for some
			// reason; force them to be not tabbable
			bodyNode.tabIndex = -1;
			
			this.headerScrollNode = put(domNode, "div.dgrid-header-scroll.dgrid-scrollbar-width.ui-widget-header");
			
			// Place footer node (initially hidden if showFooter is false).
			footerNode = this.footerNode = put("div.dgrid-footer" +
				(this.showFooter ? "" : ".dgrid-footer-hidden"));
			put(domNode, footerNode);
			
			if(isRTL){
				domNode.className += " dgrid-rtl" + (has("webkit") ? "" : " dgrid-rtl-nonwebkit");
			}
			
			listen(bodyNode, "scroll", function(event){
				if(self.showHeader){
					// keep the header aligned with the body
					headerNode.scrollLeft = event.scrollLeft || bodyNode.scrollLeft;
				}
				// re-fire, since browsers are not consistent about propagation here
				event.stopPropagation();
				listen.emit(domNode, "scroll", {scrollTarget: bodyNode});
			});
			this.configStructure();
			this.renderHeader();
			
			this.contentNode = this.touchNode = put(this.bodyNode, "div.dgrid-content.ui-widget-content");
			// add window resize handler, with reference for later removal if needed
			this._listeners.push(this._resizeHandle = listen(window, "resize",
				miscUtil.throttleDelayed(winResizeHandler, this)));
		},
		startup: function(){
			// summary:
			//		Called automatically after postCreate if the component is already
			//		visible; otherwise, should be called manually once placed.
			
			if(this._started){ return; } // prevent double-triggering
			this.inherited(arguments);
			this._started = true;
			this.resize();
			// apply sort (and refresh) now that we're ready to render
			this.set("sort", this._sort);
		},
		
		configStructure: function(){
			// does nothing in List, this is more of a hook for the Grid
		},
		resize: function(){
			var
				bodyNode = this.bodyNode,
				headerNode = this.headerNode,
				footerNode = this.footerNode,
				headerHeight = headerNode.offsetHeight,
				footerHeight = this.showFooter ? footerNode.offsetHeight : 0,
				quirks =  0  || has("ie") < 7;
			
			this.headerScrollNode.style.height = bodyNode.style.marginTop = headerHeight + "px";
			bodyNode.style.marginBottom = footerHeight + "px";
			
			if(quirks){
				// in IE6 and quirks mode, the "bottom" CSS property is ignored.
				// We guard against negative values in case of issues with external CSS.
				bodyNode.style.height = ""; // reset first
				bodyNode.style.height =
					Math.max((this.domNode.offsetHeight - headerHeight - footerHeight), 0) + "px";
				if (footerHeight) {
					// Work around additional glitch where IE 6 / quirks fails to update
					// the position of the bottom-aligned footer; this jogs its memory.
					footerNode.style.bottom = '1px';
					setTimeout(function(){ footerNode.style.bottom = ''; }, 0);
				}
			}
			
			if(!scrollbarWidth){
				// Measure the browser's scrollbar width using a DIV we'll delete right away
				scrollbarWidth = has("dom-scrollbar-width");
				scrollbarHeight = has("dom-scrollbar-height");
				
				// Avoid issues with certain widgets inside in IE7, and
				// ColumnSet scroll issues with all supported IE versions
				if(has("ie")){
					scrollbarWidth++;
					scrollbarHeight++;
				}
				
				// add rules that can be used where scrollbar width/height is needed
				miscUtil.addCssRule(".dgrid-scrollbar-width", "width: " + scrollbarWidth + "px");
				miscUtil.addCssRule(".dgrid-scrollbar-height", "height: " + scrollbarHeight + "px");
				
				if(scrollbarWidth != 17 && !quirks){
					// for modern browsers, we can perform a one-time operation which adds
					// a rule to account for scrollbar width in all grid headers.
					miscUtil.addCssRule(".dgrid-header", "right: " + scrollbarWidth + "px");
					// add another for RTL grids
					miscUtil.addCssRule(".dgrid-rtl-nonwebkit .dgrid-header", "left: " + scrollbarWidth + "px");
				}
			}
			
			if(quirks){
				// old IE doesn't support left + right + width:auto; set width directly
				headerNode.style.width = bodyNode.clientWidth + "px";
				setTimeout(function(){
					// sync up (after the browser catches up with the new width)
					headerNode.scrollLeft = bodyNode.scrollLeft;
				}, 0);
			}
		},
		
		addCssRule: function(selector, css){
			// summary:
			//		Version of util/misc.addCssRule which tracks added rules and removes
			//		them when the List is destroyed.
			
			var rule = miscUtil.addCssRule(selector, css);
			if(this.cleanAddedRules){
				// Although this isn't a listener, it shares the same remove contract
				this._listeners.push(rule);
			}
			return rule;
		},
		
		on: function(eventType, listener){
			// delegate events to the domNode
			var signal = listen(this.domNode, eventType, listener);
			if(!has("dom-addeventlistener")){
				this._listeners.push(signal);
			}
			return signal;
		},
		
		cleanup: function(){
			// summary:
			//		Clears out all rows currently in the list.
			
			var observers = this.observers,
				i;
			for(i in this._rowIdToObject){
				if(this._rowIdToObject[i] != this.columns){
					var rowElement = byId(i);
					if(rowElement){
						this.removeRow(rowElement, true);
					}
				}
			}
			// remove any store observers
			for(i = 0;i < observers.length; i++){
				var observer = observers[i];
				observer && observer.cancel();
			}
			this.observers = [];
			this.preload = null;
		},
		destroy: function(){
			// summary:
			//		Destroys this grid
			
			// Remove any event listeners and other such removables
			if(this._listeners){ // Guard against accidental subsequent calls to destroy
				for(var i = this._listeners.length; i--;){
					this._listeners[i].remove();
				}
				delete this._listeners;
			}
			
			this.cleanup();
			// destroy DOM
			put(this.domNode, "!");
		},
		refresh: function(){
			// summary:
			//		refreshes the contents of the grid
			this.cleanup();
			this._rowIdToObject = {};
			this._autoId = 0;
			
			// make sure all the content has been removed so it can be recreated
			this.contentNode.innerHTML = "";
			// Ensure scroll position always resets (especially for TouchScroll).
			this.scrollTo({ x: 0, y: 0 });
		},
		
		newRow: function(object, parentNode, beforeNode, i, options){
			if(parentNode){
				var row = this.insertRow(object, parentNode, beforeNode, i, options);
				put(row, ".ui-state-highlight");
				setTimeout(function(){
					put(row, "!ui-state-highlight");
				}, 250);
				return row;
			}
		},
		adjustRowIndices: function(firstRow){
			if(this.maintainOddEven){
				// this traverses through rows to maintain odd/even classes on the rows when indexes shift;
				var next = firstRow;
				var rowIndex = next.rowIndex;
				if(rowIndex > -1){ // make sure we have a real number in case this is called on a non-row
					do{
						if(next.rowIndex > -1){
							// skip non-numeric, non-rows
							if((next.className + ' ').indexOf("dgrid-row ") > -1){
								put(next, '.' + (rowIndex % 2 == 1 ? oddClass : evenClass) + '!' + (rowIndex % 2 == 0 ? oddClass : evenClass));
							}
							next.rowIndex = rowIndex++;
						}
					}while((next = next.nextSibling) && next.rowIndex != rowIndex && !next.blockRowIndex);
				}
			}
		},
		renderArray: function(results, beforeNode, options){
			// summary:
			//		This renders an array or collection of objects as rows in the grid, before the
			//		given node. This will listen for changes in the collection if an observe method
			//		is available (as it should be if it comes from an Observable data store).
			options = options || {};
			var self = this,
				start = options.start || 0,
				row, rows, container;
			
			if(!beforeNode){
				this._lastCollection = results;
			}
			if(results.observe){
				// observe the results for changes
				var observerIndex = this.observers.push(results.observe(function(object, from, to){
					var firstRow, nextNode, parentNode;
					// a change in the data took place
					if(from > -1 && rows[from]){
						// remove from old slot
						row = rows.splice(from, 1)[0];
						// check to make the sure the node is still there before we try to remove it, (in case it was moved to a different place in the DOM)
						if(row.parentNode == container){
							firstRow = row.nextSibling;
							if(firstRow){ // it's possible for this to have been already removed if it is in overlapping query results
								if(from != to){ // if from and to are identical, it is an in-place update and we don't want to alter the rowIndex at all
									firstRow.rowIndex--; // adjust the rowIndex so adjustRowIndices has the right starting point
								}
							}
							self.removeRow(row); // now remove
						}
						// the removal of rows could cause us to need to page in more items
						if(self._processScroll){
							self._processScroll();
						}
					}
					if(to > -1){
						// Add to new slot (either before an existing row, or at the end)
						// First determine the DOM node that this should be placed before.
						nextNode = rows[to];
						if(!nextNode){
							nextNode = rows[to - 1];
							if(nextNode){
								// Make sure to skip connected nodes, so we don't accidentally
								// insert a row in between a parent and its children.
								nextNode = (nextNode.connected || nextNode).nextSibling;
							}
						}
						parentNode = (beforeNode && beforeNode.parentNode) ||
							(nextNode && nextNode.parentNode) || self.contentNode;
						row = self.newRow(object, parentNode, nextNode, options.start + to, options);
						
						if(row){
							row.observerIndex = observerIndex;
							rows.splice(to, 0, row);
							if(!firstRow || to < from){
								// the inserted row is first, so we update firstRow to point to it
								var previous = row.previousSibling;
								// if we are not in sync with the previous row, roll the firstRow back one so adjustRowIndices can sync everything back up.
								firstRow = !previous || previous.rowIndex + 1 == row.rowIndex || row.rowIndex == 0 ?
									row : previous;
							}
						}
						options.count++;
					}
					from != to && firstRow && self.adjustRowIndices(firstRow);
					self._onNotification(rows, object, from, to);
				}, true)) - 1;
			}
			var rowsFragment = document.createDocumentFragment();
			// now render the results
			if(results.map){
				rows = results.map(mapEach, console.error);
				if(rows.then){
					return rows.then(whenDone);
				}
			}else{
				rows = [];
				for(var i = 0, l = results.length; i < l; i++){
					rows[i] = mapEach(results[i]);
				}
			}
			var lastRow;
			function mapEach(object){
				lastRow = self.insertRow(object, rowsFragment, null, start++, options);
				lastRow.observerIndex = observerIndex;
				return lastRow;
			}
			function whenDone(resolvedRows){
				container = beforeNode ? beforeNode.parentNode : self.contentNode;
				if(container){
					container.insertBefore(rowsFragment, beforeNode || null);
					lastRow = resolvedRows[resolvedRows.length - 1];
					lastRow && self.adjustRowIndices(lastRow);
				}
				return (rows = resolvedRows);
			}
			return whenDone(rows);
		},

		_onNotification: function(rows, object, from, to){
			// summary:
			//		Protected method called whenever a store notification is observed.
			//		Intended to be extended as necessary by mixins/extensions.
		},

		renderHeader: function(){
			// no-op in a plain list
		},
		
		_autoId: 0,
		insertRow: function(object, parent, beforeNode, i, options){
			// summary:
			//		Creates a single row in the grid.
			
			// Include parentId within row identifier if one was specified in options.
			// (This is used by tree to allow the same object to appear under
			// multiple parents.)
			var parentId = options.parentId,
				id = this.id + "-row-" + (parentId ? parentId + "-" : "") + 
					((this.store && this.store.getIdentity) ? 
						this.store.getIdentity(object) : this._autoId++),
				row = byId(id),
				previousRow = row && row.previousSibling;
		
			if(row){// if it existed elsewhere in the DOM, we will remove it, so we can recreate it
				this.removeRow(row);
			}
			row = this.renderRow(object, options);
			row.className = (row.className || "") + " ui-state-default dgrid-row " + (i % 2 == 1 ? oddClass : evenClass);
			// get the row id for easy retrieval
			this._rowIdToObject[row.id = id] = object;
			parent.insertBefore(row, beforeNode || null);
			if(previousRow){
				// in this case, we are pulling the row from another location in the grid, and we need to readjust the rowIndices from the point it was removed
				this.adjustRowIndices(previousRow);
			}
			row.rowIndex = i;
			return row;
		},
		renderRow: function(value, options){
			// summary:
			//		Responsible for returning the DOM for a single row in the grid.
			
			return put("div", "" + value);
		},
		removeRow: function(rowElement, justCleanup){
			// summary:
			//		Simply deletes the node in a plain List.
			//		Column plugins may aspect this to implement their own cleanup routines.
			// rowElement: Object|DOMNode
			//		Object or element representing the row to be removed.
			// justCleanup: Boolean
			//		If true, the row element will not be removed from the DOM; this can
			//		be used by extensions/plugins in cases where the DOM will be
			//		massively cleaned up at a later point in time.
			
			rowElement = rowElement.element || rowElement;
			delete this._rowIdToObject[rowElement.id];
			if(!justCleanup){
				put(rowElement, "!");
			}
		},
		
		row: function(target){
			// summary:
			//		Get the row object by id, object, node, or event
			var id;
			
			if(target instanceof this._Row){ return target; } // no-op; already a row
			
			if(target.target && target.target.nodeType){
				// event
				target = target.target;
			}
			if(target.nodeType){
				var object;
				do{
					var rowId = target.id;
					if((object = this._rowIdToObject[rowId])){
						return new this._Row(rowId.substring(this.id.length + 5), object, target); 
					}
					target = target.parentNode;
				}while(target && target != this.domNode);
				return;
			}
			if(typeof target == "object"){
				// assume target represents a store item
				id = this.store.getIdentity(target);
			}else{
				// assume target is a row ID
				id = target;
				target = this._rowIdToObject[this.id + "-row-" + id];
			}
			return new this._Row(id, target, byId(this.id + "-row-" + id));
		},
		cell: function(target){
			// this doesn't do much in a plain list
			return {
				row: this.row(target)
			};
		},
		
		_move: function(item, steps, targetClass, visible){
			var nextSibling, current, element;
			// Start at the element indicated by the provided row or cell object.
			element = current = item.element;
			steps = steps || 1;
			
			do{
				// Outer loop: move in the appropriate direction.
				if((nextSibling = current[steps < 0 ? "previousSibling" : "nextSibling"])){
					do{
						// Inner loop: advance, and dig into children if applicable.
						current = nextSibling;
						if(current && (current.className + " ").indexOf(targetClass + " ") > -1){
							// Element with the appropriate class name; count step, stop digging.
							element = current;
							steps += steps < 0 ? 1 : -1;
							break;
						}
						// If the next sibling isn't a match, drill down to search, unless
						// visible is true and children are hidden.
					}while((nextSibling = (!visible || !current.hidden) && current[steps < 0 ? "lastChild" : "firstChild"]));
				}else{
					current = current.parentNode;
					if(current === this.bodyNode || current === this.headerNode){
						// Break out if we step out of the navigation area entirely.
						break;
					}
				}
			}while(steps);
			// Return the final element we arrived at, which might still be the
			// starting element if we couldn't navigate further in that direction.
			return element;
		},
		
		up: function(row, steps, visible){
			// summary:
			//		Returns the row that is the given number of steps (1 by default)
			//		above the row represented by the given object.
			// row:
			//		The row to navigate upward from.
			// steps:
			//		Number of steps to navigate up from the given row; default is 1.
			// visible:
			//		If true, rows that are currently hidden (i.e. children of
			//		collapsed tree rows) will not be counted in the traversal.
			// returns:
			//		A row object representing the appropriate row.  If the top of the
			//		list is reached before the given number of steps, the first row will
			//		be returned.
			if(!row.element){ row = this.row(row); }
			return this.row(this._move(row, -(steps || 1), "dgrid-row", visible));
		},
		down: function(row, steps, visible){
			// summary:
			//		Returns the row that is the given number of steps (1 by default)
			//		below the row represented by the given object.
			// row:
			//		The row to navigate downward from.
			// steps:
			//		Number of steps to navigate down from the given row; default is 1.
			// visible:
			//		If true, rows that are currently hidden (i.e. children of
			//		collapsed tree rows) will not be counted in the traversal.
			// returns:
			//		A row object representing the appropriate row.  If the bottom of the
			//		list is reached before the given number of steps, the last row will
			//		be returned.
			if(!row.element){ row = this.row(row); }
			return this.row(this._move(row, steps || 1, "dgrid-row", visible));
		},
		
		scrollTo: has("touch") ? function(){
			// If TouchScroll is the superclass, defer to its implementation.
			return this.inherited(arguments);
		} : function(options){
			// No TouchScroll; simple implementation which sets scrollLeft/Top.
			if(typeof options.x !== "undefined"){
				this.bodyNode.scrollLeft = options.x;
			}
			if(typeof options.y !== "undefined"){
				this.bodyNode.scrollTop = options.y;
			}
		},
		
		getScrollPosition: has("touch") ? function(){
			// If TouchScroll is the superclass, defer to its implementation.
			return this.inherited(arguments);
		} : function(){
			// No TouchScroll; return based on scrollLeft/Top.
			return {
				x: this.bodyNode.scrollLeft,
				y: this.bodyNode.scrollTop
			};
		},
		
		get: function(/*String*/ name /*, ... */){
			// summary:
			//		Get a property on a List instance.
			//	name:
			//		The property to get.
			//	returns:
			//		The property value on this List instance.
			// description:
			//		Get a named property on a List object. The property may
			//		potentially be retrieved via a getter method in subclasses. In the base class
			//		this just retrieves the object's property.
			
			var fn = "_get" + name.charAt(0).toUpperCase() + name.slice(1);
			
			if(typeof this[fn] === "function"){
				return this[fn].apply(this, [].slice.call(arguments, 1));
			}
			
			// Alert users that try to use Dijit-style getter/setters so they don’t get confused
			// if they try to use them and it does not work
			if(! 1  && typeof this[fn + "Attr"] === "function"){
				console.warn("dgrid: Use " + fn + " instead of " + fn + "Attr for getting " + name);
			}
			
			return this[name];
		},
		
		set: function(/*String*/ name, /*Object*/ value /*, ... */){
			//	summary:
			//		Set a property on a List instance
			//	name:
			//		The property to set.
			//	value:
			//		The value to set in the property.
			//	returns:
			//		The function returns this List instance.
			//	description:
			//		Sets named properties on a List object.
			//		A programmatic setter may be defined in subclasses.
			//
			//		set() may also be called with a hash of name/value pairs, ex:
			//	|	myObj.set({
			//	|		foo: "Howdy",
			//	|		bar: 3
			//	|	})
			//		This is equivalent to calling set(foo, "Howdy") and set(bar, 3)
			
			if(typeof name === "object"){
				for(var k in name){
					this.set(k, name[k]);
				}
			}else{
				var fn = "_set" + name.charAt(0).toUpperCase() + name.slice(1);
				
				if(typeof this[fn] === "function"){
					this[fn].apply(this, [].slice.call(arguments, 1));
				}else{
					// Alert users that try to use Dijit-style getter/setters so they don’t get confused
					// if they try to use them and it does not work
					if(! 1  && typeof this[fn + "Attr"] === "function"){
						console.warn("dgrid: Use " + fn + " instead of " + fn + "Attr for setting " + name);
					}
					
					this[name] = value;
				}
			}
			
			return this;
		},
		
		// Accept both class and className programmatically to set domNode class.
		_getClass: getClass,
		_setClass: setClass,
		_getClassName: getClass,
		_setClassName: setClass,
		
		_setSort: function(property, descending){
			// summary:
			//		Sort the content
			// property: String|Array
			//		String specifying field to sort by, or actual array of objects
			//		with attribute and descending properties
			// descending: boolean
			//		In the case where property is a string, this argument
			//		specifies whether to sort ascending (false) or descending (true)
			
			this._sort = typeof property != "string" ? property :
				[{attribute: property, descending: descending}];
			
			this.refresh();
			
			if(this._lastCollection){
				if(property.length){
					// if an array was passed in, flatten to just first sort attribute
					// for default array sort logic
					if(typeof property != "string"){
						descending = property[0].descending;
						property = property[0].attribute;
					}
					
					this._lastCollection.sort(function(a,b){
						var aVal = a[property], bVal = b[property];
						// fall back undefined values to "" for more consistent behavior
						if(aVal === undefined){ aVal = ""; }
						if(bVal === undefined){ bVal = ""; }
						return aVal == bVal ? 0 : (aVal > bVal == !descending ? 1 : -1);
					});
				}
				this.renderArray(this._lastCollection);
			}
		},
		// TODO: remove the following two (and rename _sort to sort) in 1.0
		sort: function(property, descending){
			kernel.deprecated("sort(...)", 'use set("sort", ...) instead', "dgrid 1.0");
			this.set("sort", property, descending);
		},
		_getSort: function(){
			return this._sort;
		},
		
		_setShowHeader: function(show){
			// this is in List rather than just in Grid, primarily for two reasons:
			// (1) just in case someone *does* want to show a header in a List
			// (2) helps address IE < 8 header display issue in List
			
			var headerNode = this.headerNode;
			
			this.showHeader = show;
			
			// add/remove class which has styles for "hiding" header
			put(headerNode, (show ? "!" : ".") + "dgrid-header-hidden");
			
			this.renderHeader();
			this.resize(); // resize to account for (dis)appearance of header
			
			if(show){
				// Update scroll position of header to make sure it's in sync.
				headerNode.scrollLeft = this.getScrollPosition().x;
			}
		},
		setShowHeader: function(show){
			kernel.deprecated("setShowHeader(...)", 'use set("showHeader", ...) instead', "dgrid 1.0");
			this.set("showHeader", show);
		},
		
		_setShowFooter: function(show){
			this.showFooter = show;
			
			// add/remove class which has styles for hiding footer
			put(this.footerNode, (show ? "!" : ".") + "dgrid-footer-hidden");
			
			this.resize(); // to account for (dis)appearance of footer
		}
	});
});

},
'dgrid/util/misc':function(){
define(["put-selector/put"], function(put){
	// summary:
	//		This module defines miscellaneous utility methods for purposes of
	//		adding styles, and throttling/debouncing function calls.
	
	// establish an extra stylesheet which addCssRule calls will use,
	// plus an array to track actual indices in stylesheet for removal
	var extraRules = [],
		extraSheet,
		removeMethod,
		rulesProperty,
		invalidCssChars = /([^A-Za-z0-9_\u00A0-\uFFFF-])/g;
	
	function removeRule(index){
		// Function called by the remove method on objects returned by addCssRule.
		var realIndex = extraRules[index],
			i, l;
		if (realIndex === undefined) { return; } // already removed
		
		// remove rule indicated in internal array at index
		extraSheet[removeMethod](realIndex);
		
		// Clear internal array item representing rule that was just deleted.
		// NOTE: we do NOT splice, since the point of this array is specifically
		// to negotiate the splicing that occurs in the stylesheet itself!
		extraRules[index] = undefined;
		
		// Then update array items as necessary to downshift remaining rule indices.
		// Can start at index + 1, since array is sparse but strictly increasing.
		for(i = index + 1, l = extraRules.length; i < l; i++){
			if(extraRules[i] > realIndex){ extraRules[i]--; }
		}
	}
	
	var util = {
		defaultDelay: 15,
		throttle: function(cb, context, delay){
			// summary:
			//		Returns a function which calls the given callback at most once per
			//		delay milliseconds.  (Inspired by plugd)
			var ran = false;
			delay = delay || util.defaultDelay;
			return function(){
				if(ran){ return; }
				ran = true;
				cb.apply(context, arguments);
				setTimeout(function(){ ran = false; }, delay);
			};
		},
		throttleDelayed: function(cb, context, delay){
			// summary:
			//		Like throttle, except that the callback runs after the delay,
			//		rather than before it.
			var ran = false;
			delay = delay || util.defaultDelay;
			return function(){
				if(ran){ return; }
				ran = true;
				var a = arguments;
				setTimeout(function(){
					ran = false;
					cb.apply(context, a);
				}, delay);
			};
		},
		debounce: function(cb, context, delay){
			// summary:
			//		Returns a function which calls the given callback only after a
			//		certain time has passed without successive calls.  (Inspired by plugd)
			var timer;
			delay = delay || util.defaultDelay;
			return function(){
				if(timer){
					clearTimeout(timer);
					timer = null;
				}
				var a = arguments;
				timer = setTimeout(function(){
					cb.apply(context, a);
				}, delay);
			};
		},
		
		addCssRule: function(selector, css){
			// summary:
			//		Dynamically adds a style rule to the document.  Returns an object
			//		with a remove method which can be called to later remove the rule.
			
			if(!extraSheet){
				// First time, create an extra stylesheet for adding rules
				extraSheet = put(document.getElementsByTagName("head")[0], "style");
				// Keep reference to actual StyleSheet object (`styleSheet` for IE < 9)
				extraSheet = extraSheet.sheet || extraSheet.styleSheet;
				// Store name of method used to remove rules (`removeRule` for IE < 9)
				removeMethod = extraSheet.deleteRule ? "deleteRule" : "removeRule";
				// Store name of property used to access rules (`rules` for IE < 9)
				rulesProperty = extraSheet.cssRules ? "cssRules" : "rules";
			}
			
			var index = extraRules.length;
			extraRules[index] = (extraSheet.cssRules || extraSheet.rules).length;
			extraSheet.addRule ?
				extraSheet.addRule(selector, css) :
				extraSheet.insertRule(selector + '{' + css + '}', extraRules[index]);
			
			return {
				get: function(prop) {
					return extraSheet[rulesProperty][extraRules[index]].style[prop];
				},
				set: function(prop, value) {
					if (typeof extraRules[index] !== "undefined") {
						extraSheet[rulesProperty][extraRules[index]].style[prop] = value;
					}
				},
				remove: function(){
					removeRule(index);
				}
			};
		},
		
		escapeCssIdentifier: function(id){
			// summary:
			//		Escapes normally-invalid characters in a CSS identifier (such as .);
			//		see http://www.w3.org/TR/CSS2/syndata.html#value-def-identifier
			// id: String
			//		CSS identifier (e.g. tag name, class, or id) to be escaped
			
			return id.replace(invalidCssChars, "\\$1");
		}
	};
	return util;
});
},
'xstyle/has-class':function(){
define(["dojo/has"], function(has){
	var tested = {};
	return function(){
		var test, args = arguments;
		for(var i = 0; i < args.length; i++){
			var test = args[i];
			if(!tested[test]){
				tested[test] = true;
				var parts = test.match(/^(no-)?(.+?)((-[\d\.]+)(-[\d\.]+)?)?$/), // parse the class name
					hasResult = has(parts[2]), // the actual has test
					lower = -parts[4]; // lower bound if it is in the form of test-4 or test-4-6 (would be 4)
				if((lower > 0 ? lower <= hasResult && (-parts[5] || lower) >= hasResult :  // if it has a range boundary, compare to see if we are in it
						!!hasResult) == !parts[1]){ // parts[1] is the no- prefix that can negate the result
					document.documentElement.className += ' has-' + test;
				}
			}
		}
	}
});
},
'xstyle/css':function(){
define(["require"], function(moduleRequire){
"use strict";
/*
 * AMD css! plugin
 * This plugin will load and wait for css files.  This could be handy when
 * loading css files as part of a layer or as a way to apply a run-time theme. This
 * module checks to see if the CSS is already loaded before incurring the cost
 * of loading the full CSS loader codebase
 */
 	function testElementStyle(tag, id, property){
 		// test an element's style
		var docElement = document.documentElement;
		var testDiv = docElement.insertBefore(document.createElement(tag), docElement.firstChild);
		testDiv.id = id;
		var styleValue = (testDiv.currentStyle || getComputedStyle(testDiv, null))[property];
		docElement.removeChild(testDiv);
 		return styleValue;
 	} 
 	return {
		load: function(resourceDef, require, callback, config) {
			var url = require.toUrl(resourceDef);
			var cachedCss = require.cache['url:' + url];
			if(cachedCss){
				// we have CSS cached inline in the build
				if(cachedCss.xCss){
					var parser = cachedCss.parser;
					var xCss =cachedCss.xCss;
					cachedCss = cachedCss.cssText;
				}
				moduleRequire(['./util/createStyleSheet'],function(createStyleSheet){
					createStyleSheet(cachedCss);
				});
				if(xCss){
					//require([parsed], callback);
				}
				return checkForParser();
			}
			function checkForParser(){
				var parser = testElementStyle('x-parse', null, 'content');
				if(parser && parser != 'none'){
					// TODO: wait for parser to load
					require([eval(parser)], callback);
				}else{
					callback();
				}
			}
			
			// if there is an id test available, see if the referenced rule is already loaded,
			// and if so we can completely avoid any dynamic CSS loading. If it is
			// not present, we need to use the dynamic CSS loader.
			var displayStyle = testElementStyle('div', resourceDef.replace(/\//g,'-').replace(/\..*/,'') + "-loaded", 'display');
			if(displayStyle == "none"){
				return checkForParser();
			}
			// use dynamic loader
			moduleRequire(["./load-css"], function(load){
				load(url, checkForParser);
			});
		}
	};
});

},
'dgrid/OnDemandList':function(){
define(["./List", "./_StoreMixin", "dojo/_base/declare", "dojo/_base/lang", "dojo/_base/Deferred", "dojo/on", "./util/misc", "put-selector/put"],
function(List, _StoreMixin, declare, lang, Deferred, listen, miscUtil, put){

return declare([List, _StoreMixin], {
	// summary:
	//		Extends List to include virtual scrolling functionality, querying a
	//		dojo/store instance for the appropriate range when the user scrolls.
	
	// minRowsPerPage: Integer
	//		The minimum number of rows to request at one time.
	minRowsPerPage: 25,
	
	// maxRowsPerPage: Integer
	//		The maximum number of rows to request at one time.
	maxRowsPerPage: 250,
	
	// maxEmptySpace: Integer
	//		Defines the maximum size (in pixels) of unrendered space below the
	//		currently-rendered rows. Setting this to less than Infinity can be useful if you
	//		wish to limit the initial vertical scrolling of the grid so that the scrolling is
	// 		not excessively sensitive. With very large grids of data this may make scrolling
	//		easier to use, albiet it can limit the ability to instantly scroll to the end.
	maxEmptySpace: Infinity,	
	
	// bufferRows: Integer
	//	  The number of rows to keep ready on each side of the viewport area so that the user can
	//	  perform local scrolling without seeing the grid being built. Increasing this number can
	//	  improve perceived performance when the data is being retrieved over a slow network.
	bufferRows: 10,
	
	// farOffRemoval: Integer
	//		Defines the minimum distance (in pixels) from the visible viewport area
	//		rows must be in order to be removed.  Setting to Infinity causes rows
	//		to never be removed.
	farOffRemoval: 2000,
	
	// queryRowsOverlap: Integer
	//		Indicates the number of rows to overlap queries. This helps keep
	//		continuous data when underlying data changes (and thus pages don't
	//		exactly align)
	queryRowsOverlap: 1,
	
	// pagingMethod: String
	//		Method (from dgrid/util/misc) to use to either throttle or debounce
	//		requests.  Default is "debounce" which will cause the grid to wait until
	//		the user pauses scrolling before firing any requests; can be set to
	//		"throttleDelayed" instead to progressively request as the user scrolls,
	//		which generally incurs more overhead but might appear more responsive.
	pagingMethod: "debounce",
	
	// pagingDelay: Integer
	//		Indicates the delay (in milliseconds) imposed upon pagingMethod, to wait
	//		before paging in more data on scroll events. This can be increased to
	//		reduce client-side overhead or the number of requests sent to a server.
	pagingDelay: miscUtil.defaultDelay,
	
	// keepScrollPosition: Boolean
	//		When refreshing the list, controls whether the scroll position is
	//		preserved, or reset to the top.  This can also be overridden for
	//		specific calls to refresh.
	keepScrollPosition: false,
	
	rowHeight: 22,
	
	postCreate: function(){
		this.inherited(arguments);
		var self = this;
		// check visibility on scroll events
		listen(this.bodyNode, "scroll",
			miscUtil[this.pagingMethod](function(event){ self._processScroll(event); },
				null, this.pagingDelay));
	},
	
	renderQuery: function(query, preloadNode, options){
		// summary:
		//		Creates a preload node for rendering a query into, and executes the query
		//		for the first page of data. Subsequent data will be downloaded as it comes
		//		into view.
		var self = this,
			preload = {
				query: query,
				count: 0,
				node: preloadNode,
				options: options
			},
			priorPreload = this.preload,
			results;
		
		if(!preloadNode){
			// Initial query; set up top and bottom preload nodes
			var topPreload = {
				node: put(this.contentNode, "div.dgrid-preload", {
					rowIndex: 0
				}),
				count: 0,
				query: query,
				next: preload,
				options: options
			};
			topPreload.node.style.height = "0";
			preload.node = preloadNode = put(this.contentNode, "div.dgrid-preload");
			preload.previous = topPreload;
		}
		// this preload node is used to represent the area of the grid that hasn't been
		// downloaded yet
		preloadNode.rowIndex = this.minRowsPerPage;

		if(priorPreload){
			// the preload nodes (if there are multiple) are represented as a linked list, need to insert it
			if((preload.next = priorPreload.next) && 
					// check to make sure that the current scroll position is below this preload
					this.bodyNode.scrollTop >= priorPreload.node.offsetTop){ 
				// the prior preload is above/before in the linked list
				preload.previous = priorPreload;
			}else{
				// the prior preload is below/after in the linked list
				preload.next = priorPreload;
				preload.previous = priorPreload.previous;
			}
			// adjust the previous and next links so the linked list is proper
			preload.previous.next = preload;
			preload.next.previous = preload; 
		}else{
			this.preload = preload;
		}
		
		var loadingNode = put(preloadNode, "-div.dgrid-loading"),
			innerNode = put(loadingNode, "div.dgrid-below");
		innerNode.innerHTML = this.loadingMessage;

		function errback(err) {
			// Used as errback for when calls;
			// remove the loadingNode and re-throw if an error was passed
			put(loadingNode, "!");
			
			if(err){
				if(self._refreshDeferred){
					self._refreshDeferred.reject(err);
					delete self._refreshDeferred;
				}
				throw err;
			}
		}

		// Establish query options, mixing in our own.
		// (The getter returns a delegated object, so simply using mixin is safe.)
		options = lang.mixin(this.get("queryOptions"), options, 
			{start: 0, count: this.minRowsPerPage, query: query});
		
		// Protect the query within a _trackError call, but return the QueryResults
		this._trackError(function(){ return results = query(options); });
		
		if(typeof results === "undefined"){
			// Synchronous error occurred (but was caught by _trackError)
			errback();
			return;
		}
		
		// Render the result set
		Deferred.when(self.renderArray(results, preloadNode, options), function(trs){
			return Deferred.when(results.total || results.length, function(total){
				// remove loading node
				put(loadingNode, "!");
				// now we need to adjust the height and total count based on the first result set
				var trCount = trs.length;
				if(total === 0){
					self.noDataNode = put(self.contentNode, "div.dgrid-no-data");
					self.noDataNode.innerHTML = self.noDataMessage;
				}
				var height = 0;
				for(var i = 0; i < trCount; i++){
					height += self._calcRowHeight(trs[i]);
				}
				// only update rowHeight if we actually got results and are visible
				if(trCount && height){ self.rowHeight = height / trCount; }
				
				total -= trCount;
				preload.count = total;
				preloadNode.rowIndex = trCount;
				if(total){
					preloadNode.style.height = Math.min(total * self.rowHeight, self.maxEmptySpace) + "px";
				}else{
					// if total is 0, IE quirks mode can't handle 0px height for some reason, I don't know why, but we are setting display: none for now
					preloadNode.style.display = "none";
				}
				
				if (self._previousScrollPosition) {
					// Restore position after a refresh operation w/ keepScrollPosition
					self.scrollTo(self._previousScrollPosition);
					delete self._previousScrollPosition;
				}
				
				// Redo scroll processing in case the query didn't fill the screen,
				// or in case scroll position was restored
				self._processScroll();
				
				// If _refreshDeferred is still defined after calling _processScroll,
				// resolve it now (_processScroll will remove it and resolve it itself
				// otherwise)
				if(self._refreshDeferred){
					self._refreshDeferred.resolve(results);
					delete self._refreshDeferred;
				}
				
				return trs;
			}, errback);
		}, errback);
		
		return results;
	},
	
	refresh: function(options){
		// summary:
		//		Refreshes the contents of the grid.
		// options: Object?
		//		Optional object, supporting the following parameters:
		//		* keepScrollPosition: like the keepScrollPosition instance property;
		//			specifying it in the options here will override the instance
		//			property's value for this specific refresh call only.
		
		var self = this,
			keep = (options && options.keepScrollPosition),
			dfd, results;
		
		// Fall back to instance property if option is not defined
		if(typeof keep === "undefined"){ keep = this.keepScrollPosition; }
		
		// Store scroll position to be restored after new total is received
		if(keep){ this._previousScrollPosition = this.getScrollPosition(); }
		
		this.inherited(arguments);
		if(this.store){
			// render the query
			dfd = this._refreshDeferred = new Deferred();
			
			// renderQuery calls _trackError internally
			results = self.renderQuery(function(queryOptions){
				return self.store.query(self.query, queryOptions);
			});
			if(typeof results === "undefined"){
				// Synchronous error occurred; reject the refresh promise.
				dfd.reject();
			}
			
			// Internally, _refreshDeferred will always be resolved with an object
			// containing `results` (QueryResults) and `rows` (the rendered rows);
			// externally the promise will resolve simply with the QueryResults, but
			// the event will be emitted with both under respective properties.
			return dfd.then(function(results){
				// Emit on a separate turn to enable event to be used consistently for
				// initial render, regardless of whether the backing store is async
				setTimeout(function() {
					listen.emit(self.domNode, "dgrid-refresh-complete", {
						bubbles: true,
						cancelable: false,
						grid: self,
						results: results // QueryResults object (may be a wrapped promise)
					});
				}, 0);
				
				// Delete the Deferred immediately so nothing tries to re-resolve
				delete self._refreshDeferred;
				
				// Resolve externally with just the QueryResults
				return results;
			}, function(err){
				delete self._refreshDeferred;
				throw err;
			});
		}
	},
	
	resize: function(){
		this.inherited(arguments);
		this._processScroll();
	},
	
	_calcRowHeight: function(rowElement){
		// summary:
		//		Calculate the height of a row. This is a method so it can be overriden for
		//		plugins that add connected elements to a row, like the tree
		
		var sibling = rowElement.previousSibling;
		return sibling && sibling.offsetTop != rowElement.offsetTop ?
			rowElement.offsetHeight : 0;
	},
	
	lastScrollTop: 0,
	_processScroll: function(evt){
		// summary:
		//		Checks to make sure that everything in the viewable area has been
		//		downloaded, and triggering a request for the necessary data when needed.
		var grid = this,
			scrollNode = grid.bodyNode,
			// grab current visible top from event if provided, otherwise from node
			visibleTop = (evt && evt.scrollTop) || this.getScrollPosition().y,
			visibleBottom = scrollNode.offsetHeight + visibleTop,
			priorPreload, preloadNode, preload = grid.preload,
			lastScrollTop = grid.lastScrollTop,
			requestBuffer = grid.bufferRows * grid.rowHeight,
			searchBuffer = requestBuffer - grid.rowHeight, // Avoid rounding causing multiple queries
			// References related to emitting dgrid-refresh-complete if applicable
			refreshDfd,
			lastResults,
			lastRows;
		
		// XXX: I do not know why this happens.
		// munging the actual location of the viewport relative to the preload node by a few pixels in either
		// direction is necessary because at least WebKit on Windows seems to have an error that causes it to
		// not quite get the entire element being focused in the viewport during keyboard navigation,
		// which means it becomes impossible to load more data using keyboard navigation because there is
		// no more data to scroll to to trigger the fetch.
		// 1 is arbitrary and just gets it to work correctly with our current test cases; don’t wanna go
		// crazy and set it to a big number without understanding more about what is going on.
		// wondering if it has to do with border-box or something, but changing the border widths does not
		// seem to make it break more or less, so I do not know…
		var mungeAmount = 1;
		
		grid.lastScrollTop = visibleTop;

		function removeDistantNodes(preload, distanceOff, traversal, below){
			// we check to see the the nodes are "far off"
			var farOffRemoval = grid.farOffRemoval,
				preloadNode = preload.node;
			// by checking to see if it is the farOffRemoval distance away
			if(distanceOff > 2 * farOffRemoval){
				// ok, there is preloadNode that is far off, let's remove rows until we get to in the current viewpoint
				var row, nextRow = preloadNode[traversal];
				var reclaimedHeight = 0;
				var count = 0;
				var toDelete = [];
				while((row = nextRow)){
					var rowHeight = grid._calcRowHeight(row);
					if(reclaimedHeight + rowHeight + farOffRemoval > distanceOff || (nextRow.className.indexOf("dgrid-row") < 0 && nextRow.className.indexOf("dgrid-loading") < 0)){
						// we have reclaimed enough rows or we have gone beyond grid rows, let's call it good
						break;
					}
					var nextRow = row[traversal]; // have to do this before removing it
					var lastObserverIndex, currentObserverIndex = row.observerIndex;
					if(currentObserverIndex != lastObserverIndex && lastObserverIndex > -1){
						// we have gathered a whole page of observed rows, we can delete them now
						var observers = grid.observers; 
						var observer = observers[lastObserverIndex]; 
						observer && observer.cancel();
						observers[lastObserverIndex] = 0; // remove it so we don't call cancel twice
					}
					reclaimedHeight += rowHeight;
					count += row.count || 1;
					lastObserverIndex = currentObserverIndex;
					// we just do cleanup here, as we will do a more efficient node destruction in the setTimeout below
					grid.removeRow(row, true);
					toDelete.push(row);
				}
				// now adjust the preloadNode based on the reclaimed space
				preload.count += count;
				if(below){
					preloadNode.rowIndex -= count;
					adjustHeight(preload);
				}else{
					// if it is above, we can calculate the change in exact row changes, which we must do to not mess with the scrolling
					preloadNode.style.height = (preloadNode.offsetHeight + reclaimedHeight) + "px";
				}
				// we remove the elements after expanding the preload node so that the contraction doesn't alter the scroll position
				var trashBin = put("div", toDelete);
				setTimeout(function(){
					// we can defer the destruction until later
					put(trashBin, "!");
				},1);
			}
		}
		
		function adjustHeight(preload, noMax){
			preload.node.style.height = Math.min(preload.count * grid.rowHeight, noMax ? Infinity : grid.maxEmptySpace) + "px";
		}
		while(preload && !preload.node.offsetWidth){
			// skip past preloads that are not currently connected
			preload = preload.previous;
		}
		// there can be multiple preloadNodes (if they split, or multiple queries are created),
		//	so we can traverse them until we find whatever is in the current viewport, making
		//	sure we don't backtrack
		while(preload && preload != priorPreload){
			priorPreload = grid.preload;
			grid.preload = preload;
			preloadNode = preload.node;
			var preloadTop = preloadNode.offsetTop;
			var preloadHeight;
			
			if(visibleBottom + mungeAmount + searchBuffer < preloadTop){
				// the preload is below the line of sight
				do{
					preload = preload.previous;
				}while(preload && !preload.node.offsetWidth); // skip past preloads that are not currently connected
			}else if(visibleTop - mungeAmount - searchBuffer > (preloadTop + (preloadHeight = preloadNode.offsetHeight))){
				// the preload is above the line of sight
				do{
					preload = preload.next;
				}while(preload && !preload.node.offsetWidth);// skip past preloads that are not currently connected
			}else{
				// the preload node is visible, or close to visible, better show it
				var offset = ((preloadNode.rowIndex ? visibleTop - requestBuffer : visibleBottom) - preloadTop) / grid.rowHeight;
				var count = (visibleBottom - visibleTop + 2 * requestBuffer) / grid.rowHeight;
				// utilize momentum for predictions
				var momentum = Math.max(Math.min((visibleTop - lastScrollTop) * grid.rowHeight, grid.maxRowsPerPage/2), grid.maxRowsPerPage/-2);
				count += Math.min(Math.abs(momentum), 10);
				if(preloadNode.rowIndex == 0){
					// at the top, adjust from bottom to top
					offset -= count;
				}
				offset = Math.max(offset, 0);
				if(offset < 10 && offset > 0 && count + offset < grid.maxRowsPerPage){
					// connect to the top of the preloadNode if possible to avoid excessive adjustments
					count += Math.max(0, offset);
					offset = 0;
				}
				count = Math.min(Math.max(count, grid.minRowsPerPage),
									grid.maxRowsPerPage, preload.count);
				if(count == 0){
					return;
				}
				count = Math.ceil(count);
				offset = Math.min(Math.floor(offset), preload.count - count);
				var options = lang.mixin(grid.get("queryOptions"), preload.options);
				preload.count -= count;
				var beforeNode = preloadNode,
					keepScrollTo, queryRowsOverlap = grid.queryRowsOverlap,
					below = preloadNode.rowIndex > 0 && preload; 
				if(below){
					// add new rows below
					var previous = preload.previous;
					if(previous){
						removeDistantNodes(previous, visibleTop - (previous.node.offsetTop + previous.node.offsetHeight), 'nextSibling');
						if(offset > 0 && previous.node == preloadNode.previousSibling){
							// all of the nodes above were removed
							offset = Math.min(preload.count, offset);
							preload.previous.count += offset;
							adjustHeight(preload.previous, true);
							preloadNode.rowIndex += offset;
							queryRowsOverlap = 0;
						}else{
							count += offset;
						}
						preload.count -= offset;
					}
					options.start = preloadNode.rowIndex - queryRowsOverlap;
					preloadNode.rowIndex += count;
				}else{
					// add new rows above
					if(preload.next){
						// remove out of sight nodes first
						removeDistantNodes(preload.next, preload.next.node.offsetTop - visibleBottom, 'previousSibling', true);
						var beforeNode = preloadNode.nextSibling;
						if(beforeNode == preload.next.node){
							// all of the nodes were removed, can position wherever we want
							preload.next.count += preload.count - offset;
							preload.next.node.rowIndex = offset + count;
							adjustHeight(preload.next);
							preload.count = offset;
							queryRowsOverlap = 0;
						}else{
							keepScrollTo = true;
						}
						
					}
					options.start = preload.count;
				}
				options.count = Math.min(count + queryRowsOverlap, grid.maxRowsPerPage);
				if(keepScrollTo && beforeNode && beforeNode.offsetWidth){
					keepScrollTo = beforeNode.offsetTop;
				}

				adjustHeight(preload);
				// create a loading node as a placeholder while the data is loaded
				var loadingNode = put(beforeNode, "-div.dgrid-loading[style=height:" + count * grid.rowHeight + "px]"),
					innerNode = put(loadingNode, "div.dgrid-" + (below ? "below" : "above"));
				innerNode.innerHTML = grid.loadingMessage;
				loadingNode.count = count;
				loadingNode.blockRowIndex = true;
				// use the query associated with the preload node to get the next "page"
				options.query = preload.query;
				// Query now to fill in these rows.
				// Keep _trackError-wrapped results separate, since if results is a
				// promise, it will lose QueryResults functions when chained by `when`
				var results = preload.query(options),
					trackedResults = grid._trackError(function(){ return results; });
				
				if(trackedResults === undefined){
					// Sync query failed
					put(loadingNode, "!");
					return;
				}

				// Isolate the variables in case we make multiple requests
				// (which can happen if we need to render on both sides of an island of already-rendered rows)
				(function(loadingNode, scrollNode, below, keepScrollTo, results){
					lastRows = Deferred.when(grid.renderArray(results, loadingNode, options), function(rows){
						lastResults = results;
						
						// can remove the loading node now
						beforeNode = loadingNode.nextSibling;
						put(loadingNode, "!");
						if(keepScrollTo && beforeNode && beforeNode.offsetWidth){ // beforeNode may have been removed if the query results loading node was a removed as a distant node before rendering 
							// if the preload area above the nodes is approximated based on average
							// row height, we may need to adjust the scroll once they are filled in
							// so we don't "jump" in the scrolling position
							var pos = grid.getScrollPosition();
							grid.scrollTo({
								// Since we already had to query the scroll position,
								// include x to avoid TouchScroll querying it again on its end.
								x: pos.x,
								y: pos.y + beforeNode.offsetTop - keepScrollTo,
								// Don't kill momentum mid-scroll (for TouchScroll only).
								preserveMomentum: true
							});
						}
						if(below){
							// if it is below, we will use the total from the results to update
							// the count of the last preload in case the total changes as later pages are retrieved
							// (not uncommon when total counts are estimated for db perf reasons)
							Deferred.when(results.total || results.length, function(total){
								// recalculate the count
								below.count = total - below.node.rowIndex;
								// readjust the height
								adjustHeight(below);
							});
						}
						// make sure we have covered the visible area
						grid._processScroll();
						return rows;
					}, function (e) {
						put(loadingNode, "!");
						throw e;
					});
				}).call(this, loadingNode, scrollNode, below, keepScrollTo, results);
				preload = preload.previous;
			}
		}
		
		// After iterating, if additional requests have been made mid-refresh,
		// resolve the refresh promise based on the latest results obtained
		if (lastRows && (refreshDfd = this._refreshDeferred)) {
			delete this._refreshDeferred;
			Deferred.when(lastRows, function() {
				refreshDfd.resolve(lastResults);
			});
		}
	}
});

});

},
'dgrid/_StoreMixin':function(){
define(["dojo/_base/kernel", "dojo/_base/declare", "dojo/_base/lang", "dojo/_base/Deferred", "dojo/on", "dojo/aspect", "put-selector/put"],
function(kernel, declare, lang, Deferred, listen, aspect, put){
	// This module isolates the base logic required by store-aware list/grid
	// components, e.g. OnDemandList/Grid and the Pagination extension.
	
	// Noop function, needed for _trackError when callback due to a bug in 1.8
	// (see http://bugs.dojotoolkit.org/ticket/16667)
	function noop(value){ return value; }
	
	function emitError(err){
		// called by _trackError in context of list/grid, if an error is encountered
		if(typeof err !== "object"){
			// Ensure we actually have an error object, so we can attach a reference.
			err = new Error(err);
		}
		// TODO: remove this @ 1.0 (prefer grid property directly on event object)
		err.grid = this;
		
		if(listen.emit(this.domNode, "dgrid-error", {
				grid: this,
				error: err,
				cancelable: true,
				bubbles: true })){
			console.error(err);
		}
	}
	
	return declare(null, {
		// store: Object
		//		The object store (implementing the dojo/store API) from which data is
		//		to be fetched.
		store: null,
		
		// query: Object
		//		Specifies query parameter(s) to pass to store.query calls.
		query: null,
		
		// queryOptions: Object
		//		Specifies additional query options to mix in when calling store.query;
		//		sort, start, and count are already handled.
		queryOptions: null,
		
		// getBeforePut: boolean
		//		If true, a get request will be performed to the store before each put
		//		as a baseline when saving; otherwise, existing row data will be used.
		getBeforePut: true,
		
		// noDataMessage: String
		//		Message to be displayed when no results exist for a query, whether at
		//		the time of the initial query or upon subsequent observed changes.
		//		Defined by _StoreMixin, but to be implemented by subclasses.
		noDataMessage: "",
		
		// loadingMessage: String
		//		Message displayed when data is loading.
		//		Defined by _StoreMixin, but to be implemented by subclasses.
		loadingMessage: "",
		
		constructor: function(){
			// Create empty objects on each instance, not the prototype
			this.query = {};
			this.queryOptions = {};
			this.dirty = {};
			this._updating = {}; // Tracks rows that are mid-update
			this._columnsWithSet = {};

			// Reset _columnsWithSet whenever column configuration is reset
			aspect.before(this, "configStructure", lang.hitch(this, function(){
				this._columnsWithSet = {};
			}));
		},
		
		_configColumn: function(column){
			// summary:
			//		Implements extension point provided by Grid to store references to
			//		any columns with `set` methods, for use during `save`.
			if (column.set){
				this._columnsWithSet[column.field] = column;
			}
		},
		
		_setStore: function(store, query, queryOptions){
			// summary:
			//		Assigns a new store (and optionally query/queryOptions) to the list,
			//		and tells it to refresh.
			this.store = store;
			this.dirty = {}; // discard dirty map, as it applied to a previous store
			this.set("query", query, queryOptions);
		},
		_setQuery: function(query, queryOptions){
			// summary:
			//		Assigns a new query (and optionally queryOptions) to the list,
			//		and tells it to refresh.
			
			var sort = queryOptions && queryOptions.sort;
			
			this.query = query !== undefined ? query : this.query;
			this.queryOptions = queryOptions || this.queryOptions;
			
			// If we have new sort criteria, pass them through sort
			// (which will update _sort and call refresh in itself).
			// Otherwise, just refresh.
			sort ? this.set("sort", sort) : this.refresh();
		},
		setStore: function(store, query, queryOptions){
			kernel.deprecated("setStore(...)", 'use set("store", ...) instead', "dgrid 1.0");
			this.set("store", store, query, queryOptions);
		},
		setQuery: function(query, queryOptions){
			kernel.deprecated("setQuery(...)", 'use set("query", ...) instead', "dgrid 1.0");
			this.set("query", query, queryOptions);
		},
		
		_getQueryOptions: function(){
			// summary:
			//		Get a fresh queryOptions object, also including the current sort
			var options = lang.delegate(this.queryOptions, {});
			if(this._sort.length){
				// Prevents SimpleQueryEngine from doing unnecessary "null" sorts (which can
				// change the ordering in browsers that don't use a stable sort algorithm, eg Chrome)
				options.sort = this._sort;
			}
			return options;
		},
		_getQuery: function(){
			// summary:
			//		Implemented consistent with _getQueryOptions so that if query is
			//		an object, this returns a protected (delegated) object instead of
			//		the original.
			var q = this.query;
			return typeof q == "object" && q != null ? lang.delegate(q, {}) : q;
		},
		
		_setSort: function(property, descending){
			// summary:
			//		Sort the content
			
			// prevent default storeless sort logic as long as we have a store
			if(this.store){ this._lastCollection = null; }
			this.inherited(arguments);
		},
		
		insertRow: function(object, parent, beforeNode, i, options){
			var store = this.store,
				dirty = this.dirty,
				id = store && store.getIdentity(object),
				dirtyObj;
			
			if(id in dirty && !(id in this._updating)){ dirtyObj = dirty[id]; }
			if(dirtyObj){
				// restore dirty object as delegate on top of original object,
				// to provide protection for subsequent changes as well
				object = lang.delegate(object, dirtyObj);
			}
			return this.inherited(arguments);
		},
		
		updateDirty: function(id, field, value){
			// summary:
			//		Updates dirty data of a field for the item with the specified ID.
			var dirty = this.dirty,
				dirtyObj = dirty[id];
			
			if(!dirtyObj){
				dirtyObj = dirty[id] = {};
			}
			dirtyObj[field] = value;
		},
		setDirty: function(id, field, value){
			kernel.deprecated("setDirty(...)", "use updateDirty() instead", "dgrid 1.0");
			this.updateDirty(id, field, value);
		},
		
		save: function() {
			// Keep track of the store and puts
			var self = this,
				store = this.store,
				dirty = this.dirty,
				dfd = new Deferred(), promise = dfd.promise,
				getFunc = function(id){
					// returns a function to pass as a step in the promise chain,
					// with the id variable closured
					var data;
					return (self.getBeforePut || !(data = self.row(id).data)) ?
						function(){ return store.get(id); } :
						function(){ return data; };
				};
			
			// function called within loop to generate a function for putting an item
			function putter(id, dirtyObj) {
				// Return a function handler
				return function(object) {
					var colsWithSet = self._columnsWithSet,
						updating = self._updating,
						key, data;
					// Copy dirty props to the original, applying setters if applicable
					for(key in dirtyObj){
						object[key] = dirtyObj[key];
					}
					
					// Apply any set methods in column definitions.
					// Note that while in the most common cases column.set is intended
					// to return transformed data for the key in question, it is also
					// possible to directly modify the object to be saved.
					for(key in colsWithSet){
						data = colsWithSet[key].set(object);
						if(data !== undefined){ object[key] = data; }
					}
					
					updating[id] = true;
					// Put it in the store, returning the result/promise
					return Deferred.when(store.put(object), function() {
						// Clear the item now that it's been confirmed updated
						delete dirty[id];
						delete updating[id];
					});
				};
			}
			
			// For every dirty item, grab the ID
			for(var id in dirty) {
				// Create put function to handle the saving of the the item
				var put = putter(id, dirty[id]);
				
				// Add this item onto the promise chain,
				// getting the item from the store first if desired.
				promise = promise.then(getFunc(id)).then(put);
			}
			
			// Kick off and return the promise representing all applicable get/put ops.
			// If the success callback is fired, all operations succeeded; otherwise,
			// save will stop at the first error it encounters.
			dfd.resolve();
			return promise;
		},
		
		revert: function(){
			// summary:
			//		Reverts any changes since the previous save.
			this.dirty = {};
			this.refresh();
		},
		
		_trackError: function(func){
			// summary:
			//		Utility function to handle emitting of error events.
			// func: Function|String
			//		A function which performs some store operation, or a String identifying
			//		a function to be invoked (sans arguments) hitched against the instance.
			//		If sync, it can return a value, but may throw an error on failure.
			//		If async, it should return a promise, which would fire the error
			//		callback on failure.
			// tags:
			//		protected
			
			var result;
			
			if(typeof func == "string"){ func = lang.hitch(this, func); }
			
			try{
				result = func();
			}catch(err){
				// report sync error
				emitError.call(this, err);
			}
			
			// wrap in when call to handle reporting of potential async error
			return Deferred.when(result, noop, lang.hitch(this, emitError));
		},
		
		newRow: function(){
			// Override to remove no data message when a new row appears.
			if(this.noDataNode){
				put(this.noDataNode, "!");
				delete this.noDataNode;
			}
			return this.inherited(arguments);
		},
		removeRow: function(rowElement, justCleanup){
			var row = {element: rowElement};
			// Check to see if we are now empty...
			if(!justCleanup && this.noDataMessage &&
					(this.up(row).element === rowElement) &&
					(this.down(row).element === rowElement)){
				// ...we are empty, so show the no data message.
				this.noDataNode = put(this.contentNode, "div.dgrid-no-data");
				this.noDataNode.innerHTML = this.noDataMessage;
			}
			return this.inherited(arguments);
		}
	});
});

},
'dgrid/Keyboard':function(){
define([
	"dojo/_base/declare",
	"dojo/aspect",
	"dojo/on",
	"dojo/_base/lang",
	"dojo/has",
	"put-selector/put",
	"dojo/_base/Deferred",
	"dojo/_base/sniff"
], function(declare, aspect, on, lang, has, put, Deferred){

var delegatingInputTypes = {
		checkbox: 1,
		radio: 1,
		button: 1
	},
	hasGridCellClass = /\bdgrid-cell\b/,
	hasGridRowClass = /\bdgrid-row\b/;

has.add("dom-contains", function(global, doc, element){
	return !!element.contains; // not supported by FF < 9
});

function contains(parent, node){
	// summary:
	//		Checks to see if an element is contained by another element.
	
	if(has("dom-contains")){
		return parent.contains(node);
	}else{
		return parent.compareDocumentPosition(node) & 8 /* DOCUMENT_POSITION_CONTAINS */;
	}
}

var Keyboard = declare(null, {
	// summary:
	//		Adds keyboard navigation capability to a list or grid.
	
	// pageSkip: Number
	//		Number of rows to jump by when page up or page down is pressed.
	pageSkip: 10,
	
	tabIndex: 0,
	
	// keyMap: Object
	//		Hash which maps key codes to functions to be executed (in the context
	//		of the instance) for key events within the grid's body.
	keyMap: null,
	
	// headerKeyMap: Object
	//		Hash which maps key codes to functions to be executed (in the context
	//		of the instance) for key events within the grid's header row.
	headerKeyMap: null,
	
	postMixInProperties: function(){
		this.inherited(arguments);
		
		if(!this.keyMap){
			this.keyMap = lang.mixin({}, Keyboard.defaultKeyMap);
		}
		if(!this.headerKeyMap){
			this.headerKeyMap = lang.mixin({}, Keyboard.defaultHeaderKeyMap);
		}
	},
	
	postCreate: function(){
		this.inherited(arguments);
		var grid = this;
		
		function handledEvent(event){
			// text boxes and other inputs that can use direction keys should be ignored and not affect cell/row navigation
			var target = event.target;
			return target.type && (!delegatingInputTypes[target.type] || event.keyCode == 32);
		}
		
		function enableNavigation(areaNode){
			var cellNavigation = grid.cellNavigation,
				isFocusableClass = cellNavigation ? hasGridCellClass : hasGridRowClass,
				isHeader = areaNode === grid.headerNode,
				initialNode = areaNode;
			
			function initHeader(){
				grid._focusedHeaderNode = initialNode =
					cellNavigation ? grid.headerNode.getElementsByTagName("th")[0] : grid.headerNode;
				if(initialNode){ initialNode.tabIndex = grid.tabIndex; }
			}
			
			if(isHeader){
				// Initialize header now (since it's already been rendered),
				// and aspect after future renderHeader calls to reset focus.
				initHeader();
				aspect.after(grid, "renderHeader", initHeader, true);
			}else{
				aspect.after(grid, "renderArray", function(ret){
					// summary:
					//		Ensures the first element of a grid is always keyboard selectable after data has been
					//		retrieved if there is not already a valid focused element.
					
					return Deferred.when(ret, function(ret){
						var focusedNode = grid._focusedNode || initialNode;
						
						// do not update the focused element if we already have a valid one
						if(isFocusableClass.test(focusedNode.className) && contains(areaNode, focusedNode)){
							return ret;
						}
						
						// ensure that the focused element is actually a grid cell, not a
						// dgrid-preload or dgrid-content element, which should not be focusable,
						// even when data is loaded asynchronously
						for(var i = 0, elements = areaNode.getElementsByTagName("*"), element; (element = elements[i]); ++i){
							if(isFocusableClass.test(element.className)){
								focusedNode = grid._focusedNode = element;
								break;
							}
						}
						
						focusedNode.tabIndex = grid.tabIndex;
						return ret;
					});
				});
			}
			
			grid._listeners.push(on(areaNode, "mousedown", function(event){
				if(!handledEvent(event)){
					grid._focusOnNode(event.target, isHeader, event);
				}
			}));
			
			grid._listeners.push(on(areaNode, "keydown", function(event){
				// For now, don't squash browser-specific functionalities by letting
				// ALT and META function as they would natively
				if(event.metaKey || event.altKey) {
					return;
				}
				
				var handler = grid[isHeader ? "headerKeyMap" : "keyMap"][event.keyCode];
				
				// Text boxes and other inputs that can use direction keys should be ignored and not affect cell/row navigation
				if(handler && !handledEvent(event)){
					handler.call(grid, event);
				}
			}));
		}
		
		if(this.tabableHeader){
			enableNavigation(this.headerNode);
			on(this.headerNode, "dgrid-cellfocusin", function(){
				grid.scrollTo({ x: this.scrollLeft });
			});
		}
		enableNavigation(this.contentNode);
	},
	
	addKeyHandler: function(key, callback, isHeader){
		// summary:
		//		Adds a handler to the keyMap on the instance.
		//		Supports binding additional handlers to already-mapped keys.
		// key: Number
		//		Key code representing the key to be handled.
		// callback: Function
		//		Callback to be executed (in instance context) when the key is pressed.
		// isHeader: Boolean
		//		Whether the handler is to be added for the grid body (false, default)
		//		or the header (true).
		
		// Aspects may be about 10% slower than using an array-based appraoch,
		// but there is significantly less code involved (here and above).
		return aspect.after( // Handle
			this[isHeader ? "headerKeyMap" : "keyMap"], key, callback, true);
	},
	
	_focusOnNode: function(element, isHeader, event){
		var focusedNodeProperty = "_focused" + (isHeader ? "Header" : "") + "Node",
			focusedNode = this[focusedNodeProperty],
			cellOrRowType = this.cellNavigation ? "cell" : "row",
			cell = this[cellOrRowType](element),
			inputs,
			input,
			numInputs,
			inputFocused,
			i;
		
		element = cell && cell.element;
		if(!element){ return; }
		
		if(this.cellNavigation){
			inputs = element.getElementsByTagName("input");
			for(i = 0, numInputs = inputs.length; i < numInputs; i++){
				input = inputs[i];
				if((input.tabIndex != -1 || "lastValue" in input) && !input.disabled){
					// Employ workaround for focus rectangle in IE < 8
					if(has("ie") < 8){ input.style.position = "relative"; }
					input.focus();
					if(has("ie") < 8){ input.style.position = ""; }
					inputFocused = true;
					break;
				}
			}
		}
		
		event = lang.mixin({ grid: this }, event);
		if(event.type){
			event.parentType = event.type;
		}
		if(!event.bubbles){
			// IE doesn't always have a bubbles property already true.
			// Opera throws if you try to set it to true if it is already true.
			event.bubbles = true;
		}
		if(focusedNode){
			// Clean up previously-focused element
			// Remove the class name and the tabIndex attribute
			put(focusedNode, "!dgrid-focus[!tabIndex]");
			if(has("ie") < 8){
				// Clean up after workaround below (for non-input cases)
				focusedNode.style.position = "";
			}
			
			// Expose object representing focused cell or row losing focus, via
			// event.cell or event.row; which is set depends on cellNavigation.
			event[cellOrRowType] = this[cellOrRowType](focusedNode);
			on.emit(element, "dgrid-cellfocusout", event);
		}
		focusedNode = this[focusedNodeProperty] = element;
		
		// Expose object representing focused cell or row gaining focus, via
		// event.cell or event.row; which is set depends on cellNavigation.
		// Note that yes, the same event object is being reused; on.emit
		// performs a shallow copy of properties into a new event object.
		event[cellOrRowType] = cell;
		
		if(!inputFocused){
			if(has("ie") < 8){
				// setting the position to relative magically makes the outline
				// work properly for focusing later on with old IE.
				// (can't be done a priori with CSS or screws up the entire table)
				element.style.position = "relative";
			}
			element.tabIndex = this.tabIndex;
			element.focus();
		}
		put(element, ".dgrid-focus");
		on.emit(focusedNode, "dgrid-cellfocusin", event);
	},
	
	focusHeader: function(element){
		this._focusOnNode(element || this._focusedHeaderNode, true);
	},
	
	focus: function(element){
		this._focusOnNode(element || this._focusedNode, false);
	}
});

// Common functions used in default keyMap (called in instance context)

var moveFocusVertical = Keyboard.moveFocusVertical = function(event, steps){
	var cellNavigation = this.cellNavigation,
		target = this[cellNavigation ? "cell" : "row"](event),
		columnId = cellNavigation && target.column.id,
		next = this.down(this._focusedNode, steps, true);
	
	// Navigate within same column if cell navigation is enabled
	if(cellNavigation){ next = this.cell(next, columnId); }
	this._focusOnNode(next, false, event);
	
	event.preventDefault();
};

var moveFocusUp = Keyboard.moveFocusUp = function(event){
	moveFocusVertical.call(this, event, -1);
};

var moveFocusDown = Keyboard.moveFocusDown = function(event){
	moveFocusVertical.call(this, event, 1);
};

var moveFocusPageUp = Keyboard.moveFocusPageUp = function(event){
	moveFocusVertical.call(this, event, -this.pageSkip);
};

var moveFocusPageDown = Keyboard.moveFocusPageDown = function(event){
	moveFocusVertical.call(this, event, this.pageSkip);
};

var moveFocusHorizontal = Keyboard.moveFocusHorizontal = function(event, steps){
	if(!this.cellNavigation){ return; }
	var isHeader = !this.row(event), // header reports row as undefined
		currentNode = this["_focused" + (isHeader ? "Header" : "") + "Node"];
	
	this._focusOnNode(this.right(currentNode, steps), isHeader, event);
	event.preventDefault();
};

var moveFocusLeft = Keyboard.moveFocusLeft = function(event){
	moveFocusHorizontal.call(this, event, -1);
};

var moveFocusRight = Keyboard.moveFocusRight = function(event){
	moveFocusHorizontal.call(this, event, 1);
};

var moveHeaderFocusEnd = Keyboard.moveHeaderFocusEnd = function(event, scrollToBeginning){
	// Header case is always simple, since all rows/cells are present
	var nodes;
	if(this.cellNavigation){
		nodes = this.headerNode.getElementsByTagName("th");
		this._focusOnNode(nodes[scrollToBeginning ? 0 : nodes.length - 1], true, event);
	}
	// In row-navigation mode, there's nothing to do - only one row in header
	
	// Prevent browser from scrolling entire page
	event.preventDefault();
};

var moveHeaderFocusHome = Keyboard.moveHeaderFocusHome = function(event){
	moveHeaderFocusEnd.call(this, event, true);
};

var moveFocusEnd = Keyboard.moveFocusEnd = function(event, scrollToTop){
	// summary:
	//		Handles requests to scroll to the beginning or end of the grid.
	
	// Assume scrolling to top unless event is specifically for End key
	var self = this,
		cellNavigation = this.cellNavigation,
		contentNode = this.contentNode,
		contentPos = scrollToTop ? 0 : contentNode.scrollHeight,
		scrollPos = contentNode.scrollTop + contentPos,
		endChild = contentNode[scrollToTop ? "firstChild" : "lastChild"],
		hasPreload = endChild.className.indexOf("dgrid-preload") > -1,
		endTarget = hasPreload ? endChild[(scrollToTop ? "next" : "previous") + "Sibling"] : endChild,
		endPos = endTarget.offsetTop + (scrollToTop ? 0 : endTarget.offsetHeight),
		handle;
	
	if(hasPreload){
		// Find the nearest dgrid-row to the relevant end of the grid
		while(endTarget && endTarget.className.indexOf("dgrid-row") < 0){
			endTarget = endTarget[(scrollToTop ? "next" : "previous") + "Sibling"];
		}
		// If none is found, there are no rows, and nothing to navigate
		if(!endTarget){ return; }
	}
	
	// Grid content may be lazy-loaded, so check if content needs to be
	// loaded first
	if(!hasPreload || endChild.offsetHeight < 1){
		// End row is loaded; focus the first/last row/cell now
		if(cellNavigation){
			// Preserve column that was currently focused
			endTarget = this.cell(endTarget, this.cell(event).column.id);
		}
		this._focusOnNode(endTarget, false, event);
	}else{
		// In IE < 9, the event member references will become invalid by the time
		// _focusOnNode is called, so make a (shallow) copy up-front
		if(!has("dom-addeventlistener")){
			event = lang.mixin({}, event);
		}
		
		// If the topmost/bottommost row rendered doesn't reach the top/bottom of
		// the contentNode, we are using OnDemandList and need to wait for more
		// data to render, then focus the first/last row in the new content.
		handle = aspect.after(this, "renderArray", function(rows){
			handle.remove();
			return Deferred.when(rows, function(rows){
				var target = rows[scrollToTop ? 0 : rows.length - 1];
				if(cellNavigation){
					// Preserve column that was currently focused
					target = self.cell(target, self.cell(event).column.id);
				}
				self._focusOnNode(target, false, event);
			});
		});
	}
	
	if(scrollPos === endPos){
		// Grid body is already scrolled to end; prevent browser from scrolling
		// entire page instead
		event.preventDefault();
	}
};

var moveFocusHome = Keyboard.moveFocusHome = function(event){
	moveFocusEnd.call(this, event, true);
};

function preventDefault(event){
	event.preventDefault();
}

Keyboard.defaultKeyMap = {
	32: preventDefault, // space
	33: moveFocusPageUp, // page up
	34: moveFocusPageDown, // page down
	35: moveFocusEnd, // end
	36: moveFocusHome, // home
	37: moveFocusLeft, // left
	38: moveFocusUp, // up
	39: moveFocusRight, // right
	40: moveFocusDown // down
};

// Header needs fewer default bindings (no vertical), so bind it separately
Keyboard.defaultHeaderKeyMap = {
	32: preventDefault, // space
	35: moveHeaderFocusEnd, // end
	36: moveHeaderFocusHome, // home
	37: moveFocusLeft, // left
	39: moveFocusRight // right
};

return Keyboard;
});
},
'dgrid/Selection':function(){
define(["dojo/_base/kernel", "dojo/_base/declare", "dojo/_base/Deferred", "dojo/on", "dojo/has", "dojo/aspect", "./List", "dojo/has!touch?./util/touch", "put-selector/put", "dojo/query", "dojo/_base/sniff"],
function(kernel, declare, Deferred, on, has, aspect, List, touchUtil, put){

// Add feature test for user-select CSS property for optionally disabling
// text selection.
// (Can't use dom.setSelectable prior to 1.8.2 because of bad sniffs, see #15990)
has.add("css-user-select", function(global, doc, element){
	var style = element.style,
		prefixes = ["Khtml", "O", "ms", "Moz", "Webkit"],
		i = prefixes.length,
		name = "userSelect";

	// Iterate prefixes from most to least likely
	do{
		if(typeof style[name] !== "undefined"){
			// Supported; return property name
			return name;
		}
	}while(i-- && (name = prefixes[i] + "UserSelect"));

	// Not supported if we didn't return before now
	return false;
});

// Also add a feature test for the onselectstart event, which offers a more
// graceful fallback solution than node.unselectable.
has.add("dom-selectstart", typeof document.onselectstart !== "undefined");

var ctrlEquiv = has("mac") ? "metaKey" : "ctrlKey",
	hasUserSelect = has("css-user-select");

function makeUnselectable(node, unselectable){
	// Utility function used in fallback path for recursively setting unselectable
	var value = node.unselectable = unselectable ? "on" : "",
		elements = node.getElementsByTagName("*"),
		i = elements.length;
	
	while(--i){
		if(elements[i].tagName === "INPUT" || elements[i].tagName === "TEXTAREA"){
			continue; // Don't prevent text selection in text input fields.
		}
		elements[i].unselectable = value;
	}
}

function setSelectable(grid, selectable){
	// Alternative version of dojo/dom.setSelectable based on feature detection.
	
	// For FF < 21, use -moz-none, which will respect -moz-user-select: text on
	// child elements (e.g. form inputs).  In FF 21, none behaves the same.
	// See https://developer.mozilla.org/en-US/docs/CSS/user-select
	var node = grid.bodyNode,
		value = selectable ? "text" : has("ff") < 21 ? "-moz-none" : "none";
	
	if(hasUserSelect){
		node.style[hasUserSelect] = value;
	}else if(has("dom-selectstart")){
		// For browsers that don't support user-select but support selectstart (IE<10),
		// we can hook up an event handler as necessary.  Since selectstart bubbles,
		// it will handle any child elements as well.
		// Note, however, that both this and the unselectable fallback below are
		// incapable of preventing text selection from outside the targeted node.
		if(!selectable && !grid._selectstartHandle){
			grid._selectstartHandle = on(node, "selectstart", function(evt){
				var tag = evt.target && evt.target.tagName;
				
				// Prevent selection except where a text input field is involved.
				if(tag !== "INPUT" && tag !== "TEXTAREA"){
					evt.preventDefault();
				}
			});
		}else if(selectable && grid._selectstartHandle){
			grid._selectstartHandle.remove();
			delete grid._selectstartHandle;
		}
	}else{
		// For browsers that don't support either user-select or selectstart (Opera),
		// we need to resort to setting the unselectable attribute on all nodes
		// involved.  Since this doesn't automatically apply to child nodes, we also
		// need to re-apply it whenever rows are rendered.
		makeUnselectable(node, !selectable);
		if(!selectable && !grid._unselectableHandle){
			grid._unselectableHandle = aspect.after(grid, "renderRow", function(row){
				makeUnselectable(row, true);
				return row;
			});
		}else if(selectable && grid._unselectableHandle){
			grid._unselectableHandle.remove();
			delete grid._unselectableHandle;
		}
	}
}

return declare(null, {
	// summary:
	//		Add selection capabilities to a grid. The grid will have a selection property and
	//		fire "dgrid-select" and "dgrid-deselect" events.
	
	// selectionDelegate: String
	//		Selector to delegate to as target of selection events.
	selectionDelegate: ".dgrid-row",
	
	// selectionEvents: String
	//		Event (or events, comma-delimited) to listen on to trigger select logic.
	//		Note: this is ignored in the case of touch devices.
	selectionEvents: "mousedown,mouseup,dgrid-cellfocusin",
	
	// deselectOnRefresh: Boolean
	//		If true, the selection object will be cleared when refresh is called.
	deselectOnRefresh: true,
	
	// allowSelectAll: Boolean
	//		If true, allow ctrl/cmd+A to select all rows.
	//		Also consulted by the selector plugin for showing select-all checkbox.
	allowSelectAll: false,
	
	// selection:
	//		An object where the property names correspond to 
	//		object ids and values are true or false depending on whether an item is selected
	selection: {},
	
	// selectionMode: String
	//		The selection mode to use, can be "none", "multiple", "single", or "extended".
	selectionMode: "extended",
	
	// allowTextSelection: Boolean
	//		Whether to still allow text within cells to be selected.  The default
	//		behavior is to allow text selection only when selectionMode is none;
	//		setting this property to either true or false will explicitly set the
	//		behavior regardless of selectionMode.
	allowTextSelection: undefined,
	
	create: function(){
		this.selection = {};
		return this.inherited(arguments);
	},
	postCreate: function(){
		this.inherited(arguments);
		
		// Force selectionMode setter to run.
		var selectionMode = this.selectionMode;
		this.selectionMode = "";
		this._setSelectionMode(selectionMode);
		
		this._initSelectionEvents(); // first time; set up event hooks
	},
	
	destroy: function(){
		this.inherited(arguments);
		
		// Remove any handles added for cross-browser text selection prevention.
		if(this._selectstartHandle){ this._selectstartHandle.remove(); }
		if(this._unselectableHandle){ this._unselectableHandle.remove(); }
	},
	
	_setSelectionMode: function(mode){
		// summary:
		//		Updates selectionMode, resetting necessary variables.
		if(mode == this.selectionMode){ return; } // prevent unnecessary spinning
		
		// Start selection fresh when switching mode.
		this.clearSelection();
		
		this.selectionMode = mode;
		
		// Compute name of selection handler for this mode once
		// (in the form of _fooSelectionHandler)
		this._selectionHandlerName = "_" + mode + "SelectionHandler";
		
		// Also re-run allowTextSelection setter in case it is in automatic mode.
		this._setAllowTextSelection(this.allowTextSelection);
	},
	setSelectionMode: function(mode){
		kernel.deprecated("setSelectionMode(...)", 'use set("selectionMode", ...) instead', "dgrid 1.0");
		this.set("selectionMode", mode);
	},
	
	_setAllowTextSelection: function(allow){
		if(typeof allow !== "undefined"){
			setSelectable(this, allow);
		}else{
			setSelectable(this, this.selectionMode === "none");
		}
		this.allowTextSelection = allow;
	},
	
	_handleSelect: function(event, target){
		// Don't run if selection mode doesn't have a handler (incl. "none"),
		// or if coming from a dgrid-cellfocusin from a mousedown
		if(!this[this._selectionHandlerName] ||
				(event.type == "dgrid-cellfocusin" && event.parentType == "mousedown") ||
				(event.type == "mouseup" && target != this._waitForMouseUp)){
			return;
		}
		this._waitForMouseUp = null;
		this._selectionTriggerEvent = event;
		
		// Don't call select handler for ctrl+navigation
		if(!event.keyCode || !event.ctrlKey || event.keyCode == 32){
			// If clicking a selected item, wait for mouseup so that drag n' drop
			// is possible without losing our selection
			if(!event.shiftKey && event.type == "mousedown" && this.isSelected(target)){
				this._waitForMouseUp = target;
			}else{
				this[this._selectionHandlerName](event, target);
			}
		}
		this._selectionTriggerEvent = null;
	},
	
	_singleSelectionHandler: function(event, target){
		// summary:
		//		Selection handler for "single" mode, where only one target may be
		//		selected at a time.
		
		var ctrlKey = event.keyCode ? event.ctrlKey : event[ctrlEquiv];
		if(this._lastSelected === target){
			// Allow ctrl to toggle selection, even within single select mode.
			this.select(target, null, !ctrlKey || !this.isSelected(target));
		}else{
			this.clearSelection();
			this.select(target);
			this._lastSelected = target;
		}
	},
	
	_multipleSelectionHandler: function(event, target){
		// summary:
		//		Selection handler for "multiple" mode, where shift can be held to
		//		select ranges, ctrl/cmd can be held to toggle, and clicks/keystrokes
		//		without modifier keys will add to the current selection.
		
		var lastRow = this._lastSelected,
			ctrlKey = event.keyCode ? event.ctrlKey : event[ctrlEquiv],
			value;
		
		if(!event.shiftKey){
			// Toggle if ctrl is held; otherwise select
			value = ctrlKey ? null : true;
			lastRow = null;
		}
		this.select(target, lastRow, value);

		if(!lastRow){
			// Update reference for potential subsequent shift+select
			// (current row was already selected above)
			this._lastSelected = target;
		}
	},
	
	_extendedSelectionHandler: function(event, target){
		// summary:
		//		Selection handler for "extended" mode, which is like multiple mode
		//		except that clicks/keystrokes without modifier keys will clear
		//		the previous selection.
		
		// Clear selection first for right-clicks outside selection and non-ctrl-clicks;
		// otherwise, extended mode logic is identical to multiple mode
		if(event.button === 2 ? !this.isSelected(target) :
				!(event.keyCode ? event.ctrlKey : event[ctrlEquiv])){
			this.clearSelection(null, true);
		}
		this._multipleSelectionHandler(event, target);
	},
	
	_toggleSelectionHandler: function(event, target){
		// summary:
		//		Selection handler for "toggle" mode which simply toggles the selection
		//		of the given target.  Primarily useful for touch input.
		
		this.select(target, null, null);
	},

	_initSelectionEvents: function(){
		// summary:
		//		Performs first-time hookup of event handlers containing logic
		//		required for selection to operate.
		
		var grid = this,
			selector = this.selectionDelegate;
		
		if(has("touch")){
			// listen for touch taps if available
			on(this.contentNode, touchUtil.selector(selector, touchUtil.tap), function(evt){
				grid._handleSelect(evt, this);
			});
		}else{
			// listen for actions that should cause selections
			on(this.contentNode, on.selector(selector, this.selectionEvents), function(event){
				grid._handleSelect(event, this);
			});
		}
		
		// Also hook up spacebar (for ctrl+space)
		if(this.addKeyHandler){
			this.addKeyHandler(32, function(event){
				grid._handleSelect(event, event.target);
			});
		}
		
		// If allowSelectAll is true, allow ctrl/cmd+A to (de)select all rows.
		// (Handler further checks against _allowSelectAll, which may be updated
		// if selectionMode is changed post-init.)
		if(this.allowSelectAll){
			this.on("keydown", function(event) {
				if (event[ctrlEquiv] && event.keyCode == 65) {
					event.preventDefault();
					grid[grid.allSelected ? "clearSelection" : "selectAll"]();
				}
			});
		}
		
		aspect.before(this, "removeRow", function(rowElement, justCleanup){
			var row;
			if(!justCleanup){
				row = this.row(rowElement);
				// if it is a real row removal for a selected item, deselect it
				if(row && (row.id in this.selection)){ this.deselect(rowElement); }
			}
		});
	},
	
	allowSelect: function(row){
		// summary:
		//		A method that can be overriden to determine whether or not a row (or 
		//		cell) can be selected. By default, all rows (or cells) are selectable.
		return true;
	},
	
	_selectionEventQueue: function(value, type){
		var grid = this,
			event = "dgrid-" + (value ? "select" : "deselect"),
			rows = this[event], // current event queue (actually cells for CellSelection)
			trigger = this._selectionTriggerEvent;
		
		if (trigger) {
			// If selection was triggered by another event, we want to know its type
			// to report later.  Grab it ahead of the timeout to avoid
			// "member not found" errors in IE < 9.
			trigger = trigger.type;
		}
		
		if(rows){ return rows; } // return existing queue, allowing to push more
		
		// Create a timeout to fire an event for the accumulated rows once everything is done.
		// We expose the callback in case the event needs to be fired immediately.
		setTimeout(this._fireSelectionEvent = function(){
			if(!rows){ return; } // rows will be set only the first time this is called
			
			var eventObject = {
				bubbles: true,
				grid: grid
			};
			if(trigger){ eventObject.parentType = trigger; }
			eventObject[type] = rows;
			on.emit(grid.contentNode, event, eventObject);
			rows = null;
			// clear the queue, so we create a new one as needed
			delete grid[event];
		}, 0);
		return (rows = this[event] = []);
	},
	select: function(row, toRow, value){
		if(value === undefined){
			// default to true
			value = true;
		} 
		if(!row.element){
			row = this.row(row);
		}
		if(!value || this.allowSelect(row)){
			var selection = this.selection;
			var previousValue = selection[row.id];
			if(value === null){
				// indicates a toggle
				value = !previousValue;
			}
			var element = row.element;
			if(!value && !this.allSelected){
				delete this.selection[row.id];
			}else{
				selection[row.id] = value;
			}
			if(element){
				// add or remove classes as appropriate
				if(value){
					put(element, ".dgrid-selected.ui-state-active");
				}else{
					put(element, "!dgrid-selected!ui-state-active");
				}
			}
			if(value != previousValue && element){
				// add to the queue of row events
				this._selectionEventQueue(value, "rows").push(row);
			}
			
			if(toRow){
				if(!toRow.element){
					toRow = this.row(toRow);
				}
				var toElement = toRow.element;
				var fromElement = row.element;
				// find if it is earlier or later in the DOM
				var traverser = (toElement && (toElement.compareDocumentPosition ? 
					toElement.compareDocumentPosition(fromElement) == 2 :
					toElement.sourceIndex > fromElement.sourceIndex)) ? "down" : "up";
				while(row.element != toElement && (row = this[traverser](row))){
					this.select(row, null, value);
				}
			}
		}
	},
	deselect: function(row, toRow){
		this.select(row, toRow, false);
	},
	clearSelection: function(exceptId, dontResetLastSelected){
		// summary:
		//		Deselects any currently-selected items.
		// exceptId: Mixed?
		//		If specified, the given id will not be deselected.
		
		this.allSelected = false;
		for(var id in this.selection){
			if(exceptId !== id){
				this.deselect(id);
			}
		}
		if(!dontResetLastSelected){
			this._lastSelected = null;
		}
	},
	selectAll: function(){
		this.allSelected = true;
		this.selection = {}; // we do this to clear out pages from previous sorts
		for(var i in this._rowIdToObject){
			var row = this.row(this._rowIdToObject[i]);
			this.select(row.id);
		}
	},
	isSelected: function(object){
		// summary:
		//		Returns true if the indicated row is selected.
		
		if(typeof object === "undefined" || object === null){
			return false;
		}
		if(!object.element){
			object = this.row(object);
		}
		
		// First check whether the given row is indicated in the selection hash;
		// failing that, check if allSelected is true (testing against the
		// allowSelect method if possible)
		return (object.id in this.selection) ? !!this.selection[object.id] :
			this.allSelected && (!object.data || this.allowSelect(object));
	},
	
	refresh: function(){
		if(this.deselectOnRefresh){
			this.clearSelection();
			// Need to fire the selection event now because after the refresh,
			// the nodes that we will fire for will be gone.
			this._fireSelectionEvent && this._fireSelectionEvent();
		}
		this._lastSelected = null;
		return this.inherited(arguments);
	},
	
	renderArray: function(){
		var grid = this,
			rows = this.inherited(arguments);
		
		Deferred.when(rows, function(rows){
			var selection = grid.selection,
				i, row, selected;
			for(i = 0; i < rows.length; i++){
				row = grid.row(rows[i]);
				selected = row.id in selection ? selection[row.id] : grid.allSelected;
				if(selected){
					grid.select(row, null, selected);
				}
			}
		});
		return rows;
	}
});

});

},
'dgrid/editor':function(){
define([
	"dojo/_base/kernel",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/_base/Deferred",
	"dojo/on",
	"dojo/aspect",
	"dojo/has",
	"./Grid",
	"put-selector/put",
	"dojo/_base/sniff"
], function(kernel, lang, arrayUtil, Deferred, on, aspect, has, Grid, put){

// Variables to track info for cell currently being edited (editOn only).
var activeCell, activeValue, activeOptions;

function updateInputValue(input, value){
	// common code for updating value of a standard input
	input.value = value;
	if(input.type == "radio" || input.type == "checkbox"){
		input.checked = input.defaultChecked = !!value;
	}
}

function dataFromValue(value, oldValue){
	// Default logic for translating values from editors;
	// tries to preserve type if possible.
	if(typeof oldValue == "number"){
		value = isNaN(value) ? value : parseFloat(value);
	}else if(typeof oldValue == "boolean"){
		value = value == "true" ? true : value == "false" ? false : value;
	}else if(oldValue instanceof Date){
		var asDate = new Date(value);
		value = isNaN(asDate.getTime()) ? value : asDate;
	}
	return value;
}

// intermediary frontend to dataFromValue for HTML and widget editors
function dataFromEditor(column, cmp){
	if(typeof cmp.get == "function"){ // widget
		return dataFromValue(cmp.get("value"));
	}else{ // HTML input
		return dataFromValue(
			cmp[cmp.type == "checkbox" || cmp.type == "radio"  ? "checked" : "value"]);
	}
}

function setProperty(grid, cellElement, oldValue, value, triggerEvent){
	// Updates dirty hash and fires dgrid-datachange event for a changed value.
	var cell, row, column, eventObject;
	// test whether old and new values are inequal, with coercion (e.g. for Dates)
	if((oldValue && oldValue.valueOf()) != (value && value.valueOf())){
		cell = grid.cell(cellElement);
		row = cell.row;
		column = cell.column;
		if(column.field && row){
			// TODO: remove rowId in lieu of cell (or grid.row/grid.cell)
			// (keeping for the moment for back-compat, but will note in changes)
			eventObject = {
				grid: grid,
				cell: cell,
				rowId: row.id,
				oldValue: oldValue,
				value: value,
				bubbles: true,
				cancelable: true
			};
			if(triggerEvent && triggerEvent.type){
				eventObject.parentType = triggerEvent.type;
			}
			
			if(on.emit(cellElement, "dgrid-datachange", eventObject)){
				if(grid.updateDirty){
					// for OnDemandGrid: update dirty data, and save if autoSave is true
					grid.updateDirty(row.id, column.field, value);
					// perform auto-save (if applicable) in next tick to avoid
					// unintentional mishaps due to order of handler execution
					column.autoSave && setTimeout(function(){ grid._trackError("save"); }, 0);
				}
			}else{
				// Otherwise keep the value the same
				// For the sake of always-on editors, need to manually reset the value
				var cmp;
				if(cmp = cellElement.widget){
					// set _dgridIgnoreChange to prevent an infinite loop in the
					// onChange handler and prevent dgrid-datachange from firing
					// a second time
					cmp._dgridIgnoreChange = true;
					cmp.set("value", oldValue);
					setTimeout(function(){ cmp._dgridIgnoreChange = false; }, 0);
				}else if(cmp = cellElement.input){
					updateInputValue(cmp, oldValue);
				}
				
				return oldValue;
			}
		}
	}
	return value;
}

// intermediary frontend to setProperty for HTML and widget editors
function setPropertyFromEditor(grid, column, cmp, triggerEvent) {
	var value;
	if(!cmp.isValid || cmp.isValid()){
		value = setProperty(grid, (cmp.domNode || cmp).parentNode,
			activeCell ? activeValue : cmp._dgridLastValue,
			dataFromEditor(column, cmp), triggerEvent);
		
		if(activeCell){ // for editors with editOn defined
			activeValue = value;
		}else{ // for always-on editors, update _dgridLastValue immediately
			cmp._dgridLastValue = value;
		}
	}
}

// editor creation/hookup/placement logic

function createEditor(column){
	// Creates an editor instance based on column definition properties,
	// and hooks up events.
	var editor = column.editor,
		editOn = column.editOn,
		grid = column.grid,
		isWidget = typeof editor != "string", // string == standard HTML input
		args, cmp, node, putstr, handleChange;
	
	args = column.editorArgs || {};
	if(typeof args == "function"){ args = args.call(grid, column); }
	
	if(isWidget){
		cmp = new editor(args);
		node = cmp.focusNode || cmp.domNode;
		
		// Add dgrid-input to className to make consistent with HTML inputs.
		node.className += " dgrid-input";
		
		// For editOn editors, connect to onBlur rather than onChange, since
		// the latter is delayed by setTimeouts in Dijit and will fire too late.
		cmp.connect(cmp, editOn ? "onBlur" : "onChange", function(){
			if(!cmp._dgridIgnoreChange){
				setPropertyFromEditor(grid, column, this, {type: "widget"});
			}
		});
	}else{
		handleChange = function(evt){
			var target = evt.target;
			if("_dgridLastValue" in target && target.className.indexOf("dgrid-input") > -1){
				setPropertyFromEditor(grid, column, target, evt);
			}
		};

		// considerations for standard HTML form elements
		if(!column.grid._hasInputListener){
			// register one listener at the top level that receives events delegated
			grid._hasInputListener = true;
			grid.on("change", function(evt){ handleChange(evt); });
			// also register a focus listener
		}
		
		putstr = editor == "textarea" ? "textarea" :
			"input[type=" + editor + "]";
		cmp = node = put(putstr + ".dgrid-input", lang.mixin({
			name: column.field,
			tabIndex: isNaN(column.tabIndex) ? -1 : column.tabIndex
		}, args));
		
		if(has("ie") < 9 || (has("ie") &&  0 )){
			// IE<9 / quirks doesn't fire change events for all the right things,
			// and it doesn't bubble.
			if(editor == "radio" || editor == "checkbox"){
				// listen for clicks since IE doesn't fire change events properly for checks/radios
				on(cmp, "click", function(evt){ handleChange(evt); });
			}else{
				on(cmp, "change", function(evt){ handleChange(evt); });
			}
		}
	}
	
	// XXX: stop mousedown propagation to prevent confusing Keyboard mixin logic
	// with certain widgets; perhaps revising KB's `handledEvent` would be better.
	on(node, "mousedown", function(evt){ evt.stopPropagation(); });
	
	return cmp;
}

function createSharedEditor(column, originalRenderCell){
	// Creates an editor instance with additional considerations for
	// shared usage across an entire column (for columns with editOn specified).
	
	var cmp = createEditor(column),
		grid = column.grid,
		isWidget = cmp.domNode,
		node = cmp.domNode || cmp,
		focusNode = cmp.focusNode || node,
		reset = isWidget ?
			function(){ cmp.set("value", cmp._dgridLastValue); } :
			function(){
				updateInputValue(cmp, cmp._dgridLastValue);
				// call setProperty again in case we need to revert a previous change
				setPropertyFromEditor(column.grid, column, cmp);
			},
		keyHandle;
	
	function onblur(){
		var parentNode = node.parentNode,
			i = parentNode.children.length - 1,
			options = { alreadyHooked: true },
			cell = grid.cell(node);
		
		// emit an event immediately prior to removing an editOn editor
		on.emit(cell.element, "dgrid-editor-hide", {
			grid: grid,
			cell: cell,
			column: column,
			editor: cmp,
			bubbles: true,
			cancelable: false
		});
		// Remove the editor from the cell, to be reused later.
		parentNode.removeChild(node);
		
		put(cell.element, "!dgrid-cell-editing");
		
		// Clear out the rest of the cell's contents, then re-render with new value.
		while(i--){ put(parentNode.firstChild, "!"); }
		Grid.appendIfNode(parentNode, column.renderCell(
			column.grid.row(parentNode).data, activeValue, parentNode,
			activeOptions ? lang.delegate(options, activeOptions) : options));
		
		// reset state now that editor is deactivated
		activeCell = activeValue = activeOptions = null;
		column._editorBlurHandle.pause();
	}
	
	function dismissOnKey(evt){
		// Contains logic for reacting to enter/escape keypresses to save/cancel edits.
		// Calls `focusNode.blur()` in cases where field should be dismissed.
		var key = evt.keyCode || evt.which;
		
		if(key == 27){ // escape: revert + dismiss
			reset();
			activeValue = cmp._dgridLastValue;
			focusNode.blur();
		}else if(key == 13 && column.dismissOnEnter !== false){ // enter: dismiss
			// FIXME: Opera is "reverting" even in this case
			focusNode.blur();
		}
	}
	
	// hook up enter/esc key handling
	keyHandle = on(focusNode, "keydown", dismissOnKey);
	
	// hook up blur handler, but don't activate until widget is activated
	(column._editorBlurHandle = on.pausable(cmp, "blur", onblur)).pause();
	
	return cmp;
}

function showEditor(cmp, column, cellElement, value){
	// Places a shared editor into the newly-active cell in the column.
	// Also called when rendering an editor in an "always-on" editor column.
	
	var isWidget = cmp.domNode,
		grid = column.grid;
	
	// for regular inputs, we can update the value before even showing it
	if(!isWidget){ updateInputValue(cmp, value); }
	
	cellElement.innerHTML = "";
	put(cellElement, ".dgrid-cell-editing");
	put(cellElement, cmp.domNode || cmp);
	
	if(isWidget){
		// For widgets, ensure startup is called before setting value,
		// to maximize compatibility with flaky widgets like dijit/form/Select.
		if(!cmp._started){ cmp.startup(); }
		
		// Set value, but ensure it isn't processed as a user-generated change.
		// (Clear flag on a timeout to wait for delayed onChange to fire first)
		cmp._dgridIgnoreChange = true;
		cmp.set("value", value);
		setTimeout(function(){ cmp._dgridIgnoreChange = false; }, 0);
	}
	// track previous value for short-circuiting or in case we need to revert
	cmp._dgridLastValue = value;
	// if this is an editor with editOn, also update activeValue
	// (activeOptions will have been updated previously)
	if(activeCell){ 
		activeValue = value; 
		// emit an event immediately prior to placing a shared editor
		on.emit(cellElement, "dgrid-editor-show", {
			grid: grid,
			cell: grid.cell(cellElement),
			column: column,
			editor: cmp,
			bubbles: true,
			cancelable: false
		});
	}
}

function edit(cell) {
	// summary:
	//		Method to be mixed into grid instances, which will show/focus the
	//		editor for a given grid cell.  Also used by renderCell.
	// cell: Object
	//		Cell (or something resolvable by grid.cell) to activate editor on.
	// returns:
	//		If the cell is editable, returns a promise resolving to the editor
	//		input/widget when the cell editor is focused.
	//		If the cell is not editable, returns null.
	
	var row, column, cellElement, dirty, field, value, cmp, dfd;
	
	if(!cell.column){ cell = this.cell(cell); }
	if(!cell || !cell.element){ return null; }
	
	column = cell.column;
	field = column.field;
	cellElement = cell.element.contents || cell.element;
	
	if((cmp = column.editorInstance)){ // shared editor (editOn used)
		if(activeCell != cellElement &&
				(!column.canEdit || column.canEdit(cell.row.data, value))){
			activeCell = cellElement;
			row = cell.row;
			dirty = this.dirty && this.dirty[row.id];
			value = (dirty && field in dirty) ? dirty[field] :
				column.get ? column.get(row.data) : row.data[field];
			
			showEditor(column.editorInstance, column, cellElement, value);
			
			// focus / blur-handler-resume logic is surrounded in a setTimeout
			// to play nice with Keyboard's dgrid-cellfocusin as an editOn event
			dfd = new Deferred();
			setTimeout(function(){
				// focus the newly-placed control (supported by form widgets and HTML inputs)
				if(cmp.focus){ cmp.focus(); }
				// resume blur handler once editor is focused
				if(column._editorBlurHandle){ column._editorBlurHandle.resume(); }
				dfd.resolve(cmp);
			}, 0);
			
			return dfd.promise;
		}
	}else if(column.editor){ // editor but not shared; always-on
		cmp = cellElement.widget || cellElement.input;
		if(cmp){
			dfd = new Deferred();
			if(cmp.focus){ cmp.focus(); }
			dfd.resolve(cmp);
			return dfd.promise;
		}
	}
	return null;
}

// editor column plugin function

return function(column, editor, editOn){
	// summary:
	//		Adds editing capability to a column's cells.
	
	var originalRenderCell = column.renderCell || Grid.defaultRenderCell,
		listeners = [],
		isWidget;
	
	if(!column){ column = {}; }
	
	// accept arguments as parameters to editor function, or from column def,
	// but normalize to column def.
	column.editor = editor = editor || column.editor || "text";
	column.editOn = editOn = editOn || column.editOn;
	
	isWidget = typeof editor != "string";
	
	// warn for widgetArgs -> editorArgs; TODO: remove @ 1.0
	if(column.widgetArgs){
		kernel.deprecated("column.widgetArgs", "use column.editorArgs instead",
			"dgrid 1.0");
		column.editorArgs = column.widgetArgs;
	}
	
	aspect.after(column, "init", editOn ? function(){
		var grid = column.grid;
		if(!grid.edit){ grid.edit = edit; }
		
		// Create one shared widget/input to be swapped into the active cell.
		column.editorInstance = createSharedEditor(column, originalRenderCell);
	} : function(){
		var grid = column.grid;
		if(!grid.edit){ grid.edit = edit; }
		
		if(isWidget){
			// add advice for cleaning up widgets in this column
			listeners.push(aspect.before(grid, "removeRow", function(rowElement){
				// destroy our widget during the row removal operation
				var cellElement = grid.cell(rowElement, column.id).element,
					widget = (cellElement.contents || cellElement).widget;
				if(widget){ widget.destroyRecursive(); }
			}));
		}
	});
	
	aspect.after(column, "destroy", function(){
		arrayUtil.forEach(listeners, function(l){ l.remove(); });
		if(column._editorBlurHandle){ column._editorBlurHandle.remove(); }
		
		if(editOn && isWidget){ column.editorInstance.destroyRecursive(); }
	});
	
	column.renderCell = editOn ? function(object, value, cell, options){
		// TODO: Consider using event delegation
		// (Would require using dgrid's focus events for activating on focus,
		// which we already advocate in README for optimal use)
		
		if(!options || !options.alreadyHooked){
			// in IE<8, cell is the child of the td due to the extra padding node
			on(cell.tagName == "TD" ? cell : cell.parentNode, editOn, function(){
				activeOptions = options;
				column.grid.edit(this);
			});
		}
		
		// initially render content in non-edit mode
		return originalRenderCell.call(column, object, value, cell, options);
		
	} : function(object, value, cell, options){
		// always-on: create editor immediately upon rendering each cell
		if(!column.canEdit || column.canEdit(object, value)){
			var cmp = createEditor(column);
			showEditor(cmp, column, cell, value);
			// Maintain reference for later use.
			cell[isWidget ? "widget" : "input"] = cmp;
		}else{
			return originalRenderCell.call(column, object, value, cell, options);
		}
	};
	
	return column;
};
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
'url:dijit/form/templates/Button.html':"<span class=\"dijit dijitReset dijitInline\" role=\"presentation\"\n\t><span class=\"dijitReset dijitInline dijitButtonNode\"\n\t\tdata-dojo-attach-event=\"ondijitclick:__onClick\" role=\"presentation\"\n\t\t><span class=\"dijitReset dijitStretch dijitButtonContents\"\n\t\t\tdata-dojo-attach-point=\"titleNode,focusNode\"\n\t\t\trole=\"button\" aria-labelledby=\"${id}_label\"\n\t\t\t><span class=\"dijitReset dijitInline dijitIcon\" data-dojo-attach-point=\"iconNode\"></span\n\t\t\t><span class=\"dijitReset dijitToggleButtonIconChar\">&#x25CF;</span\n\t\t\t><span class=\"dijitReset dijitInline dijitButtonText\"\n\t\t\t\tid=\"${id}_label\"\n\t\t\t\tdata-dojo-attach-point=\"containerNode\"\n\t\t\t></span\n\t\t></span\n\t></span\n\t><input ${!nameAttrSetting} type=\"${type}\" value=\"${value}\" class=\"dijitOffScreen\"\n\t\tdata-dojo-attach-event=\"onclick:_onClick\"\n\t\ttabIndex=\"-1\" role=\"presentation\" data-dojo-attach-point=\"valueNode\"\n/></span>\n"}});
define("dote-client/viewAdmin", [
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/ready",
	"dojo/store/Cache",
	"dojo/store/Memory",
	"dojo/store/Observable",
	"dijit/form/Button",
	"dgrid/OnDemandGrid",
	"dgrid/Keyboard",
	"dgrid/Selection",
	"dgrid/editor",
	"moment/moment",
	"./store/JsonRest",
	"./userControls",
	"./widgetModules"
], function(array, declare, ready, Cache, Memory, Observable, Button, OnDemandGrid, Keyboard, Selection, editor, moment,
		JsonRest, userControls){

	var dateTimeFormat = "DD/MM/YY HH:mm";

	var userStore = Cache(new JsonRest({
		target: "/users/"
	}), new Memory());

	var topicStore = Observable(Cache(new JsonRest({
		target: "/topics/"
	}), new Memory()));

	ready(function(){
		userControls.start();

		var widgets = [];

		var userGridColumns = [
			{ field: "id", label: "User ID" },
			editor({
				field: "admin",
				label: "Admin Flag",
				editor: "checkbox",
				editOn: "dblclick",
				autoSave: true
			}),
			editor({
				field: "owner",
				label: "Owner Flag",
				editor: "checkbox",
				editOn: "dblclick",
				autoSave: true
			}),
			editor({
				field: "committer",
				label: "Committer Flag",
				editor: "checkbox",
				editOn: "dblclick",
				autoSave: true
			}),
			editor({
				field: "attempts",
				label: "Attempts",
				editor: "text",
				editOn: "dblclick",
				autoSave: true
			}),
			{
				field: "lastLogin",
				label: "Last Login",
				get: function(object){
					return object.lastLogin ? moment.unix(object.lastLogin).format(dateTimeFormat) : null;
				}
			}
		];

		var userGrid = new declare([OnDemandGrid, Keyboard, Selection])({
			columns: userGridColumns,
			store: userStore
		}, "userGrid");

		var topicGridColumns = [
			{
				field: "id",
				label: "ID",
				formatter: function (value) {
					return '<a href="/topic/' + value + '" target="_blank">' + value + '</a>';
				}
			},
			editor({
				field: "title",
				label: "Title",
				editor: "text",
				editOn: "dblclick",
				autoSave: true
			}),
			{
				field: "voters",
				sortable: false,
				label: "Vote",
				get: function (object) {
					var vote = object.voters.length ? 0 : null;
					array.forEach(object.voters, function(item){
						vote += item.vote;
					});
					return (vote > 0 && vote !== null) ? "+" + vote : vote;
				}
			},
			{ field: "author", label: "Author" },
			{
				field: "created",
				label: "Created",
				get: function (object) {
					return moment.unix(object.created).format(dateTimeFormat);
				}
			},
			editor({
				field: "owner",
				label: "Owner",
				editor: "text",
				editOn: "dblclick",
				autoSave: true
			}),
			editor({
				field: "action",
				label: "Action",
				editor: "text",
				editOn: "dblclick",
				autoSave: true
			}),
			{
				field: "actioned",
				label: "Actioned",
				get: function (object) {
					return object.actioned ? moment.unix(object.actioned).format(dateTimeFormat) : null;
				}
			},
			{ field: "commentsCount", label: "Cmt" }
		];

		var topicGrid = new declare([OnDemandGrid, Keyboard, Selection])({
			columns: topicGridColumns,
			store: topicStore,
			selectionMode: "single"
		}, "topicGrid");

		topicGrid.on("dgrid-select", function (e) {
			if (deleteTopic.get("disabled")) {
				deleteTopic.set("disabled", false);
			}
		});

		topicGrid.on("dgrid-deselect", function (e) {
			for (var key in e.grid.selection) {
				return;
			}
			deleteTopic.set("disabled", true);
		});

		var deleteTopic = new Button({
			id: "deleteTopic",
			label: "Delete Topic",
			disabled: true
		}, "deleteTopic");
		deleteTopic.on("click", function () {
			for (var key in topicGrid.selection) {
				topicStore.remove(key);
			}
		});
		widgets.push(deleteTopic);

		array.forEach(widgets, function (widget) {
			widget.startup();
		});
	});

});