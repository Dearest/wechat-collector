import { formatMessage, parseXML, reply } from '/modules/wechat'
import { saveToNotion } from '/modules/notion-client';

export default async function callbackHandler(req, res) {
  if (req.method === 'GET') {
    // 开启开发者模式
    res.status(200).send(req.query.echostr)
  } else {
    const result = await parseXML(req.body);
    const message = formatMessage(result.xml)

    // 创建4.5s的定时器在创建page超时前返回消息给微信,防止微信重试
    const delayer = new Promise((resolve, reject) => {
      setTimeout(resolve, 4500, 'timeout');
    });
    // 创建notion page
    const createNotionPage = saveToNotion(message.Content);

    Promise.race([delayer, createNotionPage])
      .then(value => (value === 'timeout') ? '创建超时,请重试' : '保存成功')
      .then((replyContent) => {
        console.log(`reply content: ${replyContent}`)
        res.setHeader('Content-Type', 'application/xml')
        const replyMessage = reply(replyContent, message.ToUserName, message.FromUserName)
        res.status(200).send(replyMessage)
      })
  }
}
