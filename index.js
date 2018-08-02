const express = require('express');
const bodyParser = require('body-parser');

const app = express();

const Docker = require('dockerode');

const docker = new Docker({ socketPath: '/var/run/docker.sock' });
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

module.exports = {
  server,
  stopServer,
};
