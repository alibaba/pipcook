#include "function.h"

using namespace boa;
using namespace Napi;

PythonFunction::PythonFunction(Napi::Env env_, Napi::Function fn_,
                               PythonObject *target, bool isClassMethod_)
    : PythonReference(target), env(env_), isClassMethod(isClassMethod_) {
  jsref = Persistent(fn_);
  mMethodDef.ml_name = "boa.PythonFunction.Bound";
  mMethodDef.ml_flags = METH_VARARGS | METH_KEYWORDS;
  mMethodDef.ml_meth = reinterpret_cast<PyCFunction>(
      reinterpret_cast<void (*)(void)>(*Dispatcher));

  if (isClassMethod) {
    PyObject *fn = PyCFunction_New(&mMethodDef, mCapsule);
    assignTarget(PyInstanceMethod_New(fn));
  } else {
    assignTarget(PyCFunction_New(&mMethodDef, mCapsule));
  }
}

PyObject *PythonFunction::Dispatcher(PyObject *self, PyObject *args_in,
                                     PyObject *kwargs_in) {
  auto fn = PythonReference::Unwrap<PythonFunction>(self);
  EscapableHandleScope scope(fn->env);

  vector<napi_value> args(0);
  args.push_back(fn->jsref.Value());
  args.push_back(Boolean::New(fn->env, fn->isClassMethod));

  const ssize_t n_args_in = PyTuple_GET_SIZE(args_in);
  for (ssize_t i = 0; i < n_args_in; i++) {
    auto item =
        pybind::reinterpret_borrow<pybind::object>(PyTuple_GetItem(args_in, i));
    Object arg = PythonObject::NewInstance(fn->env, item);
    args.push_back(arg);
  }

  auto jthis = fn->scope()->Value().Get(NODE_PYTHON_WRAPPED_NAME).As<Object>();
  Function dispatch = jthis.Get(NODE_PYTHON_JS_DISPATCH).As<Function>();
  Value jval = scope.Escape(dispatch.Call(jthis, args));
  return fn->scope()->Cast(fn->env, jval);
}
