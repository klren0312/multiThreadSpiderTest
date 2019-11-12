const cheerio = require('cheerio')
const tableParser = require('cheerio-tableparser')
const rp = require('request-promise')

/**
 * 获取数据
 */
async function getData () {
  const listUrl = 'http://hq.zgw.com/hefei/jiancai.html'
  const body = await rp({ uri: listUrl })
  const $ = cheerio.load(body)
  // 从列表获取内容页链接放入数组
  let list = $('body > div.wrap > div.cslm_tit > div.hq_con > div.fl.lm_left > div.lm_list > ul:nth-child(2) li')
  const listArr = []
  list.each((index, item) => {
    listArr.push('http://hq.zgw.com' + $(item).children('a').attr('href'))
  })
  console.time('timer')
  Promise.all(listArr.map(v => {
    return getPrice(v).then(res => {
      return {
        link: v,
        data: JSON.stringify(res)
      }
    })
  })).then(res => {
    console.log(res)
    console.timeEnd('timer')
  })
}

getData()

/**
 * 获取价格
 * @param {string} url 价格页链接
 */
async function getPrice (url) {
  const tableSelector = 'body > div.wrap > div.cslm_tit > div.hq_con > div.fl.lm_left > div > div.lm_m > div.lm_mt > div.article > table'
  const body = await rp({ uri: url })
  const $ = cheerio.load(body)
  const priceCol = spiderTable(tableSelector, $, false)[4]
  priceCol.shift()
  const pricesFormat = priceCol.map(v => $(v).data().type)
  const otherData = spiderTable(tableSelector, $, true)
  const nameCol = otherData[0]
  const sizeCol = otherData[1]
  nameCol.shift()
  sizeCol.shift()
  const ironArr = []
  for (let i = 0, len = nameCol.length; i < len; i++) {
    ironArr.push({
      name: nameCol[i],
      size: sizeCol[i],
      price: pricesFormat[i]
    })
  }
  return ironArr
}

/**
 * 解析表格数据
 * @param {string} tableSelector 表格选择器
 * @param {function} $ cheerio
 * @param {boolean} noHtml 是否需要清除html标签
 */
function spiderTable (tableSelector, $, noHtml) {
  tableParser($)
  return $(tableSelector).parsetable(false, false, noHtml)
}