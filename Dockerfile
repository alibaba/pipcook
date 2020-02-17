FROM nvidia/cuda:10.1-cudnn7-devel
LABEL version=1.0
LABEL description="docker image for pipcook runtime"

## will use 7778 port
EXPOSE 7778

## install pipcook dependencies

RUN apt-get update || :
RUN echo 'Y' | apt install software-properties-common
RUN echo '\n' | add-apt-repository ppa:deadsnakes/ppa
RUN echo 'Y' | apt install python3.7
RUN echo 'Y' | apt-get install python3-setuptools
RUN echo 'Y' | apt-get install curl
RUN curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
RUN python3.7 get-pip.py
RUN ln -s /usr/bin/python3.7 /usr/bin/python
RUN pip install torch torchvision
RUN pip install opencv-python
RUN echo 'Y' | apt install git
RUN echo 'Y' | apt install build-essential
RUN echo 'Y' | apt-get install python3.7-dev
RUN pip install 'git+https://github.com/facebookresearch/fvcore'
RUN pip install cython
RUN pip install 'git+https://github.com/cocodataset/cocoapi.git#subdirectory=PythonAPI'
RUN git clone https://github.com/facebookresearch/detectron2.git
RUN cd detectron2 && python setup.py build develop
RUN echo 'Y' | apt-get install -y libsm6 libxext6 libxrender-dev

RUN apt-get update || :
RUN apt-get install -y software-properties-common
RUN curl -sL https://deb.nodesource.com/setup_12.x
RUN echo 'Y' | apt-get install nodejs
RUN echo 'Y' | apt install npm
RUN npm install n -g
RUN apt install wget
RUN n stable
RUN PATH="$PATH"
RUN npm install @pipcook/pipcook-cli -g
RUN mv /usr/bin/python /usr/bin/python.bak
RUN ln -s /usr/bin/python3.7 /usr/bin/python
RUN apt install lsof

ENV TF_FORCE_GPU_ALLOW_GROWTH=true
ENV LD_LIBRARY_PATH=/usr/local/cuda-10.1/lib64
## add cuda 10.0 support
COPY --from=nvidia/cuda:10.0-cudnn7-devel /usr/local/cuda-10.0 /usr/local/cuda-10.0
ENV LD_LIBRARY_PATH=/usr/local/cuda-10.0/lib64:${LD_LIBRARY_PATH}
