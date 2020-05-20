cp -r ./assets ./dist/
cp ./package.json ./dist/

# set the chmods
chmod +x ./dist/bin/index.js

enable_cmd() {
  cp ./dist/bin/$1.js ./dist/bin/$1
  chmod +x ./dist/bin/$1
}

enable_cmd pipcook
enable_cmd pipcook-plugin
enable_cmd pipcook-daemon
enable_cmd pipcook-job
enable_cmd pipcook-pipeline
