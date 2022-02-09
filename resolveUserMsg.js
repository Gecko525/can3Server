const MSGTYPE = {
  EVENT: 'event',
  TEXT: 'text'
}

const EVENTTYPE = {
  SUBSCRIBE: 'subscribe'
}

module.exports = function (xml) {
  const { MsgType, Content, Event } = xml;
  const msgtype = MsgType[0];
  if (msgtype === MSGTYPE.EVENT) {
    const event = Event[0];
    if (event === EVENTTYPE.SUBSCRIBE) {
      return '谢谢你长得这么好看还来关注我 /:rose';
    }
  }

  if (msgtype === MSGTYPE.TEXT) {
    const content = Content[0];
    if (/love|爱你/.test(content)) {
      return '我也爱你，么么哒';
    }
    return '你好，我是小易';
  }

  return '';
}