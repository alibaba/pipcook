t1=$(date +%s)
npm install
t2=$(date +%s)
install_time=$((t2-t1))
echo install_time

t1=$(date +%s)
npm run dev-build
t2=$(date +%s)
esbuild_time=$((t2-t1))

t1=$(date +%s)
npm run build
t2=$(date +%s)
build_time=$((t2-t1))

./packages/cli/dist/bin/pipcook daemon start
t1=$(date +%s)
npm run test
t2=$(date +%s)
test_time=$((t2-t1))

t1=$(date +%s)
./packages/cli/dist/bin/pipcook run ./example/pipelines/mnist-image-classification.json
t2=$(date +%s)
mnist_time=$((t2-t1))

git clone https://github.com/imgcook/pipcook-benchmark.git
cd pipcook-benchmark
new_json="{\"install_time\":$install_time, \"esbuild_time\":$esbuild_time, \"build_time\":$build_time, \"test_time\":$test_time, \"mnist_time\":$mnist_time, \"timestamp\": $(date +%s)}"
echo $new_json

echo $(cat data.json | jq ". + [$new_json]")  > data.json