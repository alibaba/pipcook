# Frequently Asked Questions

### <div id="q1">How can I specify which GPU card to use for yolov5 training?</div>
You can just set the environment variable `$CUDA_VISIBLE_DEVICES` to your GPU card number to achieve this. If this environment variable is not set, plugins will just use GPU:0 for default

### <div id="q2">How can I tell plugins not to use GPU even you have right GPU and cuda environment for yolov5 training?</div>
By default, plugins will use GPU if the environment is good for GPU training. If you want to disable this feature, just set `export CUDA_VISIBLE_DEVICES=""`
