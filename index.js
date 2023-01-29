var httpProxy = require('http-proxy')
var http = require('http')
var auth = require('http-auth')

const basic = auth.basic({
    file: __dirname + "/htpasswd"
});

var proxy = httpProxy.createProxyServer()

var good_people = []

function getIp(req) {
    var ip = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddres || req.socket.remoteAddress || ''
    if (ip.split(',').length > 0) {
        ip = ip.split(',')[0]
    }
    return ip
}

var server = http.createServer(basic.check((req, res) => {
    good_people.push(getIp(req))
    res.write('you are now good')
    res.end()
}))
server.on('upgrade', function (req, socket, head) {
    if (good_people.indexOf(getIp(req)) >= 0) {
        proxy.ws(req, socket, head, {
            target: 'https://hack.chat/chat-ws',
            changeOrigin: true,
            ws: true,
        })
    }
})
server.listen(6060)
