FROM nvidia/cuda:10.0-cudnn7-devel-ubuntu16.04
LABEL version=1.0
LABEL description="docker image for pipcook runtime"

## will use 7778 port
EXPOSE 7778

## install pipcook dependencies

RUN apt-get update || :
RUN apt-get install -y python-software-properties software-properties-common
RUN echo '\n' | add-apt-repository ppa:chris-lea/node.js
RUN apt-get update || :
RUN echo 'Y' | apt-get install nodejs
RUN apt install nodejs-legacy
RUN echo 'Y' | apt install npm
RUN npm install n -g
RUN apt install wget
RUN n stable
RUN PATH="$PATH"
RUN npm install @pipcook/pipcook-cli -g
RUN echo 'Y' | apt-get install python3-pip
RUN mv /usr/bin/python /usr/bin/python.bak
RUN ln -s /usr/bin/python3.5 /usr/bin/python
RUN ln -s /usr/bin/pip3 /usr/bin/pip
# RUN cd /home && pipcook-cli init

ENV TF_FORCE_GPU_ALLOW_GROWTH=true
ENV LD_LIBRARY_PATH=/usr/local/cuda-10.0/lib64