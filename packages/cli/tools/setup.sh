cp ./package.json ./dist/

enable_cmd() {
  cp ./dist/bin/$1.js ./dist/bin/$1
  chmod +x ./dist/bin/$1
}

enable_cmd pipcook
