import dotenv from "dotenv";
import connectDb from "./db/index.js";
import { app } from "./app.js";
dotenv.config({
  path: "./.env",
});
const port = process.env.PORT || 7000;

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`App is listening on port:${port}`);
    });
  })
  .catch((error) => {
    console.log("Express server connection failed !!", error);
  });
