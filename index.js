const Koa = require("koa");
const Router = require("koa-router");
const logger = require("koa-logger");
const bodyParser = require("koa-bodyparser");
const xmlParser = require('koa-xml-body');
const fs = require("fs");
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require("path");
const rp = require('request-promise');
const createMsg = require('./createMsg');
const resolveUserMsg = require('./resolveUserMsg');
const getAccessToken = require('./getAccessToken');

const { NODE_ENV } = process.env;
if (NODE_ENV === 'development') {
  dotenv.config();
}

const { init: initDB, Counter } = require("./db");

const router = new Router();

// 首页
router.get("/", async (ctx) => {
  const homePage = fs.readFileSync(path.join(__dirname, "index.html"), "utf-8");
  ctx.body = homePage;
});

// token验证
router.get("/wx", async (ctx) => {
  const { signature, timestamp, nonce, echostr } = ctx.request.query;
  const token = 'can3Server';

  const list = [token, timestamp, nonce];
  list.sort();
  const sha1 = crypto.createHash('sha1');
  sha1.update(list.join(''))
  const hashcode = sha1.digest('hex');
  ctx.body = hashcode === signature ? echostr : '';
})

router.post("/wx", async (ctx) => {
  console.log(ctx.request.body);
  const xml = ctx.request.body.xml;
  if (!xml) ctx.body = 'success';
  const { ToUserName, FromUserName } = xml;
  const res = resolveUserMsg(xml);
  const resXml = {
    ToUserName: FromUserName,
    FromUserName: ToUserName,
    MsgType: typeof res === 'string' ? 'text' : res.MsgType,
    Content: typeof res === 'string' ? res : res.Content
  }
  ctx.body = createMsg(resXml);
})

// 更新计数
router.post("/api/count", async (ctx) => {
  const { request } = ctx;
  const { action } = request.body;
  if (action === "inc") {
    await Counter.create();
  } else if (action === "clear") {
    await Counter.destroy({
      truncate: true,
    });
  }

  ctx.body = {
    code: 0,
    data: await Counter.count(),
  };
});

// 获取计数
router.get("/api/count", async (ctx) => {
  const result = await Counter.count();

  ctx.body = {
    code: 0,
    data: result,
  };
});

// 更新菜单
router.post('/api/menu', async (ctx) => {
  const { content } = ctx.request.body;
  const access_token = await getAccessToken();
  const res = await rp({
    method: 'POST',
    uri: 'https://api.weixin.qq.com/cgi-bin/menu/create',
    qs: { access_token },
    body: JSON.parse(content),
    json: true
  });
  console.log(res);
  ctx.body = {
    code: res.errcode,
    messge: res.errmsg
  };
})

// 获取菜单
router.get("/api/menu", async (ctx) => {
  const access_token = await getAccessToken();
  const res = await rp({
    method: 'GET',
    uri: 'https://api.weixin.qq.com/cgi-bin/get_current_selfmenu_info',
    qs: { access_token },
    json: true
  });
  console.log(res);
  if (res.errcode !== 0) {
    ctx.body = {
      code: res.errcode,
      message: res.errmsg
    };
    return;
  }
  ctx.body = {
    code: 0,
    message: 'ok',
    data: res.selfmenu_info
  };
});

// 小程序调用，获取微信 Open ID
router.get("/api/wx_openid", async (ctx) => {
  if (ctx.request.headers["x-wx-source"]) {
    ctx.body = req.headers["x-wx-openid"];
  }
});

const app = new Koa();
app
  .use(logger())
  .use(xmlParser())
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods());

const port = process.env.PORT || 80;
async function bootstrap () {
  await initDB();
  app.listen(port, () => {
    console.log("启动成功", port);
  });
}
bootstrap();
