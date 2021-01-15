# 常见问题

### 在 yolov5 的链路中我怎样指定用哪张显卡进行训练?
<a id="q1"></a>
你可以设置 `$CUDA_VISIBLE_DEVICES`  这个环境变量，它的值就是你的显卡编号，默认我们会使用 GPU:0 进行训练。注意环境变量需要设置在 daemon 进程运行的机器上，并且在 daemon 启动之前设置。

### 在 yolov5 的训练中我怎样指定仅使用 cpu 训练？
<a id="q2"></a>
如果你的环境支持 GPU 训练，我们默认会使用 GPU。如果你想禁掉此功能，可以设置环境变量 `export CUDA_VISIBLE_DEVICES=""`。 注意环境变量需要设置在 daemon 进程运行的机器上，并且在 daemon 启动之前设置。
