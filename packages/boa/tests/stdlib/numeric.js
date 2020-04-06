

const { test } = require('tap');
const boa = require('../../');
const { version_info } = boa.import('sys');

test('Mathematical functions', t => {
  const math = boa.import('math');
  const np = boa.import('numpy');

  // Number-theoretic and representation functions
  t.strictEqual(math.ceil(10), 10);
  t.strictEqual(math.copysign(1.0, -1.0), -1);
  t.strictEqual(math.fabs(-100), 100);
  t.strictEqual(math.factorial(8), 40320);
  t.strictEqual(math.floor(100.99), 100);
  t.strictEqual(math.fmod(50, 100), 50);
  t.strictEqual(math.fsum(np.ones(100)), 100);
  // t.strictEqual(math.isfinite(Number.POSITIVE_INFINITY));

  // Power and logarithmic functions
  t.ok(math.exp(10));
  t.ok(math.log(100));

  // Trigonometric functions
  t.ok(math.acos(0.1));
  t.ok(math.asin(0.2));
  t.ok(math.atan(0.3));
  t.ok(math.atan2(0.5, 0.5));
  t.ok(math.cos(0.1));
  if (version_info.major === 3 && version_info.minor >= 8) {
    t.ok(math.dist(10, 30));
  }
  t.ok(math.sin(0.1));
  t.ok(math.tan(0.1));

  // Angular conversion
  t.ok(math.degrees(0.9));
  t.ok(math.radians(30));

  // Special functions
  t.ok(math.erf(0.1));
  t.strictEqual(math.gamma(1), 1);
  t.strictEqual(math.gamma(2), 1);
  t.strictEqual(math.gamma(3), 2);
  t.ok(math.lgamma(5));

  // Constants
  t.strictEqual(math.pi, 3.141592653589793);
  t.strictEqual(math.e, 2.718281828459045);
  t.strictEqual(math.tau, 6.283185307179586);
  t.ok(!isFinite(math.inf));
  t.ok(isNaN(math.nan));

  t.end();
});

test('Decimal fixed point and floating point arithmetic', t => {
  const { Decimal, getcontext } = boa.import('decimal');
  getcontext().prec = 6;
  t.strictEqual(`${Decimal(1).truediv(Decimal(7))}`, '0.142857');
  getcontext().prec = 12;
  t.strictEqual(`${Decimal(1).truediv(Decimal(7))}`, '0.142857142857');
  t.strictEqual(`${Decimal(1).add(2)}`, '3');
  t.strictEqual(`${Decimal(10).sub(Decimal(2.3))}`, '7.70000000000');
  t.strictEqual(`${Decimal(1.6).mul(Decimal(2.3))}`, '3.68000000000');
  t.ok(Decimal(1.6).divmod(Decimal(2.3)));
  t.ok(Decimal(1.6).mod(Decimal(2.3)));

  t.strictEqual(Decimal(3.14) == 3.14, true);
  t.strictEqual(Decimal(1).exp() == 2.71828182846, true);
  t.strictEqual(Decimal(2).fma(3, 5) == 11, true);
  t.strictEqual(Decimal('1.41421356').quantize(Decimal('1.000')) == 1.414, true);
  t.strictEqual(Decimal(18).remainder_near(Decimal(10)) == -2, true);
  t.strictEqual(Decimal(25).remainder_near(Decimal(10)) == 5, true);
  t.end();
});

test('Rational numbers', t => {
  const { Fraction } = boa.import('fractions');
  const { Decimal } = boa.import('decimal');
  t.strictEqual(Fraction(16, -10) == '-8/5', true);
  t.strictEqual(Fraction(123) == '123', true);
  t.strictEqual(Fraction('1.414213 \t\n') == '1414213/1000000', true);
  t.strictEqual(Fraction('7e-6') == '7/1000000', true);
  t.strictEqual(Fraction(Decimal('1.1')) == '11/10', true);
  t.end();
});

test('Generate pseudo-random numbers', t => {
  const random = boa.import('random');
  const { len } = boa.builtins();
  t.strictEqual(random.randrange(10) <= 10, true);
  t.strictEqual(random.randrange(5, 10) >= 5, true);
  {
    const choices = ['red', 'black', 'green'];
    t.strictEqual(choices.includes(random.choice(choices)), true);
  }
  {
    const choices = random.choices([1, 2, 4, 9, 30], boa.kwargs({
      k: 3
    }));
    t.strictEqual(len(choices), 3);
    const sample = random.sample([1, 3, 4, 4, 10, 100, 3], 2);
    t.strictEqual(len(sample), 2);
  }
  t.strictEqual(random.uniform(1, 5) >= 0, true);
  t.strictEqual(random.uniform(1, 5) <= 5, true);
  t.end();
});

test('Mathematical statistics functions', t => {
  const {
    mean,
    median,
    median_low,
    median_high,
    median_grouped,
    mode,
    pstdev,
    variance
  } = boa.import('statistics');

  t.equal(mean([1, 2, 3, 4, 4]), 2.8);
  t.equal(mean([-1.0, 2.5, 3.25, 5.75]), 2.625);
  t.equal(median([1, 3, 5]), 3);
  t.equal(median([1, 3, 5, 7]), 4.0);
  t.equal(median_low([1, 3, 5, 7]), 3);
  t.equal(median_high([1, 3, 5, 7]), 5);
  t.equal(median_grouped([52, 52, 53, 54]), 52.5);
  t.equal(mode(['red', 'blue', 'blue', 'red', 'green', 'red', 'red']), 'red');
  t.equal(pstdev([1.5, 2.5, 2.5, 2.75, 3.25, 4.75]), 0.986893273527251);
  t.equal(variance([2.75, 1.75, 1.25, 0.25, 0.5, 1.25, 3.5]), 1.3720238095238095);
  t.end();
});
