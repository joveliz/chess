const express = require('express')
const path = require('path')

const app = express()
const PORT = 8000

app.use(express.static(path.join(__dirname, 'public')))

app.get('*', (req, res) => {
    let curr_date = new Date(Date.now()).toISOString()

    res.status(404).json({ error: '404 not found!'})
    console.log(`${curr_date} 404 NOT FOUND: ${req.socket.remoteAddress}`)
})

app.listen(PORT, () => {
    let curr_date = new Date(Date.now()).toISOString()
    console.log(`${curr_date} Chess server listening on port ${PORT}.`)
});