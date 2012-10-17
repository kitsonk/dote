require([
	"dote-server/Storage"
], function(Topics){
	var topics = new Topics("store", "topics.json");
	topics.add({
		title: "Convert Dijit Buttons Background to be Pink",
		description: "I think we should make the default theme for Dojo.  We have had blue for a long time with claro and Pink is such a much more attractive colour.",
		action: "rejected",
		owner: "wildbill",
		tags: ["dijit", "css", "themes", "ui"],
		voters: [
			{ name: "kitsonk", vote: 1 },
			{ name: "neonstalwart", vote: -1 },
			{ name: "wildbill", vote: -1 },
			{ name: "ttrenka", vote: -1 }
		],
		commentsCount: 12
	});
	topics.add({
		title: "Eliminate Core and Adopt TypeScript as the New Dojo Standard",
		description: "We should really consider eliminating the Dojo core wholly and instead adopt Microsoft's TypeScript as the standard.",
		action: "open",
		owner: "kriszyp",
		tags: [ "dojo", "core", "alternatives" ],
		voters: [
			{ name: "kitsonk", vote: 1 },
			{ name: "dylanks", vote: -1 },
			{ name: "csnover", vote: 0 }
		],
		commentsCount: 290
	});
	topics.query().forEach(function(item){
		console.log(item);
	});
});