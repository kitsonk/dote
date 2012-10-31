define([
	"dojo/node!express",
	"dojo/node!stylus",
	"dojo/node!nib",
	"dojo/node!url",
	"./config",
	"./Storage",
	"./util",
	"dojo/_base/lang",
	"dojo/when"
], function(express, stylus, nib, url, config, Storage, util, lang, when){
	var app = express(),
		appPort = process.env.PORT || config.port || 8022;

	function compile(str, path){
		return stylus(str).
			set("filename", path).
			use(nib());
	}

	var topics = new Storage("store", "topics.json"),
		comments = new Storage("store", "comments.json");

	// Configure the server
	app.configure(function(){
		app.locals.pretty = true;
		app.set("view engine", "jade");
		app.set("views", "views");
		app.use(express.logger("dev"));
		app.use(express.compress());
		app.use(express.cookieParser());
		app.use(express.bodyParser());
		app.use(express.session({ secret: config.secret || "notset" }));
		app.use(app.router);

		app.use(stylus.middleware({
			src: ".",
			compile: compile,
			compress: true
		}));

		app.use("/_static", express["static"]("./_static"));
		app.use("/src", express["static"]("src"));

		app.use("/500", function(request, response, next){
			next(new Error("All your base are belong to us!"));
		});

		app.use(function(request, response, next){
			response.status(404);
			if(request.accepts("html")){
				response.render("404", { url: request.url });
				return;
			}else if(request.accepts("json")){
				response.send({ error: "Not Found", url: request.url });
				return;
			}
			response.type("text").send("Not Found");
		});

		app.use(function(error, request, response, next){
			response.status(error.status || 500);
			if(request.accepts("html")){
				response.render("500", {
					error: error,
					bugs: config.bugs || ""
				});
			}else if(request.accepts("json")){
				response.json({
					name: error.name,
					message: error.message,
					stack: error.stack.split("\n")
				});
			}else{
				response.type("text").send(error);
			}
		});
	});

	app.get("/", function(request, response, next){
		response.render("testTopicList", {

		});
	});

	app.get("/views/:view", function(request, response, next){
		response.render(request.params.view, {});
	});

	app.get("/topics", function(request, response, next){
		var range = request.header("Range") ? util.parseRange(request.header("Range")) : null,
			query = decodeURIComponent(url.parse(request.url).query || "");
		console.log("range", range || {});
		console.log("query", query);
		var results = topics.query(query, range || {});
		response.status(200);
		if(range){
			console.log("totalCount", results.totalCount);
			response.header("Content-Range", util.getContentRange(range.start, results.length,
				results.totalCount ? results.totalCount : results.length));
		}
		response.json(results);
	});

	app.get("/topics/:id", function(request, response, next){
		var topic = topics.get(request.params.id);
		if(topic){
			response.status(200);
			response.json(topic);
		}else{
			response.status(404);
			next();
		}
	});

	app.put("/topics/:id", function(request, response, next){
		var topic = request.body;
		topic.id = topic.id || request.params.id;
		if(topic = topics.put(topic)){
			response.status(200);
			response.json(topic);
		}else{
			response.status(404);
			next();
		}
	});

	app.get("/comments", function(request, response, next){
		response.status(200);
		response.send(comments.query());
	});

	app.get("/comments/:id", function(request, response, next){
		var comment = comments.get(request.params.id);
		if(comment){
			response.status(200);
			response.send(topic);
		}else{
			response.status(404);
			next();
		}
	});

	return {
		start: function(){
			app.listen(appPort);
			console.log("HTTP server started on port: " + appPort);
			return app;
		}
	};
});