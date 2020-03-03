FROM nvidia/cuda:10.1-cudnn7-devel
LABEL version=1.0
LABEL description="docker image for pipcook runtime"

## will use 7778 port
EXPOSE 7778

## install pipcook dependencies

RUN apt-get update && echo 'Y' | apt install software-properties-common && echo '\n' | add-apt-repository ppa:deadsnakes/ppa \
  && echo 'Y' | apt install python3.7 && echo 'Y' | apt-get install python3-setuptools && echo 'Y' | apt-get install curl \
  && curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py && python3.7 get-pip.py && ln -s /usr/bin/python3.7 /usr/bin/python \
  && pip install torch torchvision && pip install opencv-python && echo 'Y' | apt install git && echo 'Y' | apt install build-essential \
  && echo 'Y' | apt-get install python3.7-dev && pip install 'git+https://github.com/facebookresearch/fvcore' && pip install cython \
  && pip install 'git+https://github.com/cocodataset/cocoapi.git#subdirectory=PythonAPI' \
  && pip install 'git+https://github.com/facebookresearch/detectron2.git' \
  && echo 'Y' | apt-get install -y libsm6 libxext6 libxrender-dev

RUN apt-get update && apt-get install -y software-properties-common && curl -sL https://deb.nodesource.com/setup_12.x \
  && echo 'Y' | apt-get install nodejs && echo 'Y' | apt install npm \
  && npm install n -g && apt install wget && n stable && PATH="$PATH" \
  && npm install @pipcook/pipcook-cli -g && mv /usr/bin/python /usr/bin/python.bak && ln -s /usr/bin/python3.7 /usr/bin/python \
  && apt install lsof

ENV TF_FORCE_GPU_ALLOW_GROWTH=true
ENV LD_LIBRARY_PATH=/usr/local/cuda-10.1/lib64
## add cuda 10.0 support
COPY --from=nvidia/cuda:10.0-cudnn7-devel /usr/local/cuda-10.0 /usr/local/cuda-10.0
ENV LD_LIBRARY_PATH=/usr/local/cuda-10.0/lib64:${LD_LIBRARY_PATH}
