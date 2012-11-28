define([
	"dojo/Deferred",
	"setten/dfs",
	"dojo/node!stylus",
	"dojo/node!nib"
], function(Deferred, dfs, stylus, nib){

	function compile(str){
		var dfd = new Deferred();
		stylus(str).use(nib()).render(function(err, css){
			if(err) dfd.reject(err);
			dfd.resolve(css);
		});
		return dfd.promise;
	}

	return {
		normalize: function(/*string*/ id, /*Function*/ toAbsMid){
			return /^\./.test(id) ? toAbsMid(id) : id;
		},

		load: function(/*string*/ id, /*Function*/ require, /*Function*/ load){
			dfs.readFile(require.toUrl(id), "utf8").then(compile).then(load).otherwise(function(){
				load("not-a-stylesheet");
			});
		}
	};
});