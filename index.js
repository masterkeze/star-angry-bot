const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

// 解析命令行参数
const argv = yargs
  .option('host', {
    alias: 'h',
    describe: '选择要启动的主机名称',
    type: 'string',
    demandOption: true
  })
  .help()
  .argv;

// 读取 secrets.json 文件
const secretsPath = path.join(__dirname, 'secrets.json');
const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));

// 查找指定的主机信息
const hostInfo = secrets.hosts.find(host => host.name === argv.host);
if (!hostInfo) {
  console.error(`未找到名称为 ${argv.host} 的主机信息`);
  process.exit(1);
}

async function runScript(hostInfo) {
  try {
    // 启动浏览器
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // 监听浏览器的 console 事件
    page.on('console', msg => {
      const args = msg.args();
      const values = args.map(arg => arg.toString());
      console.log(`Browser console: ${values.join(' ')}`);
    });

    // 导航到登录页面
    await page.goto(`${hostInfo.url}/#/login`);

    // 填写登录表单
    await page.type('input[placeholder="请输入用户名"]', hostInfo.username);
    await page.type('input[placeholder="请输入密码"]', hostInfo.password);
    await page.click('button[type="button"]'); // 替换为你的提交按钮选择器

    // 等待登录成功后的页面加载
    await page.waitForNavigation();

    await page.goto(`${hostInfo.url}/#/planet`);
    await page.waitForNavigation();

    // 定义游戏自动玩法的函数
    function updateStructure(page, structureName) {
      return page.evaluate((structureName) => {
        const structureNameDivs = document.querySelectorAll('.structure-name');
        let node = Array.from(structureNameDivs).find(x => x.innerText === structureName);
        if (node) {
          let button = node.parentNode.parentNode.parentNode.nextElementSibling.nextElementSibling.children[0];
          if (!button.disabled) {
            button.click();
            console.log(new Date().toISOString()+' 升级：' + structureName);
          }
        }
      }, structureName);
    }

    function getCapacity(page, structureName) {
      return page.evaluate((structureName) => {
        const structureNameDivs = document.querySelectorAll('.structure-name');
        let node = Array.from(structureNameDivs).find(x => x.innerText === structureName);
        if (node) {
          let capacity = node.parentNode.parentNode.parentNode.nextElementSibling.children[0].children[0].children[1].children[0].children[0].innerText;
          return parseFloat(capacity);
        } else {
          return 0;
        }
      }, structureName);
    }

    async function gamePlay(page) {
      if (await getCapacity(page, "金属仓库") > 1) {
        await updateStructure(page, "金属仓库");
      }
      if (await getCapacity(page, "能量仓库") > 1) {
        await updateStructure(page, "能量仓库");
      }
      if (await getCapacity(page, "重氢仓库") > 1) {
        await updateStructure(page, "重氢仓库");
      }
      if (await getCapacity(page, "太阳能电站") < 1000) {
        await updateStructure(page, "太阳能电站");
        await updateStructure(page, "聚变反应堆");
      } else {
        await updateStructure(page, "金属矿场");
        await updateStructure(page, "能量矿场");
        await updateStructure(page, "重氢精炼厂");
      }
    }

    // 设置定时任务，每5秒执行一次游戏自动玩法
    const interval = 5000; // 5秒
    setInterval(async () => {
      await gamePlay(page);
    }, interval);

    // 定义一个函数来输出进度信息
    async function outputProgress() {
      console.log('脚本正在运行，当前时间为:', new Date().toISOString());
	  console.log('当前电量为:',await getCapacity(page, "太阳能电站"));
    }

    // 设置定时任务，每10分钟输出一次进度信息
    const progressInterval = 10 * 60 * 1000; // 10分钟
    setInterval(outputProgress, progressInterval);

	await page.waitForSelector('.structure-name'); // 等待某个特定元素出现，表示页面已加载完毕
    await outputProgress();

    // 监听浏览器关闭事件
    browser.on('disconnected', () => {
      console.log('浏览器已关闭，停止脚本...');
      process.exit(0); // 结束进程
    });

    // 保持浏览器打开
    await new Promise(resolve => {});
  } catch (error) {
    console.error('Error:', error);
  }
}

runScript(hostInfo).catch(console.error);