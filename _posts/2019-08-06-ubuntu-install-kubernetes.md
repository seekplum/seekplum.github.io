---
layout: post
title: Ubuntu安装kubernetes
categories: kubernetes
tags: docker kubernetes
thread: kubernetes
---

## 更新系统

```bash
sudo apt-get update
sudo apt-get install apt-transport-https
sudo apt-get upgrade
```

## 安装virtualbox

```bash
wget -q https://www.virtualbox.org/download/oracle_vbox_2016.asc -O- | sudo apt-key add -
wget -q https://www.virtualbox.org/download/oracle_vbox.asc -O- | sudo apt-key add -

sudo add-apt-repository "deb http://download.virtualbox.org/virtualbox/debian xenial contrib"

sudo apt-get update
sudo apt install virtualbox-6.0
# sudo apt install virtualbox-ext-pack

wget -O /tmp/Oracle_VM_VirtualBox_Extension_Pack-6.0.10.vbox-extpack https://download.virtualbox.org/virtualbox/6.0.10/Oracle_VM_VirtualBox_Extension_Pack-6.0.10.vbox-extpack
vboxmanage extpack install /tmp/Oracle_VM_VirtualBox_Extension_Pack-6.0.10.vbox-extpack
```

## 安装kvm

```bash
sudo apt install libvirt-clients libvirt-daemon-system qemu-kvm

curl -LO https://storage.googleapis.com/minikube/releases/latest/docker-machine-driver-kvm2 && sudo install docker-machine-driver-kvm2 /usr/local/bin/
```

## 安装minikube

```bash
wget https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64

chmod +x minikube-linux-amd64

sudo mv minikube-linux-amd64 /usr/local/bin/minikube
```

## 安装kubectl

```bash
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -

echo "deb http://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee /etc/apt/sources.list.d/kubernetes.list

sudo apt update
sudo apt -y install kubectl
```

## 检查版本

```bash
kubectl version -o json
```

## 启动minikube

VirtualBox不支持在虚拟机里开启另一个嵌套的虚拟机。如果确实需要运行这种嵌套的虚拟化场景，需要尝试VMWare Workstation 11.,详见[superuser.com/questions...](https://superuser.com/questions/1138980/this-computer-doesnt-have-vt-x-amd-v-enabled-enabling-it-in-the-bios-is-mandat)

```bash
minikube start --vm-driver kvm2
```
