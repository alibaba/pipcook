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
        "pybind11/include",
        "<!@(pwd)/.miniconda/include/python3.7m",
      ],
      "library_dirs": [
        "<!@(pwd)/.miniconda/lib",
      ],
      "libraries": [
        "-lpython3.7m",
        "-Wl,-rpath,'<!@(pwd)/.miniconda/lib'",
      ],
      "defines": [
        "NAPI_CPP_EXCEPTIONS",
        "NAPI_EXPERIMENTAL",
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