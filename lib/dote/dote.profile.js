var profile = (function(){
	var testResourceRe = /^dote\/tests\//,

		copyOnly = function(filename, mid){
			var list = {
				"dote/dote.profile":1,
				"dote/package.json":1
			};
			return (mid in list) || (/^dote\/resources\//.test(mid) && !/\.(css|styl)$/.test(filename)) || /(png|jpg|jpeg|gif|tiff)$/.test(filename);
		};

	return {
		resourceTags:{
			test: function(filename, mid){
				return testResourceRe.test(mid);
			},

			copyOnly: function(filename, mid){
				return copyOnly(filename, mid);
			},

			amd: function(filename, mid){
				return !testResourceRe.test(mid) && !copyOnly(filename, mid) && /\.js$/.test(filename);
			}
		}
	};
})();