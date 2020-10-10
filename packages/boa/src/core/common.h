#pragma once

#define PY_SSIZE_T_CLEAN
#include <Python.h>
#include <atomic>
#include <pybind11/embed.h>

namespace boa {

/**
 * Flags an object as keyword arguments.
 */
#define NODE_PYTHON_KWARGS_NAME "__kwargs__"
/**
 * Flags an object as a Python Bytes object.
 */
#define NODE_PYTHON_BYTES_NAME "__bytes__"
#define NODE_PYTHON_VALUE_NAME "__value__"
#define NODE_PYTHON_HANDLE_NAME "__handle__"
#define NODE_PYTHON_WRAPPED_NAME "__wrapped__"
#define NODE_PYTHON_JS_DISPATCH "__jsdispatch__"

/**
 * a RAII wrapper for `std::atomic_flag`, just like the class `lock_guard<Mutex>`.
 */
class atomic_guard {
public:
  inline atomic_guard(std::atomic_flag &lock) : lock(lock) {
    while (this->lock.test_and_set(std::memory_order_acquire))
      ;
  };
  inline ~atomic_guard() { this->lock.clear(std::memory_order_release); };

private:
  std::atomic_flag &lock;
};

/**
 * a thread-safe class to shre the object ownership.
 */
template <typename T> class ObjectOwnership {
public:
  ObjectOwnership(T *o) : _holder(o), _owned(false) {}

public:
  T *getObject() { return _holder; }
  bool getOwned() const {
    atomic_guard l(_atomic);
    return _owned;
  }
  void setOwned(bool owned) {
    atomic_guard l(_atomic);
    _owned = owned;
  }

private:
  mutable std::atomic_flag _atomic = ATOMIC_FLAG_INIT;
  T *_holder;
  bool _owned;
};

class PythonNode;
class PythonModule;
class PythonReference;
class PythonObject;
class PythonFunction;
class PythonError;

} // namespace boa

namespace pybind = pybind11;
