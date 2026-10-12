import express from 'express';
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Hello, World from Railway!');
})

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
})
