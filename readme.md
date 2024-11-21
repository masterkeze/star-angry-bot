# 项目名称

star-angry-bot


## 安装

### 前提条件

确保你已经安装了以下软件：

- Node.js
- npm (通常随 Node.js 一起安装)

### 安装依赖

在项目根目录下运行以下命令来安装项目依赖：

```sh
npm install
```

## 配置

在secrets.json中配置用户名和密码

```json
{
	"hosts": [
	  {
		"name": "master",
		"url": "http://star-angry.mofengfeng.com",
		"username": "your_user_name",
		"password": "your_password"
	  },
	  {
		"name": "test",
		"url": "http://47.100.24.220:81",
		"username": "your_user_name",
		"password": "your_password"
	  }
	]
  }
```
``` javascript
// 修改index.js中 headless:true 浏览器后台运行    
const browser = await puppeteer.launch({ headless: false });
```
## 运行


```sh
npm run master
npm run test
```