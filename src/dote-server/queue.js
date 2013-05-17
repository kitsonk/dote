define([
	"doqueue/Queue",
	"./config"
], function(Queue, config){

	return new Queue({
		storeOptions: {
			url: process.env.MONGOLAB_URI || config.db.url,
			collection: "queue"
		}
	});

});