'use strict';

const boa = require('@pipcook/boa');
const np = boa.import('numpy');
const datasets = boa.import('sklearn.datasets');
const model_selection = boa.import('sklearn.model_selection');
const metrics = boa.import('sklearn.metrics');
const ensemble = boa.import('sklearn.ensemble');
const plt = boa.import('matplotlib.pyplot');

const { enumerate } = boa.builtins();
const { train_test_split } = model_selection;
const { GradientBoostingRegressor } = ensemble;
const { load_boston } = datasets;
const { mean_squared_error } = metrics;

const boston = load_boston();
const [X, y] = [boston.data, boston.target];
const [X_train, X_test, y_train, y_test] = train_test_split(X, y, boa.kwargs({ random_state: 8 }));
const params = {
    'n_estimators': 500, 'max_depth': 4, 'min_samples_split': 2,
    'learning_rate': 0.01, 'loss': 'ls'
}

// Fit regression model
const clf = GradientBoostingRegressor(boa.kwargs(params));
clf.fit(X_train, y_train);
const mse = mean_squared_error(y_test, clf.predict(X_test));
let feature_importance = clf.feature_importances_;
feature_importance = np.multiply(np.divide(feature_importance, np.max(feature_importance)), 100);
const sorted_idx = np.argsort(feature_importance);
const pos = np.add(np.arange(sorted_idx.shape[0]), 0.5);

console.log("mse", mse);

// compute test set deviance
const test_score = np.zeros((params['n_estimators']), boa.kwargs({ dtype: np.float64 }));
for (const [i, y_pred] of enumerate(clf.staged_predict(X_test))) {
    test_score[i] = clf.loss_(y_test, y_pred);
}

// numpy advanced indexing
const ndReindex = (nd_array, sorted_idx) => {
    const tmp = [];
    for (const [i, index] of enumerate(sorted_idx)) {
        tmp.push(nd_array[index])
    }
    return tmp;
}

// plot training deviance
plt.figure(boa.kwargs({ figsize: [12, 6] }));
plt.subplot(1, 2, 1);
plt.title('Deviance');
plt.plot(np.arange(params['n_estimators']), clf.train_score_, 'b-', boa.kwargs({ label: 'Training Set Deviance' }));
plt.plot(np.arange(params['n_estimators']), test_score, 'r-', boa.kwargs({ label: 'Test Set Deviance' }));
plt.legend(boa.kwargs({ loc: 'upper right' }));
plt.xlabel('Boosting Iterations');
plt.ylabel('Deviance');

// plot feature importance
plt.subplot(1, 2, 2)
plt.barh(pos, ndReindex(feature_importance, sorted_idx), boa.kwargs({ align: 'center' }))
plt.yticks(pos, ndReindex(boston.feature_names, sorted_idx))
plt.xlabel('Relative Importance');
plt.title('Variable Importance');

plt.show();
