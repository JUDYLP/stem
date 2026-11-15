# GitHub Pages 发布

目标仓库由用户指定：https://github.com/JUDYLP/stem 。2026-11-15，git ls-remote --heads 返回空且退出0：当时未发现远程分支。

采用 GitHub 官方静态 Pages workflow：[文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

首次配置：仓库 Settings → Pages → Build and deployment → Source 选择 GitHub Actions。2026-11-15已通过重跑成功确认配置生效。推送 main 后工作流会生成并部署纯静态包。目标 URL 应以成功的 Actions 输出为准，不能仅靠拼接地址宣称已上线。

`python tools/package_site.py _site` 只复制8个明确列出的页面资源及.nojekyll，不包含.git、docs、tests或秘密文件。输出目录必须不存在，脚本不删除或覆盖任何已有目录。

本地检查也可用 `python tools/package_site.py work/site-check-1`。在项目根目录启动HTTP后，访问对应子路径，验证资源使用相对URL。脚本只在打包/发布时使用；网站本身无构建运行时依赖。

发布验收：工作流成功、真实HTTPS URL未登录可访问、三题加载、Demo无Key、子路径资源无404。公开仓库、配置文件或push成功都不能代替此验收。

状态详见 TASKS 与 QA_REPORT；API/CORS尚未测试，公开预览成功后再进行。

## 2026-11-15 实际发布结果

- 已推送 main，提交 752dd3f030b96811f7490929f8f2ff4b84c6ca05，保留完整开发历史，无force push。
- 已通过已连接GitHub元数据确认仓库visibility=private，不能声称已公开。
- 工作流 https://github.com/JUDYLP/stem/actions/runs/43706124478 实际失败。
- checkout及静态打包成功；actions/configure-pages@v5失败：Get Pages site failed / Not Found，提示启用Pages并设为GitHub Actions。
- 未上传部署artifact，未生成经验证的线上URL。
- 用户待办：Settings中改Public，Settings→Pages→Source选择GitHub Actions；完成后重跑失败任务并检查HTTPS站点。
- 连接器没有更改可见性/Pages配置的操作，Chrome自动审批服务额度不足；未绕过审批、未擅自获取凭证。

## 2026-11-15 设置修复后复验

用户完成Public和Pages设置后，连接器确认visibility=public。已重跑上述工作流，第2次attempt最终completed/success；部署源码commit为752dd3f030b96811f7490929f8f2ff4b84c6ca05。

实际HTTPS地址：https://judylp.github.io/stem/ 。独立Chrome上下文unscripted-https无需登录访问成功，加载三道题。浏览器fetch(cache:reload)检查index.html、styles.css、src/{main,questions,storage,export,demo}.js、data/questions.json：8项均200，分别为HTML/CSS/JavaScript/JSON正确类型。浏览器crypto.subtle SHA-256与本地Get-FileHash逐项一致。

390px手机模拟视口：scrollWidth=innerWidth=390；完整截图检查Demo反馈、Retry、自评和退出无遮挡。Demo流程及退出成功，正式localStorage保持原值，控制台无消息，应用加载仅有同源资源请求。旧部署阻塞已解除；真实手机、API/CORS不在本次通过范围。
