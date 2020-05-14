cd packages/pipboard && npm run build && mkdir -p ../daemon/src/app/public && cp -r ./build/. ../daemon/src/app/public \
&& cd ../cli/assets && mkdir -p server && rsync -av --progress ../../daemon/. server --exclude=node_modules
