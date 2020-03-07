FROM nvidia/cuda:10.1-cudnn7-devel
LABEL version=1.0
LABEL description="docker image for pipcook runtime"

## will use 7778 port
EXPOSE 7778

## install pipcook dependencies

RUN apt-get update \
  && apt-get --no-install-recommends install -y apt-utils ca-certificates software-properties-common \
  && echo '\n' | add-apt-repository ppa:deadsnakes/ppa \
  && apt-get --no-install-recommends install -y python3.7 curl python3-setuptools \
  && curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py \
  && python3.7 get-pip.py && ln -s /usr/bin/python3.7 /usr/bin/python \
  && pip install torch torchvision && pip install opencv-python \
  && apt-get --no-install-recommends install git build-essential python3.7-dev \
  && pip install 'git+https://github.com/facebookresearch/fvcore' \
  && pip install cython \
  && pip install 'git+https://github.com/cocodataset/cocoapi.git#subdirectory=PythonAPI' \
  && pip install 'git+https://github.com/facebookresearch/detectron2.git' \
  && apt-get --no-install-recommends install -y libsm6 libxext6 libxrender-dev

RUN curl -sL https://deb.nodesource.com/setup_12.x \
  && apt-get --no-install-recommends -y install nodejs npm wget \
  && npm install n -g && n stable && PATH="$PATH" \
  && npm install @pipcook/pipcook-cli -g && mv /usr/bin/python /usr/bin/python.bak && ln -s /usr/bin/python3.7 /usr/bin/python \
  && apt-get --no-install-recommends -y install lsof

ENV TF_FORCE_GPU_ALLOW_GROWTH=true
ENV LD_LIBRARY_PATH=/usr/local/cuda-10.1/lib64
## add cuda 10.0 support
COPY --from=nvidia/cuda:10.0-cudnn7-devel /usr/local/cuda-10.0 /usr/local/cuda-10.0
ENV LD_LIBRARY_PATH=/usr/local/cuda-10.0/lib64:${LD_LIBRARY_PATH}
