require([
	"dojo/dom",
	"dojo/on",
	"dojo/store/Cache",
	"dojo/store/JsonRest",
	"dojo/store/Memory",
	"dojo/store/Observable",
	"dojo/when"
], function(dom, on, Cache, JsonRest, Memory, Observable, when){
	var store = new JsonRest({
		target: "/topics/"
	});
	on(dom.byId("exec"), "click", function(e){
		var results = store.query("?" + encodeURIComponent(dom.byId("query").value), {
			start: 1,
			count: 1
		});
		when(results.total, function(total){
			console.log("total", total);
			when(results, function(r){
				console.log(r);
			});
		});
	});
});