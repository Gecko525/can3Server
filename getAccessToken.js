const rp = require('request-promise');

module.exports = async function () {
  const { Token } = require("./db");
  const tokens = await Token.findAll();
  if (tokens.length === 1) {
    const token0 = tokens[0];
    const { token, expires, updatedAt } = token0.dataValues;
    // 判断有没有过期
    if (Date.now() - new Date(updatedAt).getTime() < (expires - 50) * 1000) {
      return token;
    }
  }

  // 重新获取
  const { APPID, APPSECRET } = process.env;
  const res = await rp({
    method: 'GET',
    uri: 'https://api.weixin.qq.com/cgi-bin/token',
    qs: {
      grant_type: 'client_credential',
      appid: `${APPID}`,
      secret: `${APPSECRET}`
    },
    json: true
  })

  console.log(res);
  if (res.errcode) {
    throw new Error(res.errmsg);
  }
  await Token.destroy({
    truncate: true
  });
  await Token.create({
    token: res.access_token,
    expires: res.expires_in
  })

  return res.access_token;
}