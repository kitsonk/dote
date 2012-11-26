define("dote-client/store/JsonRest", [
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/xhr",
	"dojo/store/JsonRest",
	"dojo/store/util/QueryResults"
], function(declare, lang, xhr, JsonRest, QueryResults){

	return declare([JsonRest], {

		// selectParam: String
		//		The query parameter to used for holding select information. If this is omitted, than
		//		the select information is included in a functional query token to avoid colliding
		//		with the set of name/value pairs.

		query: function(query, options){
			// summary:
			//		Queries the store for objects. This will trigger a GET request to the server, with the
			//		query added as a query string.
			// query: Object
			//		The query to use for retrieving objects from the store.
			// options: __QueryOptions?
			//		The optional arguments to apply to the resultset.
			// returns: Store.QueryResults
			//		The results of the query, extended with iterative methods.
			options = options || {};

			var headers = lang.mixin({ Accept: this.accepts }, this.headers, options.headers);

			if(options.start >= 0 || options.count >= 0){
				headers.Range = headers["X-Range"] //set X-Range for Opera since it blocks "Range" header
					 = "items=" + (options.start || '0') + '-' +
					(("count" in options && options.count != Infinity) ?
						(options.count + (options.start || 0) - 1) : '');
			}
			var hasQuestionMark = this.target.indexOf("?") > -1;
			if(query && typeof query == "object"){
				query = xhr.objectToQuery(query);
				query = query ? (hasQuestionMark ? "&" : "?") + query: "";
			}
			if(options && options.sort){
				var sortParam = this.sortParam;
				query += (query || hasQuestionMark ? "&" : "?") + (sortParam ? sortParam + '=' : "sort(");
				for(var i = 0; i<options.sort.length; i++){
					var sort = options.sort[i];
					query += (i > 0 ? "," : "") + (sort.descending ? '-' : '+') + encodeURIComponent(sort.attribute);
				}
				if(!sortParam){
					query += ")";
				}
			}
			if(options && options.select){
				var selectParam = this.selectParam;
				query += (query || hasQuestionMark ? "&" : "?") + (selectParam ? selectParam + '=' : "select(");
				query += options.select.join(",");
				if(!selectParam){
					query += ")";
				}
			}
			var results = xhr("GET", {
				url: this.target + (query || ""),
				handleAs: "json",
				headers: headers
			});
			results.total = results.then(function(){
				var range = results.ioArgs.xhr.getResponseHeader("Content-Range");
				return range && (range = range.match(/\/(.*)/)) && +range[1];
			});
			return QueryResults(results);
		}
	});
});