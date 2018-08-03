const express = require('express');
const bodyParser = require('body-parser');

const app = express();

const Docker = require('dockerode');

const docker = new Docker({ socketPath: '/var/run/docker.sock' });
const sys = require('sys');
const exec = require('child_process').exec;
const fs = require('fs');
// const docker = new Docker(); // 위의 코드와 일치

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 아래에서 server를 정의내려줘야 stopServer 함수에서 server.close()를 호출할 수 있다
const server = app.listen(8080, () => {
  console.log('도커 컨트롤러 시작! 포트 8080에서 요청 기다리고 있습니다.');
});

const stopServer = () => {
  server.close(); // 위에서 시작한 새로운 서버를 닫아준다
  // 테스트할 때 필요한 툴 (프로덕션 상에서는 상관없음)
};

// API: /docker/api/v1/listContainers (GET)
// 설명: 로컬에서 실행 중인 도커 컨테이너의 아이디값들을 리스트(어레이)의 형식으로 리턴해준다.
app.get('/docker/api/v1/listContainers', async (req, res) => {
  const response = await docker.listContainers();
  const containerIDs = [];
  for (const containerObj of response) {
    containerIDs.push(containerObj.Id);
  }
  res.status(200);
  res.send(containerIDs);
});

// API: /docker/api/v1/createContainer (POST)
// 설명: POST 데이터로 실행시킬 컨테이너의 정보를 보내면, 로컬에서 그 spec에 맞게 컨테이너를 실행시킨다.
app.post('/', async (req, res) => {
  // pass
});

// API: /docker/api/v1/img-pull (POST)
// 설명: POST 데이터에 도커 이미지 정보를 json 형식으로 넣고 send하면 그 내역에 맞는 도커 이미지를 로컬에 풀한다.
// 형식: myrepo/myname:tag 형식으로 post에 image:< message >, message 안에 넣어 post 한다.
app.post('/docker/api/v1/img-pull/', async (req, res) => {
  const ImgName = req.body.image;
  // console.log(ImgName);
  // console.log(req);
  const docker = new Docker({ host: '127.0.0.1' });
  docker.pull(ImgName, (err, stream) => {
    if (!err) {
      console.log('Successfully pulled');
      res.status(200);
      res.json({ status: 'success' });
    } else {
      console.log(err);
      res.status(400);
      res.json(err);
    }
  });
});

// API: /docker/api/v1/img-build (POST)
// 설명: POST 매서드를 이용하여 dockerfile의 경로와 tag명을 파싱해 도커 이미지를 빌드한다.
// 형식: post 안의 메시지 형식은 다음 { path : <pathname>, tag : <tagname> } 와 같다.
app.post('/docker/api/v1/img-build/', async (req, res) => {
  const pathName = req.body.path;
  const tagName = req.body.tag;
  const docker = new Docker({ host: '127.0.0.1' });
  docker.buildImage(pathName, { t: tagName }, (err, stream) => {
    if (err) {
      res.json(err);
      res.status(400);
    } else {
      res.status(200);
    }
    // stream.pipe(process.stdout, {
    //   end: true
    // });
    // stream.on('end', () => {
    //   res.status(200);
    // });
  });
});


// API: /docker/api/v1/img-delete (POST)
// 설명: POST 매서드를 이용하여 image 이름을 파싱하여 로컬에서 삭제한다.
// 형식: post 안의 메시지 형식은 다음 { image: <imageName> } 와 같다.
app.post('/docker/api/v1/img-delete/', async (req, res) => {
  const imageName = req.body.image;
  const docker = new Docker({ host: '127.0.0.1' });
  docker.getImage(imageName).remove((err, data) => {
    if (err) {
      console.log(err);
    }
    console.log(data);
  });
});


// API: /docker/api/v1/img-delete-all (GET)
// 설명: GET 매서드를 이용하여 모든 이미지들을 삭제한다.
app.get('/docker/api/v1/img-delete-all/', async (req, res) => {
  exec('sudo docker rmi -f $(sudo docker images -q)', (err, stdout, stderr) => {
    if (err) {
      // 명령 시도 자체에 오류가 있을 경우.
      console.log(err);
      res.json(err);
    } else {
      // 콘솔에서 오류가 발생했을 경우.
      if (stderr) {
        console.log(stderr);
        res.json(stderr);
      } else {
        // 오류가 발생하지 않고 단순 처리 구문만 나왔을 경우.
        console.log(stdout);
        res.json(stdout);
      }
    }
  });
});


// API: /docker/api/v1/run (POST)
// 설명: POST 매서드를 이용하여 image와 path를 파싱하여 해당 path의 image를 run 하도록 수행.
// 형식: post 안의 메시지 형식은 다음 { image: <image name>, path : [ "bash", "-c", "uname -s"] .. (예시)) 와 같다.
app.post('/docker/api/v1/img-run/', async (req, res) => {
  const imageName = req.body.image;
  const pathArray = req.body.path;
  docker.run(imageName, pathArray, process.stdout, (err, data, container) => {
    if (err) {
      res.json(err);
      console.log(err);
    } else {
      console.log(data);
      res.json(data);
    }
  });
});


// API: /docker/api/v1/stop (POST)
// 설명: POST 매서드를 이용하여 container name을 파싱하여 해당 컨테이너를 종료한다.
// 형식: post 안의 메시지 형식은 다음 { 'container' : <containerName> } 와 같다.
app.post('/docker/api/v1/stop/', async (req, res) => {
  const containerName = req.body.container;
  container = docker.getContainer(containerName);
  container.stop();
  res.json('Done!');
});


// API: /docker/api/v1/stop-all (POST)
// 설명: POST 매서드를 이용하여 로컬에서 실행중인 모든 도커 컨테이너를 종료한다.
// 관리자 권한을 필요로 함.
app.post('/docker/api/v1/stop-all/', async (req, res) => {
  exec('sudo docker stop $(sudo docker ps -a -q )');
});


// API: /docker/api/v1/state/ (POST)
// 설명: POST 매서드를 이용, container-name을 파싱하여 해당 컨테이너의 상태를 json으로 send.
// 형식: 'container':<Container Name>
app.post('/docker/api/v1/state/', async (req, res) => {
  ContainerName = req.body.container;
  const Response = { PS: '', STATS: '' };
  exec(`sudo docker ps -a | grep ${ContainerName} > ./tmpPs`, (err, stdout, stderr) => {
    exec('sudo chmod +wx ./tmpPs');
    fs.readFile('./tmpPs', 'utf8', (err, data) => {
      if (err) {
        console.log(err);
        Response.PS = err;
      } else {
        console.log(data);
        Response.PS = data;
      }
    });
  });
  exec(`sudo docker stats ${ContainerName} --no-stream > ./tmpStats`, (err, stdout, stderr) => {
    exec('sudo chmod +wx ./tmpStats');
    fs.readFile('./tmpStats', 'utf8', (err, data) => {
      if (err) {
        console.log(err);
        Response.STATS = err;
      } else {
        console.log(data);
        Response.STATS = data;
      }
      console.log(Response);
      res.json(Response);
    });
  });
});


// API: /docker/api/v1/log/ (POST)
// 설명: POST 매서드를 이용, container-name을 파싱하여 해당 컨테이너의 로그를 json으로 send.
// 형식: 'container':<Container Name>, 반드시 슈퍼유저 권한을 획득하고 진행해야 함.
// 출력: 10줄만 출력
app.post('/docker/api/v1/log/', async (req, res) => {
  ContainerName = req.body.container;
  exec(`sudo tail -10 /var/lib/docker/containers/${ContainerName}*/${ContainerName}*-json.log`, (err, stdout, stderr) => {
    if (err) {
      res.json(err);
    } else {
      res.json(stdout);
    }
  });
});


// API: /docker/api/v1/up/ (POST)
// 설명: POST 매서드를 이용, path를 파싱하여 해당 경로에서 compose-up 수행.
// 형식: path:<Path-Name>, 반드시 슈퍼유저 권한을 획득하고 진행해야 함.
app.post('/docker/api/v1/up/', async (req, res) => {
  pathName = req.body.path;
  exec(`docker-compose p -d --build ${pathName}`, (err, stdout, stderr) => {
    if (err) {
      res.json(err);
    } else {
      res.json(stdout);
    }
  });
});


module.exports = {
  server,
  stopServer,
};
