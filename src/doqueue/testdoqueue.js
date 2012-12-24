require([
	"doqueue/Queue",
	"doqueue/storage/MongoDB",
	"doqueue/timer"
], function(Queue, MongoDB, timer){
	// var db = new MongoDB({
	// 	url: "mongodb://localhost:27017/test",
	// 	collection: "test"
	// });
	// db.ready.then(function(){
	// 	db.add({
	// 		test: "value"
	// 	}).then(function(response){
	// 		console.log(response);
	// 	});
	// });
	var queue = new Queue({
		storeOptions: {
			url: "mongodb://localhost:27017/doqueue",
			collection: "queue"
		}
	});
	queue.ready().then(function(){
		var item = queue.create("email", {
			to: "me@kitsonkelly.com",
			from: "dote@kitsonkelly.com"
		});
		setInterval(function(){
			queue.create("email", {
				to: "me@kitsonkelly.com",
				from: "dote@kitsonkelly.com"
			});
		}, 1550);
		// console.log(item);
		var handle = queue.on("email", function(item){
			console.log("handler1", item);
		});
		queue.on("email", function(item){
			console.log("handler2", item);
		});
	});
	// timer(1000).on("tick", function(){
	// 	console.log("tick");
	// });
});