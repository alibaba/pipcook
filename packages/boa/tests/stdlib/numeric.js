const test = require('ava');
const boa = require('../../');
const { version_info } = boa.import('sys');

test('Mathematical functions', t => {
  const math = boa.import('math');
  const np = boa.import('numpy');

  // Number-theoretic and representation functions
  t.is(math.ceil(10), 10);
  t.is(math.copysign(1.0, -1.0), -1);
  t.is(math.fabs(-100), 100);
  t.is(math.factorial(8), 40320);
  t.is(math.floor(100.99), 100);
  t.is(math.fmod(50, 100), 50);
  t.is(math.fsum(np.ones(100)), 100);
  // t.is(math.isfinite(Number.POSITIVE_INFINITY));

  // Power and logarithmic functions
  t.assert(math.exp(10));
  t.assert(math.log(100));

  // Trigonometric functions
  t.assert(math.acos(0.1));
  t.assert(math.asin(0.2));
  t.assert(math.atan(0.3));
  t.assert(math.atan2(0.5, 0.5));
  t.assert(math.cos(0.1));
  if (version_info.major === 3 && version_info.minor >= 8) {
    t.assert(math.dist(10, 30));
  }
  t.assert(math.sin(0.1));
  t.assert(math.tan(0.1));

  // Angular conversion
  t.assert(math.degrees(0.9));
  t.assert(math.radians(30));

  // Special functions
  t.assert(math.erf(0.1));
  t.is(math.gamma(1), 1);
  t.is(math.gamma(2), 1);
  t.is(math.gamma(3), 2);
  t.assert(math.lgamma(5));

  // Constants
  t.is(math.pi, 3.141592653589793);
  t.is(math.e, 2.718281828459045);
  t.is(math.tau, 6.283185307179586);
  t.assert(!isFinite(math.inf));
  t.assert(isNaN(math.nan));
});

test('Decimal fixed point and floating point arithmetic', t => {
  const { Decimal, getcontext } = boa.import('decimal');
  getcontext().prec = 6;
  t.is(`${Decimal(1).truediv(Decimal(7))}`, '0.142857');
  getcontext().prec = 12;
  t.is(`${Decimal(1).truediv(Decimal(7))}`, '0.142857142857');
  t.is(`${Decimal(1).add(2)}`, '3');
  t.is(`${Decimal(10).sub(Decimal(2.3))}`, '7.70000000000');
  t.is(`${Decimal(1.6).mul(Decimal(2.3))}`, '3.68000000000');
  t.assert(Decimal(1.6).divmod(Decimal(2.3)));
  t.assert(Decimal(1.6).mod(Decimal(2.3)));

  t.is(Decimal(3.14) == 3.14, true);
  t.is(Decimal(1).exp() == 2.71828182846, true);
  t.is(Decimal(2).fma(3, 5) == 11, true);
  t.is(Decimal('1.41421356').quantize(Decimal('1.000')) == 1.414, true);
  t.is(Decimal(18).remainder_near(Decimal(10)) == -2, true);
  t.is(Decimal(25).remainder_near(Decimal(10)) == 5, true);
});

test('Rational numbers', t => {
  const { Fraction } = boa.import('fractions');
  const { Decimal } = boa.import('decimal');
  t.is(Fraction(16, -10) == '-8/5', true);
  t.is(Fraction(123) == '123', true);
  t.is(Fraction('1.414213 \t\n') == '1414213/1000000', true);
  t.is(Fraction('7e-6') == '7/1000000', true);
  t.is(Fraction(Decimal('1.1')) == '11/10', true);
});

test('Generate pseudo-random numbers', t => {
  const random = boa.import('random');
  const { len } = boa.builtins();
  t.is(random.randrange(10) <= 10, true);
  t.is(random.randrange(5, 10) >= 5, true);
  {
    const choices = ['red', 'black', 'green'];
    t.is(choices.includes(random.choice(choices)), true);
  }
  {
    const choices = random.choices([1, 2, 4, 9, 30], boa.kwargs({
      k: 3
    }));
    t.is(len(choices), 3);
    const sample = random.sample([1, 3, 4, 4, 10, 100, 3], 2);
    t.is(len(sample), 2);
  }
  t.is(random.uniform(1, 5) >= 0, true);
  t.is(random.uniform(1, 5) <= 5, true);
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

  t.is(mean([1, 2, 3, 4, 4]), 2.8);
  t.is(mean([-1.0, 2.5, 3.25, 5.75]), 2.625);
  t.is(median([1, 3, 5]), 3);
  t.is(median([1, 3, 5, 7]), 4.0);
  t.is(median_low([1, 3, 5, 7]), 3);
  t.is(median_high([1, 3, 5, 7]), 5);
  t.is(median_grouped([52, 52, 53, 54]), 52.5);
  t.is(mode(['red', 'blue', 'blue', 'red', 'green', 'red', 'red']), 'red');
  t.is(pstdev([1.5, 2.5, 2.5, 2.75, 3.25, 4.75]), 0.986893273527251);
  t.is(variance([2.75, 1.75, 1.25, 0.25, 0.5, 1.25, 3.5]), 1.3720238095238095);
});
