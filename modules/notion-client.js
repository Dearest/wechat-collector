const { Client, LogLevel } = require("@notionhq/client")

const notion = new Client({
  auth: 'secret_paR41u3RUAF26yR8rzaboyBCA5O01FDQvtHIDxsqTe7',
  logLevel: LogLevel.DEBUG,
})

function createUrlBlock(url) {
  return {
    "object": 'block',
    "type": "bookmark",
    "bookmark": {
      "url": url
    }
  }
}
function createParagraphBlock(content) {
  return {
    "object": 'block',
    "type": "paragraph",
    "paragraph": {
      "text": [{
        "type": "text",
        "text": {
          "content": content,
          "link": null
        }
      }]
    }
  }
}

function fetchUrlTitle(url) {
  return fetch(url)
    .then(response => response.text())
    .then(html => {
      let title = html.match(/<title>(.*?)<\/title>/)
      if (title) return title[1]

      title = html.match(/<meta name="description" content="(.*)" \/>/)
      if (title) return title[1]

      return url
    })
}

async function getTitleAndBlock(content) {
  if (content.slice(0,4) === 'http') {
    let title = await fetchUrlTitle(content)
    return [title, createUrlBlock(content)]
  }
  return [content, createParagraphBlock(content)]
}

async function buildPageConfig(content) {
  const [title, block] = await getTitleAndBlock(content)
  return {
    parent: { database_id: process.env.NOTION_INBOX_ID},
    properties: {
      Name: {
        title: [
          {
            text: {
              content: title,
            },
          },
        ],
      },
    },
    children: [block]
  }
}

export async function saveToNotion(content) {
  const pageConfig = await buildPageConfig(content)
  return new Promise((resolve, reject) => {
    try {
      const response = notion.pages.create(pageConfig)
      resolve(response)
    } catch (error) {
      reject(error)
    }
  })
}
