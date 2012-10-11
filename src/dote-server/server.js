define([
	"dojo/node!util",
	"dojo/node!express",
	"dojo/node!stylus",
	"dojo/node!nib",
	"./config"
], function(util, express, stylus, nib, config){
	var app = express(),
		appPort = process.env.PORT || config.port || 8022;

	function compile(str, path){
		return stylus(str).
			set("filename", path).
			use(nib());
	}

	// Configure the server
	app.configure(function(){
		app.locals.pretty = true;
		app.set("view engine", "jade");
		app.set("views", "views");
		app.use(express.cookieParser());
		app.use(express.session({ secret: config.secret || "notset" }));
		app.use(app.router);

		app.use(express.logger("dev"));
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
				response.send({ error: error });
			}else{
				response.type("text").send(error);
			}
		});
	});

	app.get("/*", function(request, response, next){
		if(request.params[0] == "404" || /^_static/.test(request.params[0]) || /^src/.test(request.params[0])){
			next();
		}else{
			response.render("index",{

			});
		}
	});

	return {
		start: function(){
			app.listen(appPort);
			util.puts("HTTP server started on port: " + appPort);
		}
	};
});