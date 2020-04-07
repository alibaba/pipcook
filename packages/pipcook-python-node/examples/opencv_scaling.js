const { Python } = require('../dist/index');

async function train () {
  await Python.scope('test1', (python) => {
    const _ = python.nA;
    python.install('opencv-python');
    python.install('requests');
    const cv2 = python.import('cv2');
    const np = python.import('numpy');
    const requests = python.import('requests');

    const url = python.createString('https://img.alicdn.com/tfs/TB1Ha0tnbr1gK0jSZFDXXb9yVXa-192-60.png', true);
    const resp = requests.get(url, _({ stream: true })).raw;

    let image = np.asarray(python.buildin('bytearray', resp.read()), _({ dtype: 'uint8' }));
    image = cv2.imdecode(image, cv2.IMREAD_COLOR);


    python.print(image.shape);
  });
}

train();

