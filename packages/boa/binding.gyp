{
  "targets": [
    {
      "target_name": "boa",
      "sources": [
        "src/binding.cc",
        "src/core/node.cc",
        "src/core/module.cc",
        "src/core/object.cc",
        "src/core/error.cc",
        "src/core/function.cc",
        "src/core/reference.cc",
      ],
      "cflags!": [
        "-fno-exceptions",
        "-fno-rtti",
      ],
      "cflags_cc!": [
        "-std=c++11",
        "-stdlib=libc++",
        "-fno-exceptions",
        "-fno-rtti",
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "pybind11/src/include",
        "<!@(node -p \"require('./tools/utils').getCondaPath()\")/include/python3.7m",
      ],
      "library_dirs": [
        "<!@(node -p \"require('./tools/utils').getCondaPath()\")/lib",
      ],
      "libraries": [
        "-lpython3.7m",
        "-Wl,-rpath,'<!@(node -p \"require('./tools/utils').getCondaPath()\")/lib'",
      ],
      "defines": [
        "NAPI_CPP_EXCEPTIONS",
        "NAPI_EXPERIMENTAL",
        "NAPI_VERSION=6",
      ],
      "conditions": [
        ['OS=="mac"', {
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "GCC_ENABLE_CPP_RTTI": "YES",
          },
        }],
      ],
    },
  ]
}
