'use strict';

// See https://pytorch.org/tutorials/intermediate/spatial_transformer_tutorial.html

const boa = require('../../');
const { enumerate, len } = boa.builtins();
const torch = boa.import('torch');
const { nn, optim } = torch;
const F = nn.functional;
const { datasets, transforms } = boa.import('torchvision');

function createLoader(train) {
  return torch.utils.data.DataLoader(
    datasets.MNIST(boa.kwargs({
      root: './.data',
      train,
      download: train,
      transform: transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize([0.5], [0.5]),
      ]),
    })),
    boa.kwargs({
      batch_size: 64,
      shuffle: true,
      num_workers: 4,
    })
  );
}

const train_loader = createLoader(true);
const test_loader = createLoader(false);
console.log(train_loader, test_loader);

class MyNet extends nn.Module {
  constructor() {
    super();
    this.conv1 = nn.Conv2d(1, 10, boa.kwargs({ kernel_size: 5 }));
    this.conv2 = nn.Conv2d(10, 20, boa.kwargs({ kernel_size: 5 }));
    this.conv2_drop = nn.Dropout2d();
    this.fc1 = nn.Linear(320, 50);
    this.fc2 = nn.Linear(50, 10);

    // Spatial transformer localization-network
    this.localization = nn.Sequential(
      nn.Conv2d(1, 8, boa.kwargs({ kernel_size: 7 })),
      nn.MaxPool2d(2, boa.kwargs({ stride: 2 })),
      nn.ReLU(true),
      nn.Conv2d(8, 10, boa.kwargs({ kernel_size: 5 })),
      nn.MaxPool2d(2, boa.kwargs({ stride: 2 })),
      nn.ReLU(true)
    );

    // Regressor for the 3 * 2 affine matrix
    this.fc_loc = nn.Sequential(
      nn.Linear(10 * 3 * 3, 32),
      nn.ReLU(true),
      nn.Linear(32, 3 * 2)
    );

    // Initialize the weights/bias with identity transformation
    this.fc_loc[2].weight.data.zero_();
    this.fc_loc[2].bias.data.copy_(
      torch.tensor([1, 0, 0, 0, 1, 0], boa.kwargs({ dtype: torch.float }))
    );
  }
  stn(x) {
    const xs = this.localization(x).view(-1, 10 * 3 * 3);
    const theta = this.fc_loc(xs).view(-1, 2, 3);
    const grid = F.affine_grid(theta, x.size())
    return F.grid_sample(x, grid);
  }
  forward(x) {
    let r = this.stn(x);

    // Perform the usual forward pass
    r = F.relu(F.max_pool2d(this.conv1(r), 2));
    r = F.relu(F.max_pool2d(this.conv2_drop(this.conv2(r)), 2));
    r = r.view(-1, 320);
    r = F.relu(this.fc1(r));
    r = F.dropout(r, boa.kwargs({ training: this.training }));
    r = this.fc2(r);
    return F.log_softmax(r, boa.kwargs({ dim: 1 }));
  }
}

const device = torch.device('cpu');
const model = (new MyNet()).to(device);
const optimizer = optim.SGD(model.parameters(), boa.kwargs({ lr: 0.01 }));
// Outputs as:
//
// Module(
//   (conv1): Conv2d(1, 10, kernel_size=(5, 5), stride=(1, 1))
//   (conv2): Conv2d(10, 20, kernel_size=(5, 5), stride=(1, 1))
//   (conv2_drop): Dropout2d(p=0.5, inplace=False)
//   (fc1): Linear(in_features=320, out_features=50, bias=True)
//   (fc2): Linear(in_features=50, out_features=10, bias=True)
//   (localization): Sequential(
//     (0): Conv2d(1, 8, kernel_size=(7, 7), stride=(1, 1))
//     (1): MaxPool2d(kernel_size=2, stride=2, padding=0, dilation=1, ceil_mode=False)
//     (2): ReLU(inplace=True)
//     (3): Conv2d(8, 10, kernel_size=(5, 5), stride=(1, 1))
//     (4): MaxPool2d(kernel_size=2, stride=2, padding=0, dilation=1, ceil_mode=False)
//     (5): ReLU(inplace=True)
//   )
//   (fc_loc): Sequential(
//     (0): Linear(in_features=90, out_features=32, bias=True)
//     (1): ReLU(inplace=True)
//     (2): Linear(in_features=32, out_features=6, bias=True)
//   )
// )
console.log(model, optimizer);

// Train the model functions
function train_model() {
  model.train();
  enumerate(train_loader).forEach((item, i) => {
    const data = item[0].to(device);
    const target = item[1].to(device);
    optimizer.zero_grad();
    const output = model(data);
    const loss = F.nll_loss(output, target);
    loss.backward();
    optimizer.step();
    
    // print the step
    if (i % 20 === 0) {
      console.log(`Train Epoch: %s [%d/%d]` +
                  `\tLoss: %d`,
                  new Date(), len(data) * i, len(train_loader.dataset),
                  loss.item());
    }
  });
  console.log('train completed');
}

function test_model() {
  boa.with(torch.no_grad(), () => {
    model.eval();
    let test_loss = 0;
    let correct = 0;
    enumerate(test_loader).forEach(item => {
      const data = item[0].to(device);
      const target = item[1].to(device);
      const output = model(data);
      // sum up batch loss
      test_loss += F.nll_loss(output, target, boa.kwargs({
        size_average: false
      })).item();

      // get the index of the max log-probability
      // eslint-disable-next-line prefer-destructuring
      const pred = output.max(1, boa.kwargs({ keepdim: true }))[1];
      correct += pred.eq(target.view_as(pred)).sum().item();
    });

    test_loss /= len(test_loader.dataset);
    console.log(`Test set: Average loss=%d, Accuracy=%d/%d`,
                test_loss, correct, len(test_loader.dataset));
  });
}

train_model();
test_model();
