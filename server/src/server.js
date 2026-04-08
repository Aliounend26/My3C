import { app } from "./app.js";
import { connectDatabase } from "./config/db.js";

const port = process.env.PORT || 5000;

connectDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Unable to start server", error);
    process.exit(1);
  });
