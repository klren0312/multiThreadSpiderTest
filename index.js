const { Worker } = require('worker_threads')
const cheerio = require('cheerio')
const rp = require('request-promise')

/**
 * 创建线程
 * @param {string} link 内容页链接
 */
const task = (link) => new Promise((resolve, reject) => {
  const worker = new Worker(__dirname + '/thread.js', {
    workerData: link
  })
  worker.once('message', resolve)
  worker.on('error', reject)
  worker.on('exit', code => {
    if (code !== 0) {
      reject(new Error(`worker stopped with exit code ${code}`))
    }
  })
})

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
  // 将数组中链接分给各个线程
  Promise.all(listArr.map(v => task(v))).then(res => {
    console.log(res)
    console.timeEnd('timer')
  })
}

getData()