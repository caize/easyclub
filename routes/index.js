const router = require('koa-router')();
const config = require('../config');
const Promise = require('promise');
const Page = require('../common/page');

router.get('/', async function (ctx, next) {

  let current_tag = config.tags.indexOf(ctx.query.tag ) > -1
      ? ctx.query.tag : 'all';

  // +号让其转换为数字
  let current_page = +ctx.query.page || 1;

  // 读取主题列表
  let Topic = ctx.model('topic');
  // 组合查询对象
  let query = {deleted: false};
  if(current_tag != 'all')
    query.tag = current_tag;
  // 计算分页数据
  let start_item_num = (current_page - 1) * config.pageSize;
  
  // 查询总条数
  let count = await Topic.countQ(query); 
  let all_page_num = Math.ceil(count / config.pageSize);
  
  let page = Page.get(current_page, all_page_num, config.showPageNum);
  

  let topics = await Topic.find(query)
    .sort({
      last_reply_at: -1
    }).skip(start_item_num)
    .limit(config.pageSize).execQ();
  
  //  读取用户信息
  let User = ctx.model("user");
  
  topics = await Promise.all(topics.map( async (topic) => {
    topic.author = await User.findOneQ({
      _id: topic.author_id
    });
    return topic;
  }));
  

  await ctx.render('index', {
    title: '首页',
    topics: topics,
    tags: config.tags,
    current_tag: current_tag,
    page: page
  }); 
})
module.exports = router;
