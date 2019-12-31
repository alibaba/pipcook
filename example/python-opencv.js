
/**
 * This is an example to run Python opencv in pipcook-python-node.
 * 
 * Use Python.install to install python packages
 * Use Python.import to import python packages
 * Use python.nA to specify names parameters.
 * For others, just use it as python, but acutally we are writing JS codes!
 * 
 * For more information, Please refer to https://github.com/alibaba/pipcook/wiki/%E6%83%B3%E8%A6%81%E4%BD%BF%E7%94%A8python%EF%BC%9F
 */


const {Python} = require('@pipcook/pipcook-python-node');

async function train () {
  await Python.scope('test1', (python) => {
    const _ = python.nA;

    python.runshell('ls -a')

    python.install('opencv-python');
    python.install('requests');
    const cv2 = python.import('cv2');
    const np = python.import('numpy');
    const requests = python.import('requests');

    const url = python.createString('https://img.alicdn.com/tfs/TB1Ha0tnbr1gK0jSZFDXXb9yVXa-192-60.png', true);
    const resp = requests.get(url, _({stream: true})).raw

    let image = np.asarray(python.buildin('bytearray', resp.read()), _({dtype: 'uint8'}));
    image = cv2.imdecode(image, cv2.IMREAD_COLOR);


    python.print(image.shape)
  });
}

train();

