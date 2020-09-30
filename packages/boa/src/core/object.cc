#include "object.h"
#include "error.h"
#include "function.h"

using namespace boa;
using namespace Napi;

Object PythonObject::Init(Napi::Env env, Object exports) {
  Napi::HandleScope scope(env);
  Napi::Function func = DefineClass(
      env, "boa.Object",
      {
          InstanceMethod("next", &PythonObject::Next),
          InstanceMethod("invoke", &PythonObject::Invoke),
          InstanceMethod("createClass", &PythonObject::CreateClass),
          InstanceMethod("isCallable", &PythonObject::IsCallable),
          InstanceMethod("isIterator", &PythonObject::IsIterator),
          InstanceMethod("isMapping", &PythonObject::IsMapping),
          InstanceMethod("isSequence", &PythonObject::IsSequence),
          InstanceMethod("toBigInt", &PythonObject::ToBigInt),
          InstanceMethod("toPrimitive", &PythonObject::ToPrimitive),
          InstanceMethod("toString", &PythonObject::ToString),
          InstanceMethod("toPointer", &PythonObject::ToPointer),
          InstanceMethod("setClassMethod", &PythonObject::SetClassMethod),
          // Python magic methods
          InstanceMethod("__hash__", &PythonObject::Hash),
          InstanceMethod("__hasattr__", &PythonObject::HasAttr),
          InstanceMethod("__getattr__", &PythonObject::GetAttr),
          InstanceMethod("__setattr__", &PythonObject::SetAttr),
          InstanceMethod("__delattr__", &PythonObject::DelAttr),
          InstanceMethod("__getitem__", &PythonObject::GetItem),
          InstanceMethod("__setitem__", &PythonObject::SetItem),
          InstanceMethod("__delitem__", &PythonObject::DelItem),
      });

  Napi::FunctionReference *constructor = new Napi::FunctionReference();
  *constructor = Persistent(func);
  env.SetInstanceData(constructor);

  exports.Set("PythonObject", func);
#define DEFINE_CONSTANT(macro) exports.Set(#macro, macro)
  DEFINE_CONSTANT(NODE_PYTHON_KWARGS_NAME);
  DEFINE_CONSTANT(NODE_PYTHON_BYTES_NAME);
  DEFINE_CONSTANT(NODE_PYTHON_VALUE_NAME);
  DEFINE_CONSTANT(NODE_PYTHON_HANDLE_NAME);
  DEFINE_CONSTANT(NODE_PYTHON_WRAPPED_NAME);
  DEFINE_CONSTANT(NODE_PYTHON_JS_DISPATCH);
#undef DEFINE_CONSTANT

  return exports;
}

Object PythonObject::NewInstance(Napi::Env env, pybind::object src) {
  return env.GetInstanceData<Napi::FunctionReference>()->New(
      {External<pybind::object>::New(env, &src)});
}

PythonObject::PythonObject(const CallbackInfo &info)
    : ObjectWrap<PythonObject>(info) {
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);
  if (info[0].IsNumber()) {
    auto pointer = (uintptr_t)info[0].As<Number>().DoubleValue();
    _self = pybind::reinterpret_borrow<pybind::object>(reinterpret_cast<PyObject*>(pointer));
  } else {
    _self = *(info[0].As<External<pybind::object>>().Data());
  }
}

pybind::object PythonObject::value() { return _self; }

void PythonObject::Finalize(Napi::Env env) {
  for (auto f : _funcs) {
    delete f;
  }
  _funcs.clear();
}

Napi::Value PythonObject::Next(const CallbackInfo &info) {
  if (!PyIter_Check(_self.ptr())) {
    Error::New(info.Env(), "Must be an iterator object")
        .ThrowAsJavaScriptException();
    return info.Env().Undefined();
  }
  PyObject *curr = PyIter_Next(_self.ptr());
  auto jsres = Object::New(info.Env());
  // See
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
  // This follow this iteration protocol.
  if (curr == NULL) {
    jsres.Set("done", true);
    jsres.Set("value", info.Env().Undefined());
  } else {
    jsres.Set("done", false);
    jsres.Set("value", PythonObject::NewInstance(
                           info.Env(),
                           pybind::reinterpret_borrow<pybind::object>(curr)));
  }
  return jsres;
}

Napi::Value PythonObject::Invoke(const CallbackInfo &info) {
  pybind::tuple args(info.Length());
  PyObject *args_ = args.release().ptr();
  PyObject *kwargs = NULL;
  int counter = 0;

  // Parse arguments
  for (size_t i = 0; i < info.Length(); i++) {
    try {
      PyObject *value = Cast(info.Env(), info[i], true);
      if (kwargs == NULL && IsKwargs(info[i])) {
        kwargs = value;
      } else {
        PyTuple_SET_ITEM(args_, counter++, value);
      }
    } catch (const std::invalid_argument &e) {
      // FIXME(Yorkie): just throw it if no type is supported.
      TypeError::New(info.Env(), e.what()).ThrowAsJavaScriptException();
      return info.Env().Undefined();
    }
  }

  // Resize the args length by the variable `counter`.
  _PyTuple_Resize(&args_, (Py_ssize_t)counter);

  // Invoke this function
  try {
    PyObject *result = PyObject_Call(_self.ptr(), args_, kwargs);
    if (!result)
      throw pybind::error_already_set();
    return PythonObject::NewInstance(
        info.Env(), pybind::reinterpret_borrow<pybind::object>(result));
  } catch (pybind::error_already_set &e) {
    if (e.matches(pybind::handle(PyExc_SystemExit))) {
      // FIXME(Yorkie): ignore the SystemExit error.
      return info.Env().Undefined();
    }
    PythonError::New(info.Env(), e).ThrowAsJavaScriptException();
    return info.Env().Undefined();
  }
}

Napi::Value PythonObject::CreateClass(const CallbackInfo &info) {
  std::string name = std::string(info[0].As<String>());
  Object jbase = info[1].As<Object>().Get(NODE_PYTHON_HANDLE_NAME).As<Object>();
  pybind::object base = ObjectWrap<PythonObject>::Unwrap(jbase)->value();
  pybind::object type =
      pybind::reinterpret_borrow<pybind::object>((PyObject *)&PyType_Type);
  pybind::dict attrs;

  // See https://docs.python.org/3.7/library/functions.html#type
  auto mClass = type(name.c_str(), pybind::make_tuple(base), attrs);
  return PythonObject::NewInstance(info.Env(), mClass);
}

Napi::Value PythonObject::IsCallable(const CallbackInfo &info) {
  int callable = PyCallable_Check(_self.ptr());
  return Number::New(info.Env(), callable);
}

Napi::Value PythonObject::IsIterator(const CallbackInfo &info) {
  int r = PyIter_Check(_self.ptr());
  return Boolean::New(info.Env(), r);
}

Napi::Value PythonObject::IsMapping(const CallbackInfo &info) {
  int r = PyMapping_Check(_self.ptr());
  return Boolean::New(info.Env(), r);
}

Napi::Value PythonObject::IsSequence(const CallbackInfo &info) {
  int r = PySequence_Check(_self.ptr());
  return Boolean::New(info.Env(), r);
}

Napi::Value PythonObject::ToBigDecimal(const CallbackInfo &info) {
  // See https://github.com/littledan/proposal-bigdecimal
  Error::New(info.Env(), "Not implemented").ThrowAsJavaScriptException();
  return info.Env().Null();
}

Napi::Value PythonObject::ToBigInt(const CallbackInfo &info) {
  PyObject *thisobj = _self.ptr();
  if (!PyLong_Check(thisobj)) {
    Error::New(info.Env(), "Must be a number type.")
        .ThrowAsJavaScriptException();
    return info.Env().Null();
  }
  int64_t v = PyLong_AsLongLong(thisobj);
  return BigInt::New(info.Env(), v);
}

Napi::Value PythonObject::ToPrimitive(const CallbackInfo &info) {
  PyObject *thisobj = _self.ptr();
  if (!thisobj) {
    return info.Env().Null();
  }
  // Check the boolean before number, because the PyLong_Check could recognize
  // both a boolean and a number.
  if (PyBool_Check(thisobj)) {
    return Boolean::New(info.Env(), PyLong_AsLong(thisobj) != 0);
  }
  if (PyLong_Check(thisobj) || PyFloat_Check(thisobj)) {
    return Number::New(info.Env(), PyFloat_AsDouble(thisobj));
  }
  return ToString(info);
}

Napi::Value PythonObject::ToString(const CallbackInfo &info) {
  return String::New(info.Env(), ToString());
}

Napi::Value PythonObject::ToPointer(const CallbackInfo &info) {
  auto pnative = _self.ptr();
  auto pointer = reinterpret_cast<uintptr_t>(pnative);
  fprintf(stderr, "to %p(native)\n", pnative);
  return Number::New(info.Env(), pointer);
}

// See
// https://github.com/python/cpython/blob/7247407c35330f3f6292f1d40606b7ba6afd5700/Objects/object.c#L367
std::string PythonObject::ToString() {
  std::string ret = std::string("");
  PyObject *s = PyObject_Str(_self.ptr());
  if (s == nullptr)
    return ret;

  if (PyBytes_Check(s)) {
    ret = std::string(PyBytes_AS_STRING(s), PyBytes_GET_SIZE(s));
  } else if (PyUnicode_Check(s)) {
    PyObject *t;
    t = PyUnicode_AsEncodedString(s, "utf-8", "backslashreplace");
    if (t != NULL) {
      ret = std::string(PyBytes_AS_STRING(t), PyBytes_GET_SIZE(t));
      Py_DECREF(t);
    }
  }
  Py_XDECREF(s);
  return ret;
}

Napi::Value PythonObject::SetClassMethod(const CallbackInfo &info) {
  std::string nameStr = std::string(info[0].As<String>());
  int r = PyObject_SetAttrString(
      _self.ptr(), nameStr.c_str(),
      Cast(info.Env(), info[1].As<Function>(), false, true));
  if (r == -1) {
    PyErr_Clear();
  }
  return Number::New(info.Env(), r);
}

Napi::Value PythonObject::Hash(const CallbackInfo &info) {
  Py_hash_t hash = PyObject_Hash(_self.ptr());
  return Number::New(info.Env(), hash);
}

Napi::Value PythonObject::HasAttr(const CallbackInfo &info) {
  std::string nameStr = std::string(info[0].As<String>());
  bool r = pybind::hasattr(_self, nameStr.c_str());
  return Boolean::New(info.Env(), r);
}

Napi::Value PythonObject::GetAttr(const CallbackInfo &info) {
  try {
    std::string nameStr = std::string(info[0].As<String>());
    pybind::object obj = _self.attr(nameStr.c_str());
    return PythonObject::NewInstance(info.Env(), obj);
  } catch (pybind::error_already_set &e) {
    Error::New(info.Env(), e.what()).ThrowAsJavaScriptException();
    return info.Env().Null();
  }
}

Napi::Value PythonObject::SetAttr(const CallbackInfo &info) {
  std::string nameStr = std::string(info[0].As<String>());
  int r = PyObject_SetAttrString(_self.ptr(), nameStr.c_str(),
                                 Cast(info.Env(), info[1]));
  if (r == -1) {
    PyErr_Clear();
  }
  return Number::New(info.Env(), r);
}

Napi::Value PythonObject::DelAttr(const CallbackInfo &info) {
  std::string nameStr = std::string(info[0].As<String>());
  pybind::delattr(_self, nameStr.c_str());
  return info.Env().Undefined();
}

Napi::Value PythonObject::GetItem(const CallbackInfo &info) {
  pybind::object itemVal;
  try {
    if (IsPythonObject(info[0])) {
      // parsing the key as `PythonObject`, specifically slice.
      Object src =
          info[0].As<Object>().Get(NODE_PYTHON_HANDLE_NAME).As<Object>();
      PythonObject *obj = ObjectWrap<PythonObject>::Unwrap(src);
      itemVal = _self[obj->value()];
    } else if (info[0].IsNumber()) {
      // if item key is a number
      int idx = info[0].As<Number>().Int32Value();
      itemVal = _self.cast<pybind::sequence>()[idx];
    } else {
      // otherwise, assert the key must be a string.
      std::string keystr = std::string(info[0].As<String>());
      itemVal = _self[keystr.c_str()];
    }

    if (itemVal.ptr() == NULL) {
      return info.Env().Null();
    } else {
      return PythonObject::NewInstance(info.Env(), itemVal);
    }
  } catch (pybind::error_already_set &e) {
    Error::New(info.Env(), e.what()).ThrowAsJavaScriptException();
    return info.Env().Null();
  }
}

Napi::Value PythonObject::SetItem(const CallbackInfo &info) {
  PyObject *value = Cast(info.Env(), info[1]);
  int r = -1;

  if (IsPythonObject(info[0])) {
    // parsing the key as `PythonObject`, specifically slice.
    Object src = info[0].As<Object>().Get(NODE_PYTHON_HANDLE_NAME).As<Object>();
    auto key = ObjectWrap<PythonObject>::Unwrap(src)->value();
    r = PyObject_SetItem(_self.ptr(), key.ptr(), value);
  } else if (info[0].IsNumber()) {
    // if item key is a number
    auto n = info[0].As<Number>().Int32Value();
    r = PySequence_SetItem(_self.ptr(), static_cast<ssize_t>(n), value);
  } else {
    // otherwise, assert the key must be a string.
    auto keystr = std::string(info[0].As<String>());
    r = PyObject_SetItem(_self.ptr(), pybind::str(keystr).ptr(), value);
  }

  if (r == -1) {
    PyErr_Clear();
  }
  return Number::New(info.Env(), r);
}

Napi::Value PythonObject::DelItem(const CallbackInfo &info) {
  int r = -1;
  if (info[0].IsNumber()) {
    // if item key is a number
    auto n = info[0].As<Number>().Int32Value();
    r = PySequence_DelItem(_self.ptr(), static_cast<ssize_t>(n));
  } else {
    // otherwise, assert the key must be a string.
    auto keystr = std::string(info[0].As<String>());
    r = PyObject_DelItem(_self.ptr(), pybind::str(keystr).ptr());
  }
  if (r == -1) {
    PyErr_Clear();
  }
  return Number::New(info.Env(), r);
}

inline bool PythonObject::IsKwargs(Napi::Value value) {
  if (!value.IsObject())
    return false;
  return value.As<Object>().HasOwnProperty(NODE_PYTHON_KWARGS_NAME);
}

inline bool PythonObject::IsBytes(Napi::Value value) {
  if (!value.IsObject())
    return false;
  return value.As<Object>().HasOwnProperty(NODE_PYTHON_BYTES_NAME);
}

inline bool PythonObject::IsPythonObject(Napi::Value value) {
  if (!value.IsObject())
    return false;
  auto obj = value.As<Object>();
  return obj.HasOwnProperty(NODE_PYTHON_HANDLE_NAME);
}

PyObject *PythonObject::Cast(Napi::Env env, String value) {
  // TODO(Yorkie): use CPython API instead
  return pybind::str(value).release().ptr();
}

PyObject *PythonObject::Cast(Napi::Env env, Boolean value) {
  // TODO(Yorkie): use CPython API instead
  return pybind::bool_(value.Value()).release().ptr();
}

PyObject *PythonObject::Cast(Napi::Env env, Number value) {
  // check if the value is integer or double.
  bool isInteger = env.Global()
                       .Get("Number")
                       .ToObject()
                       .Get("isInteger")
                       .As<Function>()
                       .Call({value})
                       .ToBoolean()
                       .Value();
  // handle the number
  if (isInteger) {
    return pybind::int_(value.Int32Value()).release().ptr();
  } else {
    return pybind::float_(value.DoubleValue()).release().ptr();
  }
}

PyObject *PythonObject::Cast(Napi::Env env, Function value,
                             bool finalizeFuncType, bool isClassMethod) {
  // FIXME(Yorkie): where to free this?
  auto fn = new PythonFunction(env, value, this, isClassMethod);
  if (finalizeFuncType) {
    fn->addFinalizer();
  }
  _funcs.push_back(fn);
  return fn->target();
}

PyObject *PythonObject::Cast(Napi::Env env, Array value,
                             bool finalizeFuncType) {
  // FIXME(Yorkie): use tuple instead?
  auto list = PyList_New(0);
  for (uint32_t i = 0; i < value.Length(); i++) {
    auto item = Cast(env, value[i], finalizeFuncType);
    PyList_Insert(list, static_cast<ssize_t>(i), item);
  }
  return list;
}

PyObject *PythonObject::Cast(Napi::Env env, Object value,
                             bool finalizeFuncType) {
  auto names = value.GetPropertyNames();
  auto dict = PyDict_New();

  for (uint32_t i = 0; i < names.Length(); i++) {
    std::string nameStr = names.Get(i).As<String>();
    // skip if the name is NODE_PYTHON_KWARGS_NAME(__kwargs)
    if (nameStr == NODE_PYTHON_KWARGS_NAME) {
      continue;
    }
    auto prop = value.Get(nameStr.c_str());
    auto val = Cast(env, prop, finalizeFuncType);
    PyDict_SetItemString(dict, nameStr.c_str(), val);
  }

  if (IsKwargs(value)) {
    // FIXME(yorkie): just return a dict object if it's for kwargs.
    return dict;
  }
  // otherwise, we create a template class and object by attrs.
  pybind::object type =
      pybind::reinterpret_borrow<pybind::object>((PyObject *)&PyType_Type);
  pybind::dict attrs = pybind::reinterpret_borrow<pybind::dict>(dict);
  // FIXME(yorkie): use "JSObject" as the default object name to Python.
  return type("JSObject", pybind::make_tuple(), attrs)().release().ptr();
}

PyObject *PythonObject::Cast(Napi::Env env, Napi::Value value,
                             bool finalizeFuncType) {
  if (value.IsNull() || value.IsUndefined()) {
    return Py_None;
  }
  if (value.IsString()) {
    return Cast(env, value.As<String>());
  }
  if (value.IsBoolean()) {
    return Cast(env, value.As<Boolean>());
  }
  if (value.IsNumber()) {
    return Cast(env, value.As<Number>());
  }
  if (value.IsObject()) {
    if (IsPythonObject(value)) {
      Object target =
          value.As<Object>().Get(NODE_PYTHON_HANDLE_NAME).As<Object>();
      PythonObject *npo = ObjectWrap<PythonObject>::Unwrap(target);
      return npo->value().release().ptr();
    }
    if (IsBytes(value)) {
      Napi::Value bytesVal = value.As<Object>().Get(NODE_PYTHON_VALUE_NAME);
      return pybind::bytes(bytesVal.As<String>()).release().ptr();
    }
    if (value.IsFunction()) {
      return Cast(env, value.As<Function>(), finalizeFuncType, false);
    }
    if (value.IsArray()) {
      // for JS array, just make a new list as the container.
      return Cast(env, value.As<Array>(), finalizeFuncType);
    } else {
      // Otherwise, the type might be object, converts to `dict`.
      return Cast(env, value.As<Object>(), finalizeFuncType);
    }
  }

  throw std::invalid_argument(
      "detected unsupported argument type from JavaScript to Python");
}
