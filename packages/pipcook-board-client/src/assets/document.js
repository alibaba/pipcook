const document = `
<style>
  h1 {
    font-size: 32px;
  }
  h2 {
    font-size: 28px;
  }
  p {
    font-size: 16px;
  }
  li {
    font-size: 15px;
  }
  code {
    font-size: 15px;
  }
</style>
<h1 id="pipcook">pipcook</h1>
<p>With the mission of enabling front-end engineers to utilize the power of machine learning without any prerequisites and the vision to lead front-end technical field to the intelligentization, pipcook has become the one-step front-end algorithm platform from processing data to deploying models. Pipcook is focused on the front-end area and developed from the front-end developers&#39; view. With the principle of being friendly for web developers, pipcook will push the whole area forward with the engine of machine learning. We are named &#39;pipcook&#39; since our platform is based on pip (pipeline) and we also want to include the python ecosystem (python PyPI)</p>
<h2 id="quick-start">Quick Start</h2>
<ul>
<li>Environment: Node.js &gt;= 10.16, Npm &gt;= 6.1</li>
<li>Python: python &gt;= 3.6 with correct pip installed (This is required if you want to use pipcook-python-node. </li>
</ul>
<p>We recommend to install pipcook-cli to manage pipcook projects:</p>
<pre><code><span class="hljs-selector-tag">sudo</span> <span class="hljs-selector-tag">npm</span> <span class="hljs-selector-tag">install</span> <span class="hljs-selector-tag">-g</span> @<span class="hljs-keyword">pipcook</span>/<span class="hljs-keyword">pipcook</span>-<span class="hljs-keyword">cli</span>
</code></pre><p>You can initialize a pipcook project with just a few commands:</p>
<pre><code><span class="hljs-built_in">mkdir</span> pipcook-example &amp;&amp; <span class="hljs-built_in">cd</span> pipcook-example
pipcook init
<span class="hljs-built_in">cd</span> pipcook-project
</code></pre><p>note: if you use some client other than npm, such as cnpm (taobao mirror), you can specify client by</p>
<pre><code>pipcook <span class="hljs-keyword">init</span> -<span class="hljs-built_in">c</span> cnpm
</code></pre><h2 id="documentation">Documentation</h2>
<p>Please refer to <a target="_blank" href="https://alibaba.github.io/pipcook/doc/pipcook%20%E6%98%AF%E4%BB%80%E4%B9%88-zh">中文</a>｜ <a target="_blank" href="https://alibaba.github.io/pipcook/doc/What%20is%20Pipcook%3F-en">english</a></p>
<h2 id="run-your-first-pipcook-pipeline">Run your first pipcook pipeline</h2>
<p>In the initialized folder, we have prepared several samples for you, They are:</p>
<ul>
<li>pipeline-mnist-image-classification: pipeline for classific Mnist image classification problem.</li>
<li>pipeline-databinding-image-classification: pipeline example to train the iamge classification task which is to classifify <a href="https://www.imgcook.com/">imgcook</a> databinding pictures.</li>
<li>pipeline-object-detection: pipeline example to train object detection task which is for component recognition used by imgcook</li>
<li>python-keras: example to use Python Keras library to train deep leraning network in js syntax and runtime</li>
</ul>
<p>For example, you can quickly run the pipeline to do a mnist image classification. To start the pipeline, just run:</p>
<pre><code><span class="hljs-keyword">node</span> <span class="hljs-title">examples</span>/pipeline-mnist-image-classification.js
</code></pre><h2 id="how-to-contribute">How to contribute</h2>
<p>Please make sure you have installed Typescript and Lerna. To check, run the following commands:</p>
<pre><code><span class="hljs-attribute">lerna -v
tsc -v</span>
</code></pre><p>First, clone the repository. Then, to bootstrap the lerna project (install all dependencies for npm packages), run:</p>
<pre><code><span class="hljs-attribute">lerna bootstrap</span>
</code></pre><p>Please focus on the codes in <code>src</code> directory. Each time after you change something, run below command to compile codes:</p>
<pre><code>lerna <span class="hljs-keyword">run</span><span class="bash"> compile</span>
</code></pre><h2 id="roadmap">RoadMap</h2>
<p> <img  src="https://img.alicdn.com/tfs/TB1qsKJtkT2gK0jSZFkXXcIQFXa-824-1178.jpg"  width="400"  height="580"></p>

`;

module.exports = document;