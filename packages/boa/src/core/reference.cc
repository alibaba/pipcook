#include "reference.h"

namespace boa {

PythonReference::PythonReference(PythonObject *scope) : mScope(scope) {
  mCapsule = PyCapsule_New(this, nullptr, nullptr);
}

template <typename T> T *PythonReference::Unwrap(PyObject *wrapped) {
  return reinterpret_cast<T *>(PyCapsule_GetPointer(wrapped, nullptr));
}

PyObject *PythonReference::Finalize(PyObject *self, PyObject *args_in,
                                    PyObject *kwargs_in) {
  Unwrap(self)->mScope->Unref();
  return Py_None;
}

void PythonReference::addFinalizer() {
  if (mTarget == nullptr) {
    throw std::invalid_argument("mTarget need to be setup in constructor.");
  }
  mFinalizerDef.ml_name = "boa.PythonReference.Finalizer";
  mFinalizerDef.ml_flags = METH_VARARGS;
  mFinalizerDef.ml_meth = reinterpret_cast<PyCFunction>(
      reinterpret_cast<void (*)(void)>(*Finalize));
  mFinalizer = PyCFunction_New(&mFinalizerDef, mCapsule);
  mWeakref = PyWeakref_NewRef(mTarget, mFinalizer);
  // ref the scope object
  mScope->Ref();
}

void PythonReference::assignTarget(PyObject *target) {
  if (target == nullptr) {
    throw std::invalid_argument("target must not be nullptr.");
  }
  if (mTarget != nullptr) {
    throw std::invalid_argument("`mTarget` allows seting once.");
  }
  mTarget = target;
}

PyObject *PythonReference::target() {
  if (mTarget == nullptr) {
    throw std::invalid_argument("`mTarget` must be setup.");
  }
  return mTarget;
}

PythonObject *PythonReference::scope() { return mScope; }

// template specialization for sub-classes.
template PythonReference *PythonReference::Unwrap(PyObject *wrapped);
template PythonFunction *PythonReference::Unwrap(PyObject *wrapped);

} // namespace boa
