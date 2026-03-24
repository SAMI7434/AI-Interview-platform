import dotenv from "dotenv";

dotenv.config();

import app from "./app";
import http from "http";

const port = process.env.PORT || 5000;

const httpServer = http.createServer(app);

httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// For serverless deployment (commented out for local dev)
// import serverless from "serverless-http";
// module.exports.handler = serverless(app);
