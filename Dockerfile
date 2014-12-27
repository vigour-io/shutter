FROM nathan7/arch
RUN pacman -Sy base-devel python2 --noconfirm --needed
RUN pacman -Sy git openssh --noconfirm --needed
RUN ln -sv python2 /usr/bin/python
RUN curl http://nodejs.org/dist/v0.10.31/node-v0.10.31-$(uname | tr A-Z a-z)-x64.tar.gz | tar xzv --strip-components=1 -C /usr
COPY ssh /root/.ssh
RUN chmod 0600 /root/.ssh/id_rsa
ADD . /app
WORKDIR /app
RUN npm install
RUN npm install -g forever
ENTRYPOINT ["npm", "start"]
EXPOSE 8000
