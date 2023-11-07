const express = require('express');
const cors = require('cors');
const routes = require('./components/routes/routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/', routes);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
