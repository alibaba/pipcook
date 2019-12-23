const document = `
<h1>Pipcook 是什么？</h1>
<!doctype html>
<div class="lake-content-editor-core lake-engine" data-lake-element="root" data-selection-654014="%7B%22path%22%3A%5B%5D%2C%22uuid%22%3A%22654014%22%2C%22active%22%3Atrue%7D">
  <p style="font-size: 14px; color: rgb(38, 38, 38); line-height: 24px; letter-spacing: 0.05em; outline-style: none; overflow-wrap: break-word; margin: 0px;">Pipcook<span style="color: #191F25;"><span> 以前端工程师 0 门槛应用机器学习能力为使命，以引领前端技术领域走向智能化为愿景,&nbsp; 发展成为了</span><span>从处理数据、训练模型到服务部署的一站式前端算法工程平台。</span></span>Pipcook<span style="color: #191F25;"><span> 将专注在前端领域，始终秉持着站在前端工程师视角开发，对前端工程师友好的原则，最终推动装上机器学习引擎的前端行业向前发展。</span></span></p>
  <p style="font-size: 14px; color: rgb(38, 38, 38); line-height: 24px; letter-spacing: 0.05em; outline-style: none; overflow-wrap: break-word; margin: 0px;"><span style="color: #191F25;"><br></span></p>
  <h3 id="wB8yF" style="padding: 7px 0px; margin: 0px; font-weight: 700; font-size: 20px; line-height: 28px;">工作原理</h3>
  <div data-card-type="block" data-lake-card="hr" id="F4v2y">
    <hr style="background-color: rgb(232, 232, 232); border: 1px solid transparent; margin: 18px 0px;">
  </div>
  <p style="font-size: 14px; color: rgb(38, 38, 38); line-height: 24px; letter-spacing: 0.05em; outline-style: none; overflow-wrap: break-word; margin: 0px;"><br></p>
  <p style="font-size: 14px; color: rgb(38, 38, 38); line-height: 24px; letter-spacing: 0.05em; outline-style: none; overflow-wrap: break-word; margin: 0px;">Pipcook 的核心是一条 pipeline， 在这个 pipeline 中，将会有一系列插件嵌入，每个插件负责机器学习生命周期特定的环节。每个插件的输入和输出的数据将会在这个 pipeline 中流通。Pipcook&nbsp;基于 Rxjs 的响应式框架，负责对 pipeline 中的数据进行响应、调度和管理。Pipcook 的这条 pipeline 如下图所示：</p>
  <p style="font-size: 14px; color: rgb(38, 38, 38); line-height: 24px; letter-spacing: 0.05em; outline-style: none; overflow-wrap: break-word; margin: 0px;"><br></p>
  <p style="font-size: 14px; color: rgb(38, 38, 38); line-height: 24px; letter-spacing: 0.05em; outline-style: none; overflow-wrap: break-word; margin: 0px;"><span data-card-type="inline" data-lake-card="image"><img data-role="image" src="https://cdn.nlark.com/yuque/0/2019/png/654014/1575897474605-2e5a38ad-060d-4c08-ab83-2b4fadf973a8.png?x-oss-process=image/resize,w_1500" data-raw-src="https://cdn.nlark.com/yuque/0/2019/png/654014/1575897474605-2e5a38ad-060d-4c08-ab83-2b4fadf973a8.png" class="image lake-drag-image" alt="image.png" title="image.png" style="visibility: visible; border: none; box-shadow: none; width: 746px; height: 311px;"></span></p>
  <p style="font-size: 14px; color: rgb(38, 38, 38); line-height: 24px; letter-spacing: 0.05em; outline-style: none; overflow-wrap: break-word; margin: 0px;"><br></p>
  <p style="font-size: 14px; color: rgb(38, 38, 38); line-height: 24px; letter-spacing: 0.05em; outline-style: none; overflow-wrap: break-word; margin: 0px;">我们的插件机制有很高的可扩展性，遵循着一个插件只做一件事情的原则，Flowcook 通过串联起这些插件来实现一个机器学习工程链路。同时，对于用户来讲，用户只需调用一些简单的 API，即可指定所需要的插件，搭建起一个项目来。</p>
  <p style="font-size: 14px; color: rgb(38, 38, 38); line-height: 24px; letter-spacing: 0.05em; outline-style: none; overflow-wrap: break-word; margin: 0px;"><br></p>
  <h3 id="fUpgW" style="padding: 7px 0px; margin: 0px; font-weight: 700; font-size: 20px; line-height: 28px;">快速开始</h3>
  <div data-card-type="block" data-lake-card="hr" id="62MyY">
    <hr style="background-color: rgb(232, 232, 232); border: 1px solid transparent; margin: 18px 0px;">
  </div>
  <p style="font-size: 14px; color: rgb(38, 38, 38); line-height: 24px; letter-spacing: 0.05em; outline-style: none; overflow-wrap: break-word; margin: 0px;">是否已经迫不及待开始一个 Pipcook 工程?，请<a href="https://github.com/alibaba/pipcook/wiki/%E5%BF%AB%E9%80%9F%E5%85%A5%E9%97%A8" target="_blank">参考这里来快速开始</a>一个工程吧</p>
  <p style="font-size: 14px; color: rgb(38, 38, 38); line-height: 24px; letter-spacing: 0.05em; outline-style: none; overflow-wrap: break-word; margin: 0px;"><br></p>
  <h3 id="uXh3I" style="padding: 7px 0px; margin: 0px; font-weight: 700; font-size: 20px; line-height: 28px;">概念</h3>
  <div data-card-type="block" data-lake-card="hr" id="hc68I">
    <hr style="background-color: rgb(232, 232, 232); border: 1px solid transparent; margin: 18px 0px;">
  </div>
  <ul lake-indent="0" style="list-style-type: disc; margin: 0px; padding-left: 23px; font-size: 14px; color: rgb(38, 38, 38); line-height: 24px; letter-spacing: 0.05em; outline-style: none; overflow-wrap: break-word;">
    <li>plugin：Pipcook 插件，我们将提供内置插件, 同时支持第三方插件，每个插件负责做一件事，负责具体的一项机器学习生命周期中的任务</li>
    <li>component：component 由 Pipcook 提供，负责解析插件内容，用户在使用的时候需要将 plugin 传入到 component 当中解析</li>
    <li>pipeline： Pipcook 的插件插入到 pipeline 中，pipeline 中流通数据和模型，每个插件会拦截这些数据做处理，然后再释放数据</li>
    <li>runner： Pipcook 核心调度，我们将所有 component 传入给 runner 启动 Pipcook 工程</li>
  </ul>
  <p style="font-size: 14px; color: rgb(38, 38, 38); line-height: 24px; letter-spacing: 0.05em; outline-style: none; overflow-wrap: break-word; margin: 0px;"><br></p>
  <h3 id="3UYG8" style="padding: 7px 0px; margin: 0px; font-weight: 700; font-size: 20px; line-height: 28px;">进阶</h3>
  <div data-card-type="block" data-lake-card="hr" id="k8tAr">
    <hr style="background-color: rgb(232, 232, 232); border: 1px solid transparent; margin: 18px 0px;">
  </div>
  <p style="font-size: 14px; color: rgb(38, 38, 38); line-height: 24px; letter-spacing: 0.05em; outline-style: none; overflow-wrap: break-word; margin: 0px;">在亲手搭建了一个机器学习项目之后，您是否想了解 pipcook 的更多信息，您可以查看以下链接了解更多</p>
  <ul lake-indent="0" style="list-style-type: disc; margin: 0px; padding-left: 23px; font-size: 14px; color: rgb(38, 38, 38); line-height: 24px; letter-spacing: 0.05em; outline-style: none; overflow-wrap: break-word;">
    <li><a href="https://github.com/alibaba/pipcook/wiki/%E6%8F%92%E4%BB%B6%E4%BB%8B%E7%BB%8D" target="_blank">了解更多关于插件的信息</a></li>
    <li><a href="https://github.com/alibaba/pipcook/wiki/%E6%83%B3%E8%A6%81%E4%BD%BF%E7%94%A8python%EF%BC%9F" target="_blank">想要使用 python ？</a></li>
    <li><a href="https://github.com/alibaba/pipcook/wiki/%E5%86%85%E7%BD%AE-pipeline-%E8%AF%A6%E7%BB%86%E4%BB%8B%E7%BB%8D" target="_blank" class="">了解更多内置 pipeline 的信息</a></li>
    <li><a href="https://github.com/alibaba/pipcook/wiki/pipcook-cli" target="_blank">了解更多命令行工具 pipcook-cli 的信息</a></li>
  </ul>
  <p style="font-size: 14px; color: rgb(38, 38, 38); line-height: 24px; letter-spacing: 0.05em; outline-style: none; overflow-wrap: break-word; margin: 0px;"><br></p>
  <p style="font-size: 14px; color: rgb(38, 38, 38); line-height: 24px; letter-spacing: 0.05em; outline-style: none; overflow-wrap: break-word; margin: 0px;"><br></p>
  <h3 id="fi47u" style="padding: 7px 0px; margin: 0px; font-weight: 700; font-size: 20px; line-height: 28px;">想要 Contribute ?</h3>
  <div data-card-type="block" data-lake-card="hr" id="150Dm" class="">
    <hr style="background-color: rgb(232, 232, 232); border: 1px solid transparent; margin: 18px 0px;">
  </div>
  <p style="font-size: 14px; color: rgb(38, 38, 38); line-height: 24px; letter-spacing: 0.05em; outline-style: none; overflow-wrap: break-word; margin: 0px;"><span style="color: rgb(36, 41, 46); font-size: 16px; line-height: 24px;" class="lake-fontsize-12" data-mce-style="font-size: 12px">请参考我们的</span><a href="https://github.com/alibaba/pipcook/wiki/%E5%BC%80%E5%8F%91%E8%80%85%E6%89%8B%E5%86%8C" target="_blank">开发者手册</a></p>
</div>
`

module.exports = document;