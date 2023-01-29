var httpProxy = require('http-proxy')
var http = require('http')
var auth = require('http-auth')
var winston = require('winston')

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: 'log.log',
            maxsize: 1024,
        })
    ]
})

const basic = auth.basic({
    file: __dirname + "/htpasswd"
})

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
    logger.info(`ip: ${getIp(req)}, user: ${req.user} is authed.`)
    good_people.push(getIp(req))
    res.writeHead(200, { 'Content-Type': 'text/plain;charset=utf-8' })
    res.write('访问 https://hcer.netlify.app/?your-channel@wss://hcproxy.onrender.com 以开始使用本代理！\n以下限制是为特殊时期所准备，目前测试阶段，开放任何人使用。\n已经认证当前ip地址。\n请注意：为了防止其他人未经许可使用本代理，清谨慎使用公共的代理ip访问本代理。\n所有代理用户的ip一样，所以rate limit是难免的。请不要使用代理发送过多信息干扰他人使用。\n为了防止使用代理损害其它用户的利益，我（4n0n4me）随时有权关闭代理、删除用户。\n作为公共代理，本代理限制较多，不如初墨的很正常，不满意请使用初墨镜像。')
    res.end()
}))

server.on('upgrade', function (req, socket, head) {
    logger.info(`ip: ${getIp(req)} requests proxy.`)
    if ((true)||good_people.indexOf(getIp(req)) >= 0) {
        logger.info(`ip: ${getIp(req)} is authed and proxied.`)
        proxy.ws(req, socket, head, {
            target: 'https://hack.chat/chat-ws',
            changeOrigin: true,
            ws: true,
        })
    }
})
server.listen(process.env.PORT ?? 6060)
