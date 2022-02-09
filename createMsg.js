module.exports = function (xml) {
  const { ToUserName, FromUserName, MsgType, Content } = xml;
  return `
    <xml>
      <ToUserName><![CDATA[${ToUserName}]]></ToUserName>
      <FromUserName><![CDATA[${FromUserName}]]></FromUserName>
      <CreateTime>${Date.now()}</CreateTime>
      <MsgType><![CDATA[${MsgType}]]></MsgType>
      <Content><![CDATA[${Content}]]></Content>
    </xml>
  `;
}