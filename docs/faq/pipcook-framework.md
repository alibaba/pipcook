# Frequently Asked Questions

## <div id="q1">Where should I put the Pipcook JSON config file?</div>
Pipcook runs daemon behind the scene and provide the service to the user via command line tool or Pipboard. There is no restriction on the current working directory or where you should put your config file. You can run `pipcook run <url>` at any location and url is the path of your config file, which can be both local path or remote url.

## <div id="q2">Why is it so slow to install Pipcook</div>
Currently the installation of Pipcook and plugins rely on npm registry and pip(python) registry. Probably these default registries have slow connection to you. You can specify `pipcook init -c <npm client>`, for example, `pipcook init -c cnpm` to change your npm client. Meanwhile, you can use `pipcook init --tuna` to use tuna pip registry.

## <div id="q3">Can I use Pipcook in Electron?</div>
Thereotically as long as the environment supports Node.js >= 12.19 and corresponding N-API, you can run Pipcook smoothly. Meanwhile, Pipcook will support to produce WASM model so that you can easily integrate the model to your system.

## <div id="q4">Does Pipcook support Windows platform?</div>
Not yet. We will support Windows soon.
