import path from "node:path";
import express from "express";
import config from "./src/config/config";
import router from "./src/routing/router";

const app = express();

app.use(express.static(path.join(import.meta.dir, "public")));
app.use(router);

app.listen(config.Port, () =>
	console.log(`Server on http://localhost:${config.Port}`),
);
