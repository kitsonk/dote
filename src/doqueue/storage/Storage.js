define([
	"compose"
], function(compose){

	var required = compose.required;

	return compose(function(options){
		options = options || {};
	}, {
		type: "storage",
		ready: null,
		get: required,
		put: required,
		add: required,
		remove: required,
		query: required,

		empty: function(){
			return this.query().then(function(items){
				var removes = [],
					self = this;
				items.forEach(function(item){
					if(item.id){
						removes.push(self.remove(item.id));
					}
				});
				return all(removes);
			});
		}
	});

});